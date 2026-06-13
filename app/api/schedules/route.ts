import { NextResponse } from "next/server";
import { ensureSchema, sql } from "@/lib/db";
import { sendViewingScheduleEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    await ensureSchema();

    const body = await request.json();
    const {
      roomId,
      visitorName,
      visitorPhone,
      viewingDate,
      timeSlot,
      contactMethod,
      visitorsCount,
      note,
    } = body;

    if (!roomId || !visitorName || !visitorPhone || !viewingDate || !timeSlot || !contactMethod || !visitorsCount) {
      return NextResponse.json(
        { error: "Vui lòng điền đầy đủ thông tin đặt lịch." },
        { status: 400 }
      );
    }

    const roomRows = await sql`
      SELECT
        r.id,
        r.title,
        r.price,
        r.city,
        r.district,
        r.ward,
        r.street,
        r.address_detailed,
        r.contact_name,
        r.owner_id,
        u.email AS owner_email,
        u.username AS owner_username,
        u.fullname AS owner_fullname
      FROM rooms r
      LEFT JOIN users u ON u.id = r.owner_id
      WHERE r.id = ${roomId}
      LIMIT 1
    `;

    if (roomRows.length === 0) {
      return NextResponse.json({ error: "Không tìm thấy phòng trọ." }, { status: 404 });
    }

    const room = roomRows[0];
    if (!room.owner_email) {
      return NextResponse.json(
        { error: "Tin đăng này chưa có email người đăng để nhận lịch hẹn." },
        { status: 400 }
      );
    }

    const roomAddress =
      room.address_detailed ||
      [room.street, room.ward, room.district, room.city].filter(Boolean).join(", ");

    const sent = await sendViewingScheduleEmail(room.owner_email, {
      ownerName: room.owner_fullname || room.owner_username || room.contact_name || "Chủ tin",
      roomTitle: room.title,
      roomPrice: Number(room.price || 0),
      roomAddress,
      visitorName,
      visitorPhone,
      viewingDate,
      timeSlot,
      contactMethod,
      visitorsCount,
      note,
    });

    if (!sent) {
      return NextResponse.json(
        { error: "Email chưa được cấu hình. Vui lòng kiểm tra EMAIL_USER và EMAIL_PASS trong .env." },
        { status: 500 }
      );
    }

    await sql`
      INSERT INTO viewing_schedules (
        id,
        room_id,
        owner_id,
        visitor_name,
        visitor_phone,
        viewing_date,
        time_slot,
        contact_method,
        visitors_count,
        note
      ) VALUES (
        ${`schedule-${Date.now()}`},
        ${room.id},
        ${room.owner_id || null},
        ${visitorName},
        ${visitorPhone},
        ${viewingDate},
        ${timeSlot},
        ${contactMethod},
        ${visitorsCount},
        ${note || ""}
      )
    `;

    return NextResponse.json({ success: true, message: "Đã gửi lịch hẹn đến email người đăng tin." });
  } catch (err: any) {
    console.error("Schedule email error:", err);
    return NextResponse.json(
      { error: err.message || "Không thể gửi thông tin đặt lịch." },
      { status: 500 }
    );
  }
}
