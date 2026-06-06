import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ensureSchema, sql } from "@/lib/db";
import { mapRoomFromDb } from "@/lib/mappers";
import { sendApprovalEmail, sendRejectionEmail } from "@/lib/email";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSchema();
    const { id: roomId } = await params;

    if (!roomId) {
      return NextResponse.json({ error: "Room ID is required." }, { status: 400 });
    }

    // Security Check: Only Admin is allowed to approve/reject rooms
    const userRole = request.headers.get("x-user-role");
    if (userRole !== "admin") {
      return NextResponse.json(
        { error: "Quyền truy cập bị từ chối. Chỉ tài khoản Admin mới có quyền duyệt phòng!" },
        { status: 403 }
      );
    }

    const { action, reason } = await request.json();
    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { error: "Hành động không hợp lệ. Chỉ chấp nhận 'approve' hoặc 'reject'." },
        { status: 400 }
      );
    }

    if (action === "reject" && !reason) {
      return NextResponse.json(
        { error: "Vui lòng cung cấp lý do từ chối kiểm duyệt." },
        { status: 400 }
      );
    }

    // Fetch the room details
    const roomRows = await sql`SELECT * FROM rooms WHERE id = ${roomId}`;
    if (roomRows.length === 0) {
      return NextResponse.json({ error: "Không tìm thấy phòng trọ cần duyệt." }, { status: 404 });
    }
    const room = roomRows[0];

    const approvalStatus = action === "approve" ? "approved" : "rejected";
    const rejectionReason = action === "reject" ? reason : null;

    // Update the room status in the database
    const updateRows = await sql`
      UPDATE rooms 
      SET 
        approval_status = ${approvalStatus},
        rejection_reason = ${rejectionReason}
      WHERE id = ${roomId}
      RETURNING *
    `;

    const updatedRoom = mapRoomFromDb(updateRows[0]);

    // Send email to owner if the room has an owner
    if (room.owner_id) {
      const userRows = await sql`SELECT email, username FROM users WHERE id = ${room.owner_id}`;
      if (userRows.length > 0) {
        const owner = userRows[0];
        try {
          if (action === "approve") {
            await sendApprovalEmail(owner.email, owner.username, room.title);
          } else {
            const address = room.address_detailed || `${room.street}, ${room.ward}, ${room.city}`;
            await sendRejectionEmail(owner.email, owner.username, room.title, reason, {
              price: Number(room.price),
              area: Number(room.area),
              address: address,
            });
          }
        } catch (mailErr) {
          console.error("Failed to send approval/rejection email:", mailErr);
          // We don't fail the whole request if email fails, but we log it
        }
      }
    }

    return NextResponse.json({
      success: true,
      room: updatedRoom,
    });
  } catch (err: any) {
    console.error("Error approving room:", err);
    return NextResponse.json(
      { error: "Server error: " + err.message },
      { status: 500 }
    );
  }
}
