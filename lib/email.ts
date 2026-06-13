import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "",
    pass: process.env.EMAIL_PASS || "",
  },
});

const escapeHtml = (value: string | number | null | undefined) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export type ViewingScheduleEmailPayload = {
  ownerName: string;
  roomTitle: string;
  roomPrice: number;
  roomAddress: string;
  visitorName: string;
  visitorPhone: string;
  viewingDate: string;
  timeSlot: string;
  contactMethod: string;
  visitorsCount: string;
  note?: string;
};

export async function sendViewingScheduleEmail(
  toEmail: string,
  payload: ViewingScheduleEmailPayload
): Promise<boolean> {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("EMAIL_USER or EMAIL_PASS not configured - viewing schedule email not sent.");
    return false;
  }

  const priceText = `${Number(payload.roomPrice || 0).toLocaleString("vi-VN")} đ/tháng`;
  const contactLabels: Record<string, string> = {
    phone: "Gọi điện",
    zalo: "Zalo",
    message: "Nhắn tin",
  };
  const timeSlotLabels: Record<string, string> = {
    morning: "08:00 - 10:00",
    noon: "10:00 - 12:00",
    afternoon: "14:00 - 16:00",
    evening: "18:00 - 20:00",
  };

  const mailOptions = {
    from: `"BestRoom" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `[BestRoom] Có lịch hẹn xem phòng mới: ${payload.roomTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; border: 1px solid #dbeafe; border-radius: 16px; background: #ffffff;">
        <div style="margin-bottom: 20px;">
          <p style="margin: 0 0 8px; color: #2563eb; font-size: 13px; font-weight: 700;">BESTROOM</p>
          <h2 style="margin: 0; color: #0f2356; font-size: 22px;">Bạn có lịch hẹn xem phòng mới</h2>
          <p style="margin: 8px 0 0; color: #64748b; font-size: 14px;">Khách thuê vừa gửi yêu cầu đặt lịch xem phòng trên BestRoom.</p>
        </div>

        <div style="padding: 16px; border-radius: 12px; background: #eff6ff; border: 1px solid #bfdbfe; margin-bottom: 18px;">
          <p style="margin: 0 0 6px; color: #0f2356; font-size: 15px; font-weight: 700;">${escapeHtml(payload.roomTitle)}</p>
          <p style="margin: 0; color: #2563eb; font-size: 18px; font-weight: 800;">${escapeHtml(priceText)}</p>
          <p style="margin: 8px 0 0; color: #475569; font-size: 13px;">${escapeHtml(payload.roomAddress)}</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 9px 0; color: #64748b;">Người đặt lịch</td><td style="padding: 9px 0; color: #0f2356; font-weight: 700;">${escapeHtml(payload.visitorName)}</td></tr>
          <tr><td style="padding: 9px 0; color: #64748b;">Số điện thoại</td><td style="padding: 9px 0; color: #0f2356; font-weight: 700;">${escapeHtml(payload.visitorPhone)}</td></tr>
          <tr><td style="padding: 9px 0; color: #64748b;">Ngày xem phòng</td><td style="padding: 9px 0; color: #0f2356; font-weight: 700;">${escapeHtml(payload.viewingDate)}</td></tr>
          <tr><td style="padding: 9px 0; color: #64748b;">Khung giờ</td><td style="padding: 9px 0; color: #0f2356; font-weight: 700;">${escapeHtml(timeSlotLabels[payload.timeSlot] || payload.timeSlot)}</td></tr>
          <tr><td style="padding: 9px 0; color: #64748b;">Hình thức liên hệ</td><td style="padding: 9px 0; color: #0f2356; font-weight: 700;">${escapeHtml(contactLabels[payload.contactMethod] || payload.contactMethod)}</td></tr>
          <tr><td style="padding: 9px 0; color: #64748b;">Số người đi xem</td><td style="padding: 9px 0; color: #0f2356; font-weight: 700;">${escapeHtml(payload.visitorsCount)} người</td></tr>
        </table>

        ${payload.note ? `
          <div style="margin-top: 16px; padding: 14px; border-radius: 12px; background: #f8fafc; color: #334155; font-size: 14px;">
            <strong style="display: block; margin-bottom: 6px; color: #0f2356;">Ghi chú của khách thuê</strong>
            ${escapeHtml(payload.note)}
          </div>
        ` : ""}

        <p style="margin-top: 22px; color: #64748b; font-size: 13px;">Vui lòng liên hệ lại với khách thuê để xác nhận lịch hẹn.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`Viewing schedule email sent to ${toEmail} for room: ${payload.roomTitle}`);
  return true;
}

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

export async function sendApprovalEmail(
  toEmail: string,
  username: string,
  roomTitle: string
): Promise<boolean> {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("⚠️ EMAIL_USER or EMAIL_PASS not configured — approval email not sent.");
    return false;
  }

  const mailOptions = {
    from: `"BestRoom Support" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `[BestRoom] Tin đăng phòng trọ "${roomTitle}" của bạn ĐÃ ĐƯỢC DUYỆT!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <div style="text-align: center; margin-bottom: 20px;">
          <span style="font-size: 40px;">🎉</span>
          <h2 style="color: #10b981; margin: 10px 0 0 0; font-weight: 905;">Tin đăng của bạn đã được phê duyệt!</h2>
        </div>
        <p>Xin chào <b>${username}</b>,</p>
        <p>Chúng tôi vui mừng thông báo rằng tin đăng phòng trọ của bạn trên hệ thống <b>BestRoom</b> đã được quản trị viên duyệt thành công và hiện đang được hiển thị công khai.</p>
        
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 18px; border-radius: 12px; margin: 25px 0;">
          <strong style="color: #166534; font-size: 14px; display: block; margin-bottom: 5px;">📍 Phòng trọ được duyệt:</strong>
          <span style="color: #1e293b; font-size: 13px; font-weight: 600;">${roomTitle}</span>
        </div>

        <p>Khách hàng tìm kiếm phòng trọ hiện đã có thể xem đầy đủ thông tin chi tiết và liên lạc trực tiếp với bạn.</p>
        <p>Cảm ơn bạn đã đồng hành và chia sẻ thông tin phòng trọ chất lượng cùng BestRoom!</p>

        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
        <p style="font-size: 11px; color: #9ca3af; text-align: center; line-height: 1.5;">Hệ thống kết nối phòng trọ BestRoom<br/>© 2026 BestRoom. All rights reserved.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`✉️ Approval email sent to ${toEmail} for room: ${roomTitle}`);
  return true;
}

export async function sendRejectionEmail(
  toEmail: string,
  username: string,
  roomTitle: string,
  reason: string,
  roomDetails: { price: number; area: number; address: string }
): Promise<boolean> {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("⚠️ EMAIL_USER or EMAIL_PASS not configured — rejection email not sent.");
    return false;
  }

  const priceText = roomDetails.price.toLocaleString("vi-VN") + " đ/tháng";

  const mailOptions = {
    from: `"BestRoom Support" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `[BestRoom] Yêu cầu duyệt tin phòng trọ "${roomTitle}" BỊ TỪ CHỐI!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <div style="text-align: center; margin-bottom: 20px;">
          <span style="font-size: 40px;">⚠️</span>
          <h2 style="color: #ef4444; margin: 10px 0 0 0; font-weight: 905;">Tin đăng bị từ chối phê duyệt</h2>
        </div>
        <p>Xin chào <b>${username}</b>,</p>
        <p>Cảm ơn bạn đã gửi tin đăng phòng trọ lên BestRoom. Tuy nhiên, sau khi kiểm tra, chúng tôi rất tiếc phải thông báo rằng yêu cầu duyệt tin của bạn đã bị từ chối.</p>
        
        <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 18px; border-radius: 12px; margin: 25px 0;">
          <strong style="color: #991b1b; font-size: 14px; display: block; margin-bottom: 6px;">❌ Lý do từ chối kiểm duyệt:</strong>
          <span style="color: #ef4444; font-size: 13px; font-weight: bold; line-height: 1.5;">${reason}</span>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 18px; border-radius: 12px; margin: 25px 0; font-size: 13px;">
          <strong style="color: #334155; display: block; margin-bottom: 10px;">📋 Chi tiết phòng trọ đã gửi:</strong>
          <table style="width: 100%; border-collapse: collapse; line-height: 1.8;">
            <tr>
              <td style="color: #64748b; width: 100px;">Tiêu đề:</td>
              <td style="color: #1e293b; font-weight: 600;">${roomTitle}</td>
            </tr>
            <tr>
              <td style="color: #64748b;">Giá thuê:</td>
              <td style="color: #1e293b; font-weight: 600; color: #b91c1c;">${priceText}</td>
            </tr>
            <tr>
              <td style="color: #64748b;">Diện tích:</td>
              <td style="color: #1e293b;">${roomDetails.area} m²</td>
            </tr>
            <tr>
              <td style="color: #64748b;">Địa chỉ:</td>
              <td style="color: #1e293b;">${roomDetails.address}</td>
            </tr>
          </table>
        </div>

        <p><b>Hướng dẫn xử lý:</b> Bạn vui lòng truy cập vào trang quản trị tài khoản, xem chi tiết bài đăng và điều chỉnh lại các thông tin chưa phù hợp để gửi duyệt lại.</p>

        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
        <p style="font-size: 11px; color: #9ca3af; text-align: center; line-height: 1.5;">Hệ thống kết nối phòng trọ BestRoom<br/>© 2026 BestRoom. All rights reserved.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`✉️ Rejection email sent to ${toEmail} for room: ${roomTitle}`);
  return true;
}

