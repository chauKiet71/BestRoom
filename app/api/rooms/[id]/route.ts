import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ensureSchema, sql } from "@/lib/db";
import { mapRoomFromDb, mapReviewFromDb } from "@/lib/mappers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSchema();
    const { id: roomId } = await params;

    if (!roomId) {
      return NextResponse.json({ error: "Room ID is required." }, { status: 400 });
    }

    // Increment interest count
    await sql`UPDATE rooms SET interested_count = COALESCE(interested_count, 0) + 1 WHERE id = ${roomId}`;

    // Fetch room details
    const roomRows = await sql`SELECT * FROM rooms WHERE id = ${roomId}`;
    if (roomRows.length === 0) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    const mappedRoom = mapRoomFromDb(roomRows[0]);

    // Fetch associated reviews
    const reviewsRows = await sql`SELECT * FROM reviews WHERE room_id = ${roomId} ORDER BY created_at ASC`;
    mappedRoom.reviews = reviewsRows.map(mapReviewFromDb);

    return NextResponse.json(mappedRoom);
  } catch (err: any) {
    return NextResponse.json({ error: "Server error: " + err.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSchema();
    const { id: roomId } = await params;

    if (!roomId) {
      return NextResponse.json({ error: "Room ID is required." }, { status: 400 });
    }

    // Security Check
    const userRole = request.headers.get("x-user-role");
    const userId = request.headers.get("x-user-id");
    if (userRole !== "admin" && userRole !== "user") {
      return NextResponse.json(
        { error: "Quyền truy cập bị từ chối. Bạn cần đăng nhập để sửa đổi phòng!" },
        { status: 403 }
      );
    }

    const updatedFields = await request.json();
    if (!updatedFields.title || !updatedFields.price || !updatedFields.city) {
      return NextResponse.json(
        { error: "Title, Price, and City are required fields." },
        { status: 400 }
      );
    }

    const checkExist = await sql`SELECT id, owner_id FROM rooms WHERE id = ${roomId}`;
    if (checkExist.length === 0) {
      return NextResponse.json({ error: "Room not found to update." }, { status: 404 });
    }

    // If user role is 'user', check ownership
    if (userRole === "user" && checkExist[0].owner_id !== userId) {
      return NextResponse.json(
        { error: "Quyền truy cập bị từ chối. Bạn không phải là chủ sở hữu của phòng trọ này!" },
        { status: 403 }
      );
    }

    const images = Array.isArray(updatedFields.images) ? updatedFields.images : [updatedFields.image].filter(Boolean);
    const approvalStatus = userRole === "admin" ? (updatedFields.approvalStatus || "approved") : "pending";
    const rejectionReason = userRole === "admin" ? (updatedFields.rejectionReason || null) : null;

    const rows = await sql`
      UPDATE rooms SET
        room_type = ${updatedFields.roomType || "Phòng trọ"},
        title = ${updatedFields.title},
        description = ${updatedFields.description || ""},
        price = ${Number(updatedFields.price)},
        area = ${Number(updatedFields.area || 0)},
        city = ${updatedFields.city},
        ward = ${updatedFields.ward || ""},
        street = ${updatedFields.street || ""},
        address_detailed = ${updatedFields.addressDetailed || ""},
        contact_name = ${updatedFields.contactName || ""},
        contact_phone = ${updatedFields.contactPhone || ""},
        image = ${updatedFields.image || images[0] || ""},
        images = ${images},
        is_shared_owner = ${!!updatedFields.isSharedOwner},
        rating = ${updatedFields.rating !== undefined ? Number(updatedFields.rating) : 0},
        has_wifi = ${updatedFields.hasWifi !== false},
        water_fee_type = ${updatedFields.waterFeeType || "có phí"},
        status = ${updatedFields.status || "còn phòng"},
        hours_type = ${updatedFields.hoursType || "tự do"},
        build_year = ${Number(updatedFields.buildYear || 2024)},
        has_parking = ${updatedFields.hasParking !== false},
        parking_fee_type = ${updatedFields.parkingFeeType || "miễn phí"},
        is_people_limited = ${!!updatedFields.isPeopleLimited},
        max_people = ${updatedFields.maxPeople ? Number(updatedFields.maxPeople) : null},
        has_elevator = ${!!updatedFields.hasElevator},
        has_contract = ${updatedFields.hasContract !== false},
        has_balcony = ${!!updatedFields.hasBalcony},
        has_mezzanine = ${!!updatedFields.hasMezzanine},
        has_furniture = ${!!updatedFields.hasFurniture},
        has_air_conditioner = ${!!updatedFields.hasAirConditioner},
        electricity_price = ${Number(updatedFields.electricityPrice || 3500)},
        district = ${updatedFields.district || ""},
        approval_status = ${approvalStatus},
        rejection_reason = ${rejectionReason}
      WHERE id = ${roomId}
      RETURNING *
    `;

    return NextResponse.json(mapRoomFromDb(rows[0]));
  } catch (err: any) {
    return NextResponse.json({ error: "Server error: " + err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSchema();
    const { id: roomId } = await params;

    if (!roomId) {
      return NextResponse.json({ error: "Room ID is required." }, { status: 400 });
    }

    // Security Check
    const userRole = request.headers.get("x-user-role");
    const userId = request.headers.get("x-user-id");
    if (userRole !== "admin" && userRole !== "user") {
      return NextResponse.json(
        { error: "Quyền truy cập bị từ chối. Bạn cần đăng nhập để xóa phòng!" },
        { status: 403 }
      );
    }

    const checkExist = await sql`SELECT id, owner_id FROM rooms WHERE id = ${roomId}`;
    if (checkExist.length === 0) {
      return NextResponse.json({ error: "Room not found to delete." }, { status: 404 });
    }

    // If user role is 'user', check ownership
    if (userRole === "user" && checkExist[0].owner_id !== userId) {
      return NextResponse.json(
        { error: "Quyền truy cập bị từ chối. Bạn không phải là chủ sở hữu của phòng trọ này!" },
        { status: 403 }
      );
    }

    const deleteRes = await sql`DELETE FROM rooms WHERE id = ${roomId} RETURNING id`;
    if (deleteRes.length === 0) {
      return NextResponse.json({ error: "Room not found to delete." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `Room ${roomId} deleted successfully.` });
  } catch (err: any) {
    return NextResponse.json({ error: "Server error: " + err.message }, { status: 500 });
  }
}
