import { NextResponse, NextRequest } from "next/server";
import { ensureSchema, sql } from "@/lib/db";
import { mapRoomFromDb } from "@/lib/mappers";

export async function GET(request: NextRequest) {
  try {
    await ensureSchema();
    const userRole = request.headers.get("x-user-role");
    const userId = request.headers.get("x-user-id");

    let rows;
    if (userRole === "admin") {
      rows = await sql`SELECT * FROM rooms ORDER BY created_at DESC`;
    } else if (userRole === "user" && userId) {
      rows = await sql`
        SELECT * FROM rooms 
        WHERE approval_status = 'approved' OR owner_id = ${userId} 
        ORDER BY created_at DESC
      `;
    } else {
      rows = await sql`SELECT * FROM rooms WHERE approval_status = 'approved' ORDER BY created_at DESC`;
    }
    return NextResponse.json(rows.map(mapRoomFromDb));
  } catch (err: any) {
    return NextResponse.json(
      { error: "Server error: " + err.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureSchema();

    // Security Check
    const userRole = request.headers.get("x-user-role");
    const userId = request.headers.get("x-user-id");
    if (userRole !== "admin" && userRole !== "user") {
      return NextResponse.json(
        { error: "Quyền truy cập bị từ chối. Bạn cần đăng nhập để đăng phòng!" },
        { status: 403 }
      );
    }

    const newRoom = await request.json();
    if (!newRoom.title || !newRoom.price || !newRoom.city) {
      return NextResponse.json(
        { error: "Title, Price, and City are required fields." },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const generatedId = `room-${timestamp}`;

    const preparedRoom = {
      ...newRoom,
      id: generatedId,
      price: Number(newRoom.price),
      area: Number(newRoom.area || 0),
      rating: newRoom.rating !== undefined ? Number(newRoom.rating) : 0,
      buildYear: Number(newRoom.buildYear || 2024),
      images: Array.isArray(newRoom.images) ? newRoom.images : [newRoom.image].filter(Boolean),
      interestedCount: 0,
      createdAt: new Date().toISOString(),
      hasBalcony: !!newRoom.hasBalcony,
      hasMezzanine: !!newRoom.hasMezzanine,
      hasFurniture: !!newRoom.hasFurniture,
      hasAirConditioner: !!newRoom.hasAirConditioner,
      electricityPrice: Number(newRoom.electricityPrice || 3500),
      district: newRoom.district || "",
      ownerId: userId || null,
      approvalStatus: userRole === "admin" ? "approved" : "pending"
    };

    const rows = await sql`
      INSERT INTO rooms (
        id, title, description, price, area, city, district, ward, street, address_detailed,
        contact_name, contact_phone, image, images, is_shared_owner, rating,
        has_wifi, water_fee_type, status, hours_type, build_year, has_parking,
        is_people_limited, max_people, has_elevator, has_contract, interested_count, created_at,
        has_balcony, has_mezzanine, has_furniture, has_air_conditioner, electricity_price, owner_id, approval_status
      ) VALUES (
        ${preparedRoom.id},
        ${preparedRoom.title},
        ${preparedRoom.description || ""},
        ${preparedRoom.price},
        ${preparedRoom.area},
        ${preparedRoom.city},
        ${preparedRoom.district},
        ${preparedRoom.ward},
        ${preparedRoom.street},
        ${preparedRoom.addressDetailed || ""},
        ${preparedRoom.contactName || ""},
        ${preparedRoom.contactPhone || ""},
        ${preparedRoom.image || preparedRoom.images[0] || ""},
        ${preparedRoom.images},
        ${preparedRoom.isSharedOwner || false},
        ${preparedRoom.rating},
        ${preparedRoom.hasWifi !== false},
        ${preparedRoom.waterFeeType || "có phí"},
        ${preparedRoom.status || "còn phòng"},
        ${preparedRoom.hoursType || "tự do"},
        ${preparedRoom.buildYear},
        ${preparedRoom.hasParking !== false},
        ${preparedRoom.isPeopleLimited || false},
        ${preparedRoom.maxPeople || null},
        ${preparedRoom.hasElevator || false},
        ${preparedRoom.hasContract !== false},
        ${preparedRoom.interestedCount},
        ${preparedRoom.createdAt},
        ${preparedRoom.hasBalcony},
        ${preparedRoom.hasMezzanine},
        ${preparedRoom.hasFurniture},
        ${preparedRoom.hasAirConditioner},
        ${preparedRoom.electricityPrice},
        ${preparedRoom.ownerId},
        ${preparedRoom.approvalStatus}
      )
      RETURNING *
    `;

    return NextResponse.json(mapRoomFromDb(rows[0]), { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Server error: " + err.message },
      { status: 500 }
    );
  }
}
