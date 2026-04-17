import { validationResult } from 'express-validator';
import SMTPAccount from '../models/SMTPAccount.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { encrypt } from '../utils/encrypt.js';

function getAccountOwnerFilter(req) {
  return {
    $or: [
      { userId: req.user._id },
      { ownerEmail: req.user.email },
    ],
  };
}

function mapSmtpPublic(smtp) {
  return {
    id: smtp._id,
    label: smtp.label,
    email: smtp.email,
    isActive: smtp.isActive,
    dailyLimit: smtp.dailyLimit,
    sentToday: smtp.sentToday,
    remainingToday: Math.max(0, smtp.dailyLimit - smtp.sentToday),
    lastResetDate: smtp.lastResetDate,
    createdAt: smtp.createdAt,
  };
}

export const addSmtpAccount = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new ApiError(400, errors.array()[0].msg);

  const { label, email, appPassword, dailyLimit } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  const account = await SMTPAccount.findOneAndUpdate(
    {
      ownerEmail: req.user.email,
      email: normalizedEmail,
    },
    {
      $set: {
        userId: req.user._id,
        ownerEmail: req.user.email,
        label: label.trim(),
        appPassword: encrypt(appPassword),
        dailyLimit: dailyLimit || 1000,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    },
  );

  res.status(201).json({ smtp: mapSmtpPublic(account) });
});

export const getSmtpAccounts = asyncHandler(async (req, res) => {
  await SMTPAccount.updateMany(
    {
      ownerEmail: req.user.email,
      userId: { $ne: req.user._id },
    },
    {
      $set: { userId: req.user._id },
    },
  );

  await SMTPAccount.updateMany(
    {
      userId: req.user._id,
      ownerEmail: { $exists: false },
    },
    {
      $set: { ownerEmail: req.user.email },
    },
  );

  const accounts = await SMTPAccount.find(getAccountOwnerFilter(req)).sort({ createdAt: -1 });
  res.status(200).json({ items: accounts.map(mapSmtpPublic) });
});

export const deleteSmtpAccount = asyncHandler(async (req, res) => {
  const deleted = await SMTPAccount.findOneAndDelete({
    _id: req.params.id,
    ...getAccountOwnerFilter(req),
  });
  if (!deleted) throw new ApiError(404, 'SMTP account not found');
  res.status(200).json({ message: 'SMTP account deleted' });
});

export const toggleSmtpAccount = asyncHandler(async (req, res) => {
  const smtp = await SMTPAccount.findOne({ _id: req.params.id, ...getAccountOwnerFilter(req) });
  if (!smtp) throw new ApiError(404, 'SMTP account not found');

  smtp.isActive = !smtp.isActive;
  await smtp.save();

  res.status(200).json({ smtp: mapSmtpPublic(smtp) });
});

export const updateSmtpLimit = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new ApiError(400, errors.array()[0].msg);

  const { dailyLimit } = req.body;

  if (dailyLimit < 1 || dailyLimit > 100000) {
    throw new ApiError(400, 'Daily limit must be between 1 and 100000');
  }

  const smtp = await SMTPAccount.findOne({ _id: req.params.id, ...getAccountOwnerFilter(req) });
  if (!smtp) throw new ApiError(404, 'SMTP account not found');

  smtp.dailyLimit = dailyLimit;
  await smtp.save();

  res.status(200).json({ smtp: mapSmtpPublic(smtp) });
});

export const resetSmtpCounter = asyncHandler(async (req, res) => {
  const smtp = await SMTPAccount.findOne({ _id: req.params.id, ...getAccountOwnerFilter(req) });
  if (!smtp) throw new ApiError(404, 'SMTP account not found');

  smtp.sentToday = 0;
  smtp.lastResetDate = new Date();
  await smtp.save();

  res.status(200).json({ smtp: mapSmtpPublic(smtp) });
});
