const nodemailer = require('nodemailer');
const env = require('../config/env');

// Resend's HTTP API is used whenever EMAIL_HOST points at Resend and
// EMAIL_PASS holds a Resend API key (starts with "re_"). This avoids raw
// SMTP entirely — many hosting platforms (including Render's free tier)
// block outbound SMTP ports, but a plain HTTPS request is never blocked.
function isResendConfigured() {
  return env.email.host === 'smtp.resend.com' && env.email.pass?.startsWith('re_');
}

async function sendViaResendApi({ to, subject, html }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.email.pass}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: env.email.from, to, subject, html }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Resend API error (${res.status}): ${body}`);
  }
  return res.json();
}

// Fallback path for any other SMTP provider (Gmail app password, SES, etc.)
// if EMAIL_HOST isn't Resend.
let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  if (!env.email.host || !env.email.user) return null;
  transporter = nodemailer.createTransport({
    host: env.email.host,
    port: env.email.port,
    secure: env.email.port === 465,
    auth: { user: env.email.user, pass: env.email.pass },
  });
  return transporter;
}

async function send({ to, subject, html }) {
  if (isResendConfigured()) {
    try {
      return await sendViaResendApi({ to, subject, html });
    } catch (err) {
      console.error('[email] Resend API send failed, falling back to console log:', err.message);
      console.log(`[email:dev] To: ${to} | Subject: ${subject}\n${html}\n`);
      return { devMode: true };
    }
  }

  const t = getTransporter();
  if (!t) {
    console.log(`[email:dev] To: ${to} | Subject: ${subject}\n${html}\n`);
    return { devMode: true };
  }

  try {
    return await t.sendMail({ from: env.email.from, to, subject, html });
  } catch (err) {
    console.error('[email] SMTP send failed, falling back to console log:', err.message);
    console.log(`[email:dev] To: ${to} | Subject: ${subject}\n${html}\n`);
    return { devMode: true };
  }
}

const layout = (title, bodyHtml) => `
  <div style="font-family:Inter,Arial,sans-serif;background:#05070B;padding:32px;color:#F5F7FA;">
    <div style="max-width:480px;margin:0 auto;background:#090D14;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:32px;">
      <h1 style="font-size:18px;letter-spacing:0.5px;color:#F5F7FA;margin:0 0 4px;">EdgeX</h1>
      <p style="font-size:12px;color:#929AAA;margin:0 0 24px;">Intelligence for the physical world.</p>
      <h2 style="font-size:16px;color:#F5F7FA;">${title}</h2>
      ${bodyHtml}
    </div>
  </div>`;

exports.sendWelcomeEmail = (to, name) =>
  send({ to, subject: 'Welcome to EdgeX', html: layout('Welcome', `<p style="color:#929AAA;">Hi ${name}, your EdgeX account is ready.</p>`) });

exports.sendVerificationEmail = (to, verifyUrl) =>
  send({
    to,
    subject: 'Verify your EdgeX account',
    html: layout('Verify your email', `<p style="color:#929AAA;">Click below to verify your account.</p><p><a href="${verifyUrl}" style="color:#4CC9F0;">Verify Email</a></p>`),
  });

exports.sendOtpEmail = (to, code) =>
  send({
    to,
    subject: 'Your EdgeX sign-in code',
    html: layout('Your sign-in code', `<p style="font-size:32px;letter-spacing:8px;color:#F5F7FA;">${code}</p><p style="color:#929AAA;">This code expires in 10 minutes.</p>`),
  });

exports.sendPasswordResetEmail = (to, resetUrl) =>
  send({
    to,
    subject: 'Reset your EdgeX password',
    html: layout('Reset your password', `<p style="color:#929AAA;">Click below to set a new password. This link expires in 30 minutes.</p><p><a href="${resetUrl}" style="color:#4CC9F0;">Reset Password</a></p>`),
  });

exports.sendPasswordChangedEmail = (to) =>
  send({ to, subject: 'Your EdgeX password was changed', html: layout('Password changed', `<p style="color:#929AAA;">If this wasn't you, contact your administrator immediately.</p>`) });

exports.sendAdminInviteEmail = (to, name, tempSetupUrl) =>
  send({
    to,
    subject: "You've been invited to EdgeX",
    html: layout('Administrator invitation', `<p style="color:#929AAA;">Hi ${name}, you've been granted administrator access.</p><p><a href="${tempSetupUrl}" style="color:#4CC9F0;">Set up your account</a></p>`),
  });

exports.sendApiKeyCreatedEmail = (to, apiId) =>
  send({ to, subject: `API key ${apiId} created`, html: layout('API key created', `<p style="color:#929AAA;">A new API key (${apiId}) was created on your account.</p>`) });

exports.sendApiKeyRevokedEmail = (to, apiId) =>
  send({ to, subject: `API key ${apiId} revoked`, html: layout('API key revoked', `<p style="color:#929AAA;">API key ${apiId} has been revoked and can no longer be used.</p>`) });