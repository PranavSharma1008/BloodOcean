const nodemailer = require('nodemailer');

const htmlTemplate = (otp) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="480" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td align="center" style="padding: 40px 40px 20px;">
              <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Ccircle cx='24' cy='24' r='24' fill='%23e53935'/%3E%3Cpath d='M24 12a2 2 0 0 0-2 2v12a2 2 0 0 0 4 0V14a2 2 0 0 0-2-2zm0 20a2 2 0 1 0 0 4 2 2 0 0 0 0-4z' fill='%23fff'/%3E%3C/svg%3E" width="48" height="48" alt="Blood Donation" style="margin-bottom: 16px;">
              <h1 style="font-size: 24px; margin: 0 0 8px; color: #333;">Password Reset Request</h1>
              <p style="font-size: 14px; color: #666; margin: 0;">We received a request to reset your Blood Donation Finder account password.</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 30px 40px;">
              <div style="background: #f3f4f6; border-radius: 8px; padding: 24px;">
                <p style="font-size: 12px; color: #888; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Your one-time code</p>
                <p style="font-size: 36px; font-weight: bold; color: #e53935; margin: 0; letter-spacing: 8px;">${otp}</p>
                <p style="font-size: 12px; color: #888; margin: 8px 0 0;">This code expires in 15 minutes.</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 20px;">
              <p style="font-size: 12px; color: #999; margin: 0; line-height: 1.5;">
                If you didn't request this, you can safely ignore this email. Your password will remain unchanged.
                <br><br>
                Blood Donation Finder — Connecting donors with those in need.
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
  const service = process.env.EMAIL_SERVICE;
  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT || 587);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const from = process.env.EMAIL_FROM
    || `noreply@${process.env.FRONTEND_URL?.replace(/^https?:\/\//, '') || 'blood-donation-finder.com'}`;

  if (!service && !host) {
    console.log(`Email transport is not configured. Skipping sendEmail. To=${to}, Subject=${subject}, Text=${text}`);
    console.log('Set EMAIL_SERVICE=SendGrid or EMAIL_HOST in your .env file.');
    return { skipped: true };
  }

  if (!user || !pass) {
    console.log('EMAIL_USER or EMAIL_PASS is missing. Skipping sendEmail.');
    return { skipped: true };
  }

  const isSendGrid = service?.toLowerCase() === 'sendgrid';

  const transportOptions = service
    ? {
        service: isSendGrid ? 'SendGrid' : service,
        auth: { user: isSendGrid ? 'apikey' : user, pass },
      }
    : {
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      };

  const transporter = nodemailer.createTransport({
    ...transportOptions,
    tls: { rejectUnauthorized: false },
  });

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html: text.includes('reset code')
      ? htmlTemplate(text.match(/\d{6}/)?.[0] || '')
      : undefined,
  });
};

module.exports = sendEmail;
