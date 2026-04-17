import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['draft', 'running', 'completed', 'failed', 'stopped'],
      default: 'draft',
      index: true,
    },
    leadIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true }],
    templateIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Template', required: true }],
    smtpIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SMTPAccount', required: true }],
    delayMs: {
      type: Number,
      default: 2000,
      min: 200,
    },
    sentCount: {
      type: Number,
      default: 0,
    },
    failedCount: {
      type: Number,
      default: 0,
    },
    totalCount: {
      type: Number,
      default: 0,
    },
    startedAt: Date,
    completedAt: Date,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

const Campaign = mongoose.model('Campaign', campaignSchema);

export default Campaign;
