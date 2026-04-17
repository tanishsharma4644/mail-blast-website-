import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  leadEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  smtpUsed: {
    type: String,
    default: '',
  },
  templateUsed: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['sent', 'failed'],
    required: true,
    index: true,
  },
  errorMessage: {
    type: String,
    default: '',
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

const Log = mongoose.model('Log', logSchema);

export default Log;
