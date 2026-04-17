import { validationResult } from 'express-validator';
import Campaign from '../models/Campaign.js';
import Lead from '../models/Lead.js';
import Template from '../models/Template.js';
import SMTPAccount from '../models/SMTPAccount.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { runCampaign, stopCampaignExecution } from '../services/campaignRunner.js';

export const createCampaign = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new ApiError(400, errors.array()[0].msg);

  const { name, leadIds, templateIds, smtpIds, delayMs } = req.body;

  const totalCount = leadIds.length;

  const campaign = await Campaign.create({
    userId: req.user._id,
    name: name.trim(),
    leadIds,
    templateIds,
    smtpIds,
    delayMs: Number(delayMs || 2000),
    totalCount,
  });

  res.status(201).json({ campaign });
});

export const listCampaigns = asyncHandler(async (req, res) => {
  const items = await Campaign.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ items });
});

export const getCampaign = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findOne({ _id: req.params.id, userId: req.user._id })
    .populate('leadIds', 'name email company status')
    .populate('templateIds', 'name subject variables')
    .populate('smtpIds', 'label email isActive');

  if (!campaign) throw new ApiError(404, 'Campaign not found');

  res.status(200).json({ campaign });
});

export const startCampaign = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findOne({ _id: req.params.id, userId: req.user._id });
  if (!campaign) throw new ApiError(404, 'Campaign not found');

  if (campaign.status === 'running') throw new ApiError(400, 'Campaign already running');

  const [leadCount, templateCount, smtpCount] = await Promise.all([
    Lead.countDocuments({ _id: { $in: campaign.leadIds }, userId: req.user._id, status: 'active' }),
    Template.countDocuments({ _id: { $in: campaign.templateIds }, userId: req.user._id }),
    SMTPAccount.countDocuments({ _id: { $in: campaign.smtpIds }, userId: req.user._id, isActive: true }),
  ]);

  if (!leadCount || !templateCount || !smtpCount) {
    throw new ApiError(400, 'Campaign needs active leads, templates, and SMTP accounts');
  }

  campaign.status = 'running';
  campaign.startedAt = new Date();
  campaign.completedAt = null;
  campaign.sentCount = 0;
  campaign.failedCount = 0;
  campaign.totalCount = leadCount;
  await campaign.save();

  runCampaign(campaign._id, req.user._id);

  res.status(200).json({ message: 'Campaign started' });
});

export const stopCampaign = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findOne({ _id: req.params.id, userId: req.user._id });
  if (!campaign) throw new ApiError(404, 'Campaign not found');

  if (campaign.status !== 'running') throw new ApiError(400, 'Campaign is not running');

  stopCampaignExecution(campaign._id);

  res.status(200).json({ message: 'Campaign stop requested' });
});

export const deleteCampaign = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!campaign) throw new ApiError(404, 'Campaign not found');
  res.status(200).json({ message: 'Campaign deleted' });
});
