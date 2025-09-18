const nodemailer = require('nodemailer');

const TTL_MIN = Number(process.env.RESET_TOKEN_TTL_MIN || 30);

function buildHtml(link) {
  return `
  <div style="background:#f6f7fb;padding:24px;font-family:Inter,Segoe UI,Arial,sans-serif;color:#111">
    <table role="presentation" cellspacing="0" cellpadding="0" style="max-width:560px;margin:auto;background:#ffffff;border-radius:12px;box-shadow:0 6px 18px rgba(0,0,0,0.06);overflow:hidden">
      <tr><td style="padding:24px 28px;border-bottom:1px solid #f0f0f0">
        <div style="font-weight:700;font-size:20px">RetrieveApp</div>
      </td></tr>
      <tr><td style="padding:28px">
        <h1 style="margin:0 0 12px;font-size:20px;line-height:1.4">Reset your password</h1>
        <p style="margin:0 0 20px;font-size:14px;color:#444">
          Click the button below to set a new password. This link expires in <strong>${TTL_MIN} minutes</strong>.
        </p>
        <div style="text-align:center;margin:24px 0">
          <a href="${link}" target="_blank" rel="noopener noreferrer"
             style="display:inline-block;background:#111;color:#fff;text-decoration:none;
                    padding:12px 18px;border-radius:999px;font-weight:600">
            Reset password
          </a>
        </div>
        <p style="margin:0 0 10px;font-size:12px;color:#666">If the button doesn't work, copy this URL:</p>
        <p style="word-break:break-all;font-size:12px;color:#666">${link}</p>
        <p style="margin-top:18px;font-size:12px;color:#888">If you did not request this, ignore this email.</p>
      </td></tr>
      <tr><td style="padding:16px 28px;border-top:1px solid #f0f0f0;font-size:12px;color:#999">
        © ${new Date().getFullYear()} RetrieveApp
      </td></tr>
    </table>
  </div>`;
}

let transporter;


function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT || 587),
      secure: false, // STARTTLS
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

async function sendResetEmail(to, link) {
  const t = getTransporter();
  try { await t.verify(); } catch (e) { console.error('[MAIL] verify failed:', e.message); }

  const info = await t.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject: 'Reset your RetrieveApp password',
    text: `Use this link to reset your password: ${link}\nThis link expires in ${TTL_MIN} minutes.`,
    html: buildHtml(link),
  });

  console.log('[MAIL] sent messageId:', info.messageId, 'to:', to);
}

module.exports = { sendResetEmail };
