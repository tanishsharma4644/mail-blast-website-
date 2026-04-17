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
  return str
    .replace(/{{\s*name\s*}}/gi, lead.name || '')
    .replace(/{{\s*company\s*}}/gi, lead.company || '');
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
  const smtpAccountsRaw = await SMTPAccount.find({ _id: { $in: campaign.smtpIds }, userId, isActive: true }).select('+appPassword').lean();

  const smtpAccounts = smtpAccountsRaw.map((smtp) => ({
    ...smtp,
    appPassword: decrypt(smtp.appPassword),
  }));

  if (!leads.length || !templates.length || !smtpAccounts.length) {
    await Campaign.updateOne({ _id: campaign._id }, { status: 'failed', completedAt: new Date() });
    return;
  }

  const shuffledLeads = shuffle([...leads]);
  const shuffledTemplates = shuffle([...templates]);
  const shuffledSmtp = shuffle([...smtpAccounts]);

  for (let i = 0; i < shuffledLeads.length; i += 1) {
    if (!runningCampaigns.get(String(campaignId))) {
      await Campaign.updateOne({ _id: campaign._id }, { status: 'stopped', completedAt: new Date() });
      return;
    }

    const lead = shuffledLeads[i];
    const template = shuffledTemplates[i % shuffledTemplates.length];
    let smtp = shuffledSmtp[i % shuffledSmtp.length];

    // Check daily limit for SMTP account
    const freshSmtp = await SMTPAccount.findById(smtp._id).select('+appPassword');
    if (freshSmtp) {
      freshSmtp.resetIfNeeded();
      
      if (freshSmtp.sentToday >= freshSmtp.dailyLimit) {
        console.log(`[CAMPAIGN] SMTP ${smtp.email} limit reached (${freshSmtp.sentToday}/${freshSmtp.dailyLimit})`);
        
        await Log.create({
          campaignId: campaign._id,
          userId,
          leadEmail: lead.email,
          smtpUsed: smtp.email,
          templateUsed: template.name,
          status: 'failed',
          errorMessage: `SMTP limit reached: ${freshSmtp.sentToday}/${freshSmtp.dailyLimit} emails sent today`,
          timestamp: new Date(),
        });

        await Campaign.updateOne({ _id: campaign._id }, { $inc: { failedCount: 1 } });
        continue;
      }
    }

    const html = applyTemplate(template.htmlBody, lead);
    const subject = applyTemplate(template.subject, lead);

    try {
      console.log(`[CAMPAIGN] Sending to ${lead.email} via ${smtp.email}`);
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
      await delay(campaign.delayMs || 2000);
    }
  }

  await Campaign.updateOne(
    { _id: campaign._id },
    { status: 'completed', completedAt: new Date() },
  );
  runningCampaigns.delete(String(campaignId));
}
