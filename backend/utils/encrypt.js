import crypto from 'crypto';
import { ApiError } from './apiError.js';

function getKey() {
  const key = process.env.SMTP_ENCRYPT_KEY;
  if (!key || key.length < 32) {
    throw new ApiError(500, 'SMTP_ENCRYPT_KEY must be at least 32 chars');
  }
  return Buffer.from(key.slice(0, 32), 'utf8');
}

export function encrypt(plainText) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', getKey(), iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedText) {
  const [ivHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', getKey(), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
