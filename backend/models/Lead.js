import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema(
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
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    company: {
      type: String,
      default: '',
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['active', 'unsubscribed'],
      default: 'active',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

leadSchema.index({ userId: 1, email: 1 }, { unique: true });

const Lead = mongoose.model('Lead', leadSchema);

export default Lead;
