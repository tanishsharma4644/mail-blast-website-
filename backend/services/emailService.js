import nodemailer from 'nodemailer';

function normalizeAppPassword(value = '') {
  return String(value).replace(/\s+/g, '');
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function looksLikeHtml(value = '') {
  return /<\/?[a-z][\s\S]*>/i.test(String(value));
}

function linkifyEscapedText(value = '') {
  return String(value).replace(
    /(https?:\/\/[^\s<]+)/gi,
    '<a href="$1" target="_blank" rel="noopener noreferrer" style="color:#2563eb;">$1</a>',
  );
}

function applyInlineFormatting(value = '') {
  return String(value)
    // Supports ASCII '*' and common Unicode star variants.
    .replace(/([*∗＊]{2})([\s\S]+?)\1/g, '<strong>$2</strong>')
    .replace(/(^|[\s(])[*∗＊]([^\n*∗＊][^\n]*?)\s*[*∗＊](?=$|[\s).,:;!?])/gm, '$1<strong>$2</strong>');
}

function buildPlainTextFallback(value = '') {
  return String(value)
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function normalizeEmailHtml(value = '') {
  const raw = String(value ?? '');
  if (!raw.trim()) return '<div></div>';

  if (looksLikeHtml(raw)) {
    return raw;
  }

  const escaped = escapeHtml(raw).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const withFormatting = applyInlineFormatting(escaped);
  const withLinks = linkifyEscapedText(withFormatting);

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;white-space:pre-wrap;word-break:break-word;">
      ${withLinks}
    </div>
  `;
}

export async function sendEmail({ to, subject, html, smtpConfig }) {
  const finalHtml = normalizeEmailHtml(html);
  const senderName = smtpConfig?.label ? String(smtpConfig.label).trim() : '';
  const fromAddress = senderName ? `${senderName} <${smtpConfig.email}>` : smtpConfig.email;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    auth: {
      user: smtpConfig.email,
      pass: normalizeAppPassword(smtpConfig.appPassword),
    },
  });

  return transporter.sendMail({
    from: fromAddress,
    to,
    subject,
    html: finalHtml,
    text: buildPlainTextFallback(finalHtml),
    replyTo: smtpConfig.email,
    headers: {
      'X-Auto-Response-Suppress': 'All',
      'List-Unsubscribe': `<mailto:${smtpConfig.email}?subject=unsubscribe>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
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
