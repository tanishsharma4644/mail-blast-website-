import nodemailer from 'nodemailer';

function normalizeAppPassword(value = '') {
  return String(value).replace(/\s+/g, '');
}

export async function sendEmail({ to, subject, html, smtpConfig }) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: smtpConfig.email,
      pass: normalizeAppPassword(smtpConfig.appPassword),
    },
  });

  return transporter.sendMail({
    from: smtpConfig.email,
    to,
    subject,
    html,
  });
}

export async function sendOtpEmail({ to, otp }) {
  const transporter = nodemailer.createTransport({
    host: process.env.OTP_SMTP_HOST || 'smtp.gmail.com',
    port: process.env.OTP_SMTP_PORT || 587,
    secure: process.env.OTP_SMTP_SECURE === 'true',
    auth: {
      user: process.env.APP_SMTP_EMAIL,
      pass: normalizeAppPassword(process.env.APP_SMTP_PASSWORD),
    },
  });

  const html = `
    <div style="font-family: Arial, sans-serif; background:#f8fafc; padding:24px;">
      <div style="max-width:540px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;border:1px solid #e2e8f0;">
        <h2 style="margin:0 0 10px; color:#1e293b;">Verify your account</h2>
        <p style="margin:0 0 18px; color:#475569;">Use this OTP to complete registration. It expires in 10 minutes.</p>
        <div style="font-size:34px;letter-spacing:10px;font-weight:700;text-align:center;background:#f1f5f9;border:1px dashed #94a3b8;padding:14px;border-radius:8px;">
          ${otp}
        </div>
      </div>
    </div>
  `;

  return transporter.sendMail({
    from: process.env.APP_SMTP_EMAIL,
    to,
    subject: 'Your Email Campaign Manager OTP',
    html,
  });
}
