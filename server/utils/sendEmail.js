const nodemailer = require('nodemailer');

const htmlTemplate = (otp) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f1f5f9; margin: 0; padding: 0;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="480" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626, #991b1b); padding: 32px 40px; text-align: center;">
              <h1 style="font-size: 22px; color: #ffffff; margin: 0; font-weight: 700;">Blood Ocean</h1>
              <p style="font-size: 14px; color: rgba(255,255,255,0.8); margin: 4px 0 0;">Password Reset Request</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 40px;">
              <p style="font-size: 15px; color: #475569; margin: 0 0 20px; line-height: 1.6;">
                We received a request to reset your Blood Ocean account password. Use the code below to proceed.
              </p>
              <div style="background: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 12px; padding: 24px; text-align: center;">
                <p style="font-size: 12px; color: #94a3b8; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Your one-time code</p>
                <p style="font-size: 40px; font-weight: 800; color: #dc2626; margin: 0; letter-spacing: 12px; font-family: 'Courier New', monospace;">${otp}</p>
                <p style="font-size: 13px; color: #94a3b8; margin: 12px 0 0;">This code expires in <strong style="color: #dc2626;">15 minutes</strong>.</p>
              </div>
              <p style="font-size: 13px; color: #94a3b8; margin: 20px 0 0; line-height: 1.6;">
                If you didn't request this, you can safely ignore this email. Your password will remain unchanged.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background: #f8fafc; padding: 20px 40px; text-align: center;">
              <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                Blood Ocean — Connecting donors with those in need.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const sendEmail = async ({ to, subject, text }) => {
  const service = (process.env.EMAIL_SERVICE || '').toLowerCase();
  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT) || 587;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const fromName = process.env.EMAIL_FROM_NAME || 'Blood Ocean';
  const fromEmail = process.env.EMAIL_FROM || 'noreply@bloodocean.vercel.app';

  if (!host && !service) {
    console.log(`[EMAIL] No transport configured. Set EMAIL_HOST or EMAIL_SERVICE in .env`);
    return { skipped: true };
  }

  if (!user || !pass) {
    console.log(`[EMAIL] EMAIL_USER or EMAIL_PASS is missing.`);
    return { skipped: true };
  }

  let transportOptions;

  if (service === 'sendgrid') {
    transportOptions = {
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: { user: 'apikey', pass },
    };
  } else if (service === 'gmail') {
    transportOptions = {
      service: 'gmail',
      auth: { user, pass },
    };
  } else if (service === 'resend') {
    transportOptions = {
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: { user: 'resend', pass },
    };
  } else if (service === 'mailgun') {
    transportOptions = {
      host: 'smtp.mailgun.org',
      port: 587,
      secure: false,
      auth: { user, pass },
    };
  } else if (host) {
    transportOptions = {
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    };
  } else {
    transportOptions = {
      service,
      auth: { user, pass },
    };
  }

  const transporter = nodemailer.createTransport({
    ...transportOptions,
    tls: { rejectUnauthorized: true },
  });

  const otp = text.match(/\d{6}/)?.[0] || '';

  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject,
    text,
    html: htmlTemplate(otp),
  });

  return { skipped: false };
};

module.exports = sendEmail;
