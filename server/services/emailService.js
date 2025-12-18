import nodemailer from 'nodemailer';

/**
 * Simple email service for verification, password reset and other notifications
 * Uses Gmail (or any SMTP account) configured via environment variables.
 *
 * Required env:
 * - EMAIL_USER
 * - EMAIL_PASSWORD (App Password is recommended)
 * - FRONTEND_URL (for building links)
 */

const createTransporter = () => {
  const email = process.env.EMAIL_USER;
  const password = process.env.EMAIL_PASSWORD;

  if (!email || !password) {
    console.warn(' EMAIL_USER hoặc EMAIL_PASSWORD chưa được cấu hình trong .env');
    return null;
  }

  const cleanPassword = password.replace(/\s/g, '');

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: email,
      pass: cleanPassword,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

/**
 * Gửi email xác minh tài khoản
 * @param {string} to
 * @param {string} token
 * @param {string} userName
 */
export const sendVerificationEmail = async (to, token, userName = 'Người dùng') => {
  const transporter = createTransporter();
  if (!transporter) {
    throw new Error(
      'Email service chưa được cấu hình. Vui lòng thiết lập EMAIL_USER và EMAIL_PASSWORD trong .env',
    );
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const encodedToken = encodeURIComponent(token);
  const verifyLink = `${frontendUrl}/verify-email?token=${encodedToken}`;

  const mailOptions = {
    from: `"Hệ thống Đấu giá Online" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Xác minh địa chỉ email của bạn',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #111827;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9fafb;
          }
          .container {
            background-color: #ffffff;
            border-radius: 10px;
            padding: 24px;
            border: 1px solid #e5e7eb;
          }
          .header {
            text-align: center;
            margin-bottom: 24px;
          }
          .header h1 {
            color: #16a34a;
            margin: 0;
            font-size: 22px;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #22c55e;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
          }
          .button:hover {
            background-color: #15803d;
          }
          .footer {
            text-align: center;
            color: #6b7280;
            font-size: 12px;
            margin-top: 20px;
          }
          .note {
            font-size: 12px;
            color: #92400e;
            background-color: #fffbeb;
            border-radius: 6px;
            padding: 12px;
            border: 1px solid #fed7aa;
          }
          .link {
            word-break: break-all;
            color: #16a34a;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Xác minh email</h1>
          </div>
          <p>Xin chào <strong>${userName}</strong>,</p>
          <p>Cảm ơn bạn đã đăng ký tài khoản đấu giá online.</p>
          <p>Vui lòng xác nhận địa chỉ email của bạn bằng cách nhấp vào nút bên dưới:</p>
          <p style="text-align: center;">
            <a href="${verifyLink}" class="button">Xác minh email</a>
          </p>
          <p>Nếu nút không hoạt động, bạn có thể copy liên kết sau và dán vào trình duyệt:</p>
          <p class="link">${verifyLink}</p>
          <div class="note">
            <strong>Lưu ý:</strong> Liên kết xác minh chỉ có hiệu lực trong 24 giờ. 
            Nếu bạn không tạo tài khoản, hãy bỏ qua email này.
          </div>
          <div class="footer">
            <p>Email này được gửi tự động, vui lòng không trả lời.</p>
            <p>© ${new Date().getFullYear()} Hệ thống Đấu giá Online.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  console.log('📧 Sending verification email to:', to);

  const info = await transporter.sendMail(mailOptions);
  console.log('✅ Verification email sent:', info.messageId);

  return { success: true, messageId: info.messageId };
};

/**
 * Gửi email đặt lại mật khẩu
 * @param {string} to
 * @param {string} token
 * @param {string} userName
 */
export const sendPasswordResetEmail = async (to, token, userName = 'Người dùng') => {
  const transporter = createTransporter();
  if (!transporter) {
    throw new Error(
      'Email service chưa được cấu hình. Vui lòng thiết lập EMAIL_USER và EMAIL_PASSWORD trong .env',
    );
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const encodedToken = encodeURIComponent(token);
  const resetLink = `${frontendUrl}/reset-password?token=${encodedToken}`;

  const mailOptions = {
    from: `"Hệ thống Đấu giá Online" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Yêu cầu đặt lại mật khẩu',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #111827;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9fafb;
          }
          .container {
            background-color: #ffffff;
            border-radius: 10px;
            padding: 24px;
            border: 1px solid #e5e7eb;
          }
          .header {
            text-align: center;
            margin-bottom: 24px;
          }
          .header h1 {
            color: #b91c1c;
            margin: 0;
            font-size: 22px;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #ef4444;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
          }
          .button:hover {
            background-color: #b91c1c;
          }
          .footer {
            text-align: center;
            color: #6b7280;
            font-size: 12px;
            margin-top: 20px;
          }
          .note {
            font-size: 12px;
            color: #92400e;
            background-color: #fffbeb;
            border-radius: 6px;
            padding: 12px;
            border: 1px solid #fed7aa;
          }
          .link {
            word-break: break-all;
            color: #ef4444;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Đặt lại mật khẩu</h1>
          </div>
          <p>Xin chào <strong>${userName}</strong>,</p>
          <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản đấu giá online của bạn.</p>
          <p>Nếu bạn là người gửi yêu cầu, hãy nhấp vào nút bên dưới để đặt lại mật khẩu:</p>
          <p style="text-align: center;">
            <a href="${resetLink}" class="button">Đặt lại mật khẩu</a>
          </p>
          <p>Nếu nút không hoạt động, bạn có thể copy liên kết sau và dán vào trình duyệt:</p>
          <p class="link">${resetLink}</p>
          <div class="note">
            <strong>Lưu ý:</strong> Liên kết đặt lại mật khẩu chỉ có hiệu lực trong 1 giờ. 
            Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.
          </div>
          <div class="footer">
            <p>Email này được gửi tự động, vui lòng không trả lời.</p>
            <p>© ${new Date().getFullYear()} Hệ thống Đấu giá Online.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  console.log(' Sending password reset email to:', to);

  const info = await transporter.sendMail(mailOptions);
  console.log(' Password reset email sent:', info.messageId);

  return { success: true, messageId: info.messageId };
};


