import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "",
    pass: process.env.EMAIL_PASS || "",
  },
});

export async function sendResetCodeEmail(
  toEmail: string,
  code: string
): Promise<boolean> {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn(
      "⚠️ EMAIL_USER or EMAIL_PASS not configured — reset code not sent by email."
    );
    return false;
  }

  const mailOptions = {
    from: `"BestRoom Support" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "[BestRoom] Mã xác nhận khôi phục mật khẩu",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 12px;">
        <h2 style="color: #2563eb; text-align: center;">Khôi phục mật khẩu BestRoom</h2>
        <p>Xin chào,</p>
        <p>Chúng tôi nhận được yêu cầu khôi phục mật khẩu cho tài khoản BestRoom liên kết với địa chỉ email này.</p>
        <p>Mã xác thực của bạn là:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-family: monospace; font-size: 24px; font-weight: bold; background-color: #f3f4f6; padding: 10px 20px; border-radius: 6px; letter-spacing: 4px; border: 1px solid #e5e7eb;">
            ${code}
          </span>
        </div>
        <p>Mã xác thực này có hiệu lực trong vòng <b>15 phút</b>. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
        <p>Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email này.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="font-size: 11px; color: #9ca3af; text-align: center;">© 2026 BestRoom. All rights reserved.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`✉️ Reset password email sent to ${toEmail}`);
  return true;
}
