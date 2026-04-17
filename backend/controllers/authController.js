import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';

import User from '../models/User.js';
import OTP from '../models/OTP.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { generateAccessToken, generateRefreshToken } from '../utils/generateToken.js';
import { createAndSendOtp } from '../services/otpService.js';

function getRefreshCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

export const sendOtp = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, errors.array()[0].msg);
  }

  const name = req.body.name.trim();
  const email = req.body.email.toLowerCase().trim();

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'Email already registered');
  }

  const existingOtp = await OTP.findOne({ email });
  if (existingOtp && new Date(existingOtp.resendAvailableAt) > new Date()) {
    throw new ApiError(429, 'Please wait before requesting another OTP');
  }

  await createAndSendOtp({ name, email });

  res.status(200).json({ message: 'OTP sent to your email' });
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, errors.array()[0].msg);
  }

  const email = req.body.email.toLowerCase().trim();
  const otpInput = req.body.otp.trim();

  const otpDoc = await OTP.findOne({ email }).select('+otp');
  if (!otpDoc) {
    throw new ApiError(400, 'Invalid or expired OTP');
  }

  if (new Date(otpDoc.expiresAt) < new Date()) {
    await OTP.deleteOne({ _id: otpDoc._id });
    throw new ApiError(400, 'OTP expired');
  }

  const isMatch = await bcrypt.compare(otpInput, otpDoc.otp);
  if (!isMatch) {
    throw new ApiError(400, 'Invalid OTP');
  }

  const exists = await User.findOne({ email });
  if (exists) {
    await OTP.deleteOne({ _id: otpDoc._id });
    throw new ApiError(409, 'Email already registered');
  }

  const user = await User.create({
    name: otpDoc.name,
    email,
  });

  await OTP.deleteOne({ _id: otpDoc._id });

  const payload = { userId: user._id };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  res.cookie('refreshToken', refreshToken, getRefreshCookieOptions());

  res.status(201).json({
    message: 'Registration successful',
    accessToken,
    user: { id: user._id, name: user.name, email: user.email },
  });
});

export const login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, errors.array()[0].msg);
  }

  const email = req.body.email.toLowerCase().trim();

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, 'Account not found');
  }

  const existingOtp = await OTP.findOne({ email });
  if (existingOtp && new Date(existingOtp.resendAvailableAt) > new Date()) {
    throw new ApiError(429, 'Please wait before requesting another OTP');
  }

  await createAndSendOtp({ name: user.name, email });

  res.status(200).json({ message: 'OTP sent to your email' });
});

export const verifyLoginOtp = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, errors.array()[0].msg);
  }

  const email = req.body.email.toLowerCase().trim();
  const otpInput = req.body.otp.trim();

  const otpDoc = await OTP.findOne({ email }).select('+otp');
  if (!otpDoc) {
    throw new ApiError(400, 'Invalid or expired OTP');
  }

  if (new Date(otpDoc.expiresAt) < new Date()) {
    await OTP.deleteOne({ _id: otpDoc._id });
    throw new ApiError(400, 'OTP expired');
  }

  const isMatch = await bcrypt.compare(otpInput, otpDoc.otp);
  if (!isMatch) {
    throw new ApiError(400, 'Invalid OTP');
  }

  const user = await User.findOne({ email });
  if (!user) {
    await OTP.deleteOne({ _id: otpDoc._id });
    throw new ApiError(404, 'Account not found');
  }

  await OTP.deleteOne({ _id: otpDoc._id });

  const payload = { userId: user._id };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  res.cookie('refreshToken', refreshToken, getRefreshCookieOptions());

  res.status(200).json({
    accessToken,
    user: { id: user._id, name: user.name, email: user.email },
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    throw new ApiError(401, 'Missing refresh token');
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const accessToken = generateAccessToken({ userId: decoded.userId });
    res.status(200).json({ accessToken });
  } catch (error) {
    throw new ApiError(401, 'Invalid refresh token');
  }
});

export const logout = asyncHandler(async (_req, res) => {
  res.clearCookie('refreshToken', getRefreshCookieOptions());
  res.status(200).json({ message: 'Logged out' });
});

export const me = asyncHandler(async (req, res) => {
  res.status(200).json({ user: req.user });
});
