import bcrypt from 'bcryptjs';
import OTP from '../models/OTP.js';
import { sendOtpEmail } from './emailService.js';

export function generateOtp() {
  return `${Math.floor(100000 + Math.random() * 900000)}`;
}

export async function createAndSendOtp({ name, email }) {
  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 12);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);
  const resendAvailableAt = new Date(now.getTime() + 60 * 1000);

  await OTP.findOneAndUpdate(
    { email: email.toLowerCase() },
    {
      name,
      email: email.toLowerCase(),
      otp: otpHash,
      expiresAt,
      resendAvailableAt,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  await sendOtpEmail({ to: email, otp });
}
