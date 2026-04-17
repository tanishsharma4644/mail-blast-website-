import Campaign from '../models/Campaign.js';
import Lead from '../models/Lead.js';
import Template from '../models/Template.js';
import SMTPAccount from '../models/SMTPAccount.js';
import Log from '../models/Log.js';
import { sendEmail } from './emailService.js';
import { shuffle, delay } from '../utils/shuffle.js';
import { decrypt } from '../utils/encrypt.js';

const runningCampaigns = new Map();

function applyTemplate(str, lead) {
  return String(str ?? '')
    .replace(/{{\s*name\s*}}/gi, lead.name || '')
    .replace(/{{\s*company\s*}}/gi, lead.company || '');
}

function getJitteredDelay(baseMs) {
  const base = Math.max(300, Number(baseMs || 2000));
  // Add +-35% delay jitter to avoid fixed sending rhythm.
  const jitterRatio = 0.35;
  const jitter = Math.floor(base * jitterRatio);
  return Math.max(250, base + Math.floor(Math.random() * (jitter * 2 + 1)) - jitter);
}

async function pickAvailableSmtpAccount({ smtpAccounts, userId }) {
  if (!smtpAccounts.length) return null;

  const randomized = shuffle([...smtpAccounts]);
  for (const smtp of randomized) {
    const freshSmtp = await SMTPAccount.findOne({ _id: smtp._id, userId }).select('+appPassword');
    if (!freshSmtp) continue;

    const beforeReset = freshSmtp.sentToday;
    freshSmtp.resetIfNeeded();
    if (freshSmtp.sentToday !== beforeReset) {
      await SMTPAccount.updateOne(
        { _id: freshSmtp._id },
        { sentToday: freshSmtp.sentToday, lastResetDate: freshSmtp.lastResetDate },
      );
    }

    if (freshSmtp.sentToday < freshSmtp.dailyLimit) {
      return {
        ...smtp,
        appPassword: decrypt(freshSmtp.appPassword),
      };
    }
  }

  return null;
}

export function stopCampaignExecution(campaignId) {
  runningCampaigns.set(String(campaignId), false);
}

export async function runCampaign(campaignId, userId) {
  runningCampaigns.set(String(campaignId), true);

  const campaign = await Campaign.findOne({ _id: campaignId, userId });
  if (!campaign) return;

  const leads = await Lead.find({ _id: { $in: campaign.leadIds }, userId, status: 'active' }).lean();
  const templates = await Template.find({ _id: { $in: campaign.templateIds }, userId }).lean();
  const smtpAccounts = await SMTPAccount.find({ _id: { $in: campaign.smtpIds }, userId, isActive: true }).lean();

  if (!leads.length || !templates.length || !smtpAccounts.length) {
    await Campaign.updateOne({ _id: campaign._id }, { status: 'failed', completedAt: new Date() });
    return;
  }

  const shuffledLeads = shuffle([...leads]);
  const shuffledTemplates = shuffle([...templates]);

  for (let i = 0; i < shuffledLeads.length; i += 1) {
    if (!runningCampaigns.get(String(campaignId))) {
      await Campaign.updateOne({ _id: campaign._id }, { status: 'stopped', completedAt: new Date() });
      return;
    }

    const lead = shuffledLeads[i];
    const template = shuffledTemplates[i % shuffledTemplates.length];
    const smtp = await pickAvailableSmtpAccount({ smtpAccounts, userId });
    if (!smtp) {
      await Log.create({
        campaignId: campaign._id,
        userId,
        leadEmail: lead.email,
        smtpUsed: 'N/A',
        templateUsed: template.name,
        status: 'failed',
        errorMessage: 'All SMTP accounts reached their daily limits',
        timestamp: new Date(),
      });

      await Campaign.updateOne({ _id: campaign._id }, { $inc: { failedCount: 1 } });
      continue;
    }

    const html = applyTemplate(template.htmlBody, lead);
    const subject = applyTemplate(template.subject, lead);

    try {
      await sendEmail({
        to: lead.email,
        subject,
        html,
        smtpConfig: smtp,
      });

      await Log.create({
        campaignId: campaign._id,
        userId,
        leadEmail: lead.email,
        smtpUsed: smtp.email,
        templateUsed: template.name,
        status: 'sent',
        timestamp: new Date(),
      });

      // Increment SMTP counter
      await SMTPAccount.updateOne(
        { _id: smtp._id },
        { $inc: { sentToday: 1 } },
      );

      await Campaign.updateOne({ _id: campaign._id }, { $inc: { sentCount: 1 } });
    } catch (error) {
      await Log.create({
        campaignId: campaign._id,
        userId,
        leadEmail: lead.email,
        smtpUsed: smtp.email,
        templateUsed: template.name,
        status: 'failed',
        errorMessage: error.message,
        timestamp: new Date(),
      });

      await Campaign.updateOne({ _id: campaign._id }, { $inc: { failedCount: 1 } });
    }

    if (i < shuffledLeads.length - 1) {
      await delay(getJitteredDelay(campaign.delayMs || 2000));
    }
  }

  await Campaign.updateOne(
    { _id: campaign._id },
    { status: 'completed', completedAt: new Date() },
  );
  runningCampaigns.delete(String(campaignId));
}
