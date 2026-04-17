import Log from '../models/Log.js';
import Campaign from '../models/Campaign.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listLogs = asyncHandler(async (req, res) => {
  const { campaignId, status, startDate, endDate, page = 1, limit = 20 } = req.query;

  const query = { userId: req.user._id };
  if (campaignId) query.campaignId = campaignId;
  if (status && status !== 'all') query.status = status;

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    Log.find(query).sort({ timestamp: -1 }).skip(skip).limit(Number(limit)),
    Log.countDocuments(query),
  ]);

  const campaignIds = [...new Set(items.map((item) => String(item.campaignId)))];
  const campaigns = await Campaign.find({ _id: { $in: campaignIds }, userId: req.user._id })
    .select('name')
    .lean();
  const campaignMap = new Map(campaigns.map((c) => [String(c._id), c.name]));

  res.status(200).json({
    items: items.map((item) => ({
      ...item.toObject(),
      campaignName: campaignMap.get(String(item.campaignId)) || 'Unknown',
    })),
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});

export const logStats = asyncHandler(async (req, res) => {
  const [total, sent, failed] = await Promise.all([
    Log.countDocuments({ userId: req.user._id }),
    Log.countDocuments({ userId: req.user._id, status: 'sent' }),
    Log.countDocuments({ userId: req.user._id, status: 'failed' }),
  ]);

  const successRate = total ? Number(((sent / total) * 100).toFixed(2)) : 0;

  res.status(200).json({ total, sent, failed, successRate });
});
