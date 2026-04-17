import mongoose from 'mongoose';

const smtpAccountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    label: {
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
    appPassword: {
      type: String,
      required: true,
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    dailyLimit: {
      type: Number,
      default: 1000,
      min: 1,
      max: 100000,
    },
    sentToday: {
      type: Number,
      default: 0,
    },
    lastResetDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

smtpAccountSchema.index({ userId: 1, email: 1 }, { unique: true });

// Reset sent count at midnight
smtpAccountSchema.methods.resetIfNeeded = function() {
  const now = new Date();
  const lastReset = new Date(this.lastResetDate);
  
  if (now.getDate() !== lastReset.getDate() || now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
    this.sentToday = 0;
    this.lastResetDate = now;
  }
};

const SMTPAccount = mongoose.model('SMTPAccount', smtpAccountSchema);

export default SMTPAccount;
