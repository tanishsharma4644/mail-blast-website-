import mongoose from 'mongoose';

function extractVariables(text) {
  if (!text) return [];
  const matches = text.match(/{{\s*([a-zA-Z0-9_]+)\s*}}/g) || [];
  const normalized = matches.map((entry) => entry.replace(/\s+/g, ''));
  return [...new Set(normalized)];
}

const templateSchema = new mongoose.Schema(
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
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    htmlBody: {
      type: String,
      required: true,
    },
    variables: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

templateSchema.pre('save', function computeVariables(next) {
  this.variables = [...new Set([...extractVariables(this.subject), ...extractVariables(this.htmlBody)])];
  next();
});

const Template = mongoose.model('Template', templateSchema);

export default Template;
