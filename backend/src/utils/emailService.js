import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Tạo transporter để gửi email
 * Hỗ trợ Gmail, Outlook và các SMTP server khác
 */
const createTransporter = () => {
  // Nếu có cấu hình SMTP đầy đủ, sử dụng nó
  if (process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true cho 465, false cho các port khác
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Nếu không có cấu hình, sử dụng Gmail với OAuth2 hoặc App Password
  // Lưu ý: Cần bật "Less secure app access" hoặc sử dụng App Password
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Nên dùng App Password thay vì mật khẩu thường
      },
    });
  }

  // Nếu không có cấu hình email, trả về null
  console.warn('⚠️  Cảnh báo: Chưa cấu hình email. Email sẽ không được gửi.');
  return null;
};

/**
 * Gửi email đặt lại mật khẩu
 * @param {string} email - Email người nhận
 * @param {string} resetToken - Token để đặt lại mật khẩu
 * @param {string} userName - Tên người dùng (tùy chọn)
 */
export const sendPasswordResetEmail = async (email, resetToken, userName = '') => {
  const transporter = createTransporter();
  
  if (!transporter) {
    // Nếu không có cấu hình email, in ra console để debug
    const resetURL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
    console.log('--- LINK ĐẶT LẠI MẬT KHẨU (CHƯA CẤU HÌNH EMAIL) ---');
    console.log(`Email: ${email}`);
    console.log(`Link: ${resetURL}`);
    console.log('----------------------------------------------------');
    return { success: false, message: 'Chưa cấu hình email service' };
  }

  const resetURL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
  const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@ept.com';

  const mailOptions = {
    from: `"EPT Learning System" <${fromEmail}>`,
    to: email,
    subject: 'Đặt lại mật khẩu - EPT Learning System',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #f9f9f9;
            border-radius: 8px;
            padding: 30px;
            margin: 20px 0;
          }
          .header {
            text-align: center;
            color: #1976d2;
            margin-bottom: 30px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #1976d2;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .button:hover {
            background-color: #1565c0;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
            text-align: center;
          }
          .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 10px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="header">Đặt lại Mật khẩu</h1>
          ${userName ? `<p>Xin chào <strong>${userName}</strong>,</p>` : '<p>Xin chào,</p>'}
          <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình.</p>
          <p>Vui lòng nhấp vào nút bên dưới để đặt lại mật khẩu:</p>
          <div style="text-align: center;">
            <a href="${resetURL}" class="button">Đặt lại Mật khẩu</a>
          </div>
          <p>Hoặc sao chép và dán liên kết sau vào trình duyệt của bạn:</p>
          <p style="word-break: break-all; color: #1976d2;">${resetURL}</p>
          <div class="warning">
            <strong>⚠️ Lưu ý:</strong>
            <ul>
              <li>Liên kết này sẽ hết hạn sau <strong>1 giờ</strong>.</li>
              <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</li>
              <li>Để bảo mật, không chia sẻ liên kết này với bất kỳ ai.</li>
            </ul>
          </div>
          <div class="footer">
            <p>Email này được gửi tự động từ hệ thống EPT Learning System.</p>
            <p>Vui lòng không trả lời email này.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Đặt lại Mật khẩu - EPT Learning System
      
      ${userName ? `Xin chào ${userName},` : 'Xin chào,'}
      
      Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình.
      
      Vui lòng truy cập liên kết sau để đặt lại mật khẩu:
      ${resetURL}
      
      Lưu ý:
      - Liên kết này sẽ hết hạn sau 1 giờ.
      - Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
      - Để bảo mật, không chia sẻ liên kết này với bất kỳ ai.
      
      Email này được gửi tự động từ hệ thống EPT Learning System.
      Vui lòng không trả lời email này.
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email đặt lại mật khẩu đã được gửi:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Lỗi khi gửi email:', error);
    // Vẫn in ra console để debug nếu gửi email thất bại
    const resetURL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
    console.log('--- LINK ĐẶT LẠI MẬT KHẨU (LỖI GỬI EMAIL) ---');
    console.log(`Email: ${email}`);
    console.log(`Link: ${resetURL}`);
    console.log('Lỗi:', error.message);
    console.log('----------------------------------------------------');
    return { success: false, error: error.message };
  }
};
