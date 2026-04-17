import { validationResult } from 'express-validator';
import Template from '../models/Template.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';

function applyPreview(str, sample) {
  return str
    .replace(/{{\s*name\s*}}/gi, sample.name)
    .replace(/{{\s*company\s*}}/gi, sample.company);
}

export const createTemplate = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new ApiError(400, errors.array()[0].msg);

  const template = await Template.create({
    userId: req.user._id,
    name: req.body.name.trim(),
    subject: req.body.subject.trim(),
    htmlBody: req.body.htmlBody,
  });

  res.status(201).json({ template });
});

export const listTemplates = asyncHandler(async (req, res) => {
  const items = await Template.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ items });
});

export const updateTemplate = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new ApiError(400, errors.array()[0].msg);

  const template = await Template.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    {
      name: req.body.name.trim(),
      subject: req.body.subject.trim(),
      htmlBody: req.body.htmlBody,
    },
    { new: true, runValidators: true },
  );

  if (!template) throw new ApiError(404, 'Template not found');

  template.variables = undefined;
  await template.save();

  res.status(200).json({ template });
});

export const deleteTemplate = asyncHandler(async (req, res) => {
  const template = await Template.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!template) throw new ApiError(404, 'Template not found');

  res.status(200).json({ message: 'Template deleted' });
});

export const previewTemplate = asyncHandler(async (req, res) => {
  const template = await Template.findOne({ _id: req.params.id, userId: req.user._id });
  if (!template) throw new ApiError(404, 'Template not found');

  const sample = { name: 'Alex', company: 'Acme Inc' };

  res.status(200).json({
    subject: applyPreview(template.subject, sample),
    html: applyPreview(template.htmlBody, sample),
  });
});
