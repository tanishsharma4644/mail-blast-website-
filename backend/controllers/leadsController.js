import { validationResult } from 'express-validator';
import Lead from '../models/Lead.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';

const BULK_INSERT_CHUNK_SIZE = 1000;

function sanitizeLeadInput(body) {
  return {
    name: body.name?.trim(),
    email: body.email?.toLowerCase().trim(),
    company: body.company?.trim() || '',
    tags: Array.isArray(body.tags)
      ? body.tags.map((tag) => String(tag).trim()).filter(Boolean)
      : [],
    status: body.status || 'active',
  };
}

function parseLeadLine(line) {
  const cleaned = String(line || '').trim();
  if (!cleaned) return null;

  const parts = cleaned
    .split(/[\t,;|]+/)
    .map((value) => value.trim())
    .filter(Boolean);

  if (!parts.length) return null;

  if (parts.length === 1) {
    const email = parts[0].toLowerCase();
    return email.includes('@') ? { name: email.split('@')[0], email, company: '' } : null;
  }

  const [first, second, third = ''] = parts;
  const firstLooksLikeEmail = first.includes('@');
  const secondLooksLikeEmail = second.includes('@');

  if (firstLooksLikeEmail && !secondLooksLikeEmail) {
    return {
      name: second || first.split('@')[0],
      email: first.toLowerCase(),
      company: third,
    };
  }

  if (!firstLooksLikeEmail && secondLooksLikeEmail) {
    return {
      name: first,
      email: second.toLowerCase(),
      company: third,
    };
  }

  if (firstLooksLikeEmail && secondLooksLikeEmail) {
    return {
      name: first.split('@')[0],
      email: first.toLowerCase(),
      company: third,
    };
  }

  return null;
}

async function bulkInsertLeads({ userId, items }) {
  if (!items.length) {
    return { insertedCount: 0, skippedCount: 0 };
  }

  const normalizedEmails = [...new Set(items.map((item) => item.email))];
  const existingEmails = await Lead.find({
    userId,
    email: { $in: normalizedEmails },
  }).distinct('email');

  const existingSet = new Set(existingEmails.map((email) => String(email).toLowerCase()));
  const seenInPayload = new Set();
  const uniqueItems = [];

  for (const item of items) {
    if (existingSet.has(item.email) || seenInPayload.has(item.email)) {
      continue;
    }

    seenInPayload.add(item.email);
    uniqueItems.push(item);
  }

  let insertedCount = 0;
  for (let index = 0; index < uniqueItems.length; index += BULK_INSERT_CHUNK_SIZE) {
    const chunk = uniqueItems.slice(index, index + BULK_INSERT_CHUNK_SIZE);
    if (!chunk.length) continue;

    const result = await Lead.insertMany(chunk, { ordered: false });
    insertedCount += result.length;
  }

  return {
    insertedCount,
    skippedCount: items.length - uniqueItems.length,
  };
}

export const addLead = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new ApiError(400, errors.array()[0].msg);

  const payload = sanitizeLeadInput(req.body);

  const lead = await Lead.create({
    userId: req.user._id,
    ...payload,
  });

  res.status(201).json({ lead });
});

export const bulkAddLeads = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'CSV file is required');

  const csv = req.file.buffer.toString('utf8');
  const lines = csv.split(/\r?\n/).filter(Boolean);
  const rows = lines.slice(1);

  const items = rows
    .map((line) => parseLeadLine(line))
    .filter(Boolean)
    .map((lead) => ({
      userId: req.user._id,
      ...lead,
      status: 'active',
    }));

  if (!items.length) throw new ApiError(400, 'No valid rows found in CSV');

  const { insertedCount, skippedCount } = await bulkInsertLeads({
    userId: req.user._id,
    items,
  });

  res.status(201).json({
    message: `Imported ${insertedCount} leads`,
    insertedCount,
    skippedCount,
  });
});

export const bulkPasteLeads = asyncHandler(async (req, res) => {
  const rawText = String(req.body.text || '').trim();
  if (!rawText) throw new ApiError(400, 'Pasted leads text is required');

  const lines = rawText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const items = lines
    .map((line) => parseLeadLine(line))
    .filter(Boolean)
    .map((lead) => ({
      userId: req.user._id,
      ...lead,
      status: 'active',
    }));

  if (!items.length) throw new ApiError(400, 'No valid leads found in pasted text');

  const { insertedCount, skippedCount } = await bulkInsertLeads({
    userId: req.user._id,
    items,
  });

  res.status(201).json({
    message: `Imported ${insertedCount} leads`,
    insertedCount,
    skippedCount,
  });
});

export const listLeads = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Math.min(Number(req.query.limit || 10), 100);
  const search = String(req.query.search || '').trim();

  const query = { userId: req.user._id };
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    Lead.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Lead.countDocuments(query),
  ]);

  res.status(200).json({
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

export const updateLead = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new ApiError(400, errors.array()[0].msg);

  const payload = sanitizeLeadInput(req.body);

  const lead = await Lead.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    payload,
    { new: true, runValidators: true },
  );

  if (!lead) throw new ApiError(404, 'Lead not found');

  res.status(200).json({ lead });
});

export const deleteLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!lead) throw new ApiError(404, 'Lead not found');
  res.status(200).json({ message: 'Lead deleted' });
});
