import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ensureSchema, sql } from "@/lib/db";
import { mapRoomFromDb } from "@/lib/mappers";

export async function GET() {
  try {
    await ensureSchema();
    const rows = await sql`SELECT * FROM rooms ORDER BY created_at DESC`;
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
    if (userRole !== "admin") {
      return NextResponse.json(
        { error: "Quyền truy cập bị từ chối. Chỉ tài khoản Admin mới có quyền thêm phòng!" },
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
      rating: Number(newRoom.rating || 5),
      buildYear: Number(newRoom.buildYear || 2024),
      images: Array.isArray(newRoom.images) ? newRoom.images : [newRoom.image].filter(Boolean),
      interestedCount: 0,
      createdAt: new Date().toISOString(),
      hasBalcony: !!newRoom.hasBalcony,
      hasMezzanine: !!newRoom.hasMezzanine,
      hasFurniture: !!newRoom.hasFurniture,
      electricityPrice: Number(newRoom.electricityPrice || 3500),
      district: newRoom.district || ""
    };

    const rows = await sql`
      INSERT INTO rooms (
        id, title, description, price, area, city, district, ward, street, address_detailed,
        contact_name, contact_phone, image, images, is_shared_owner, rating,
        has_wifi, water_fee_type, status, hours_type, build_year, has_parking,
        is_people_limited, max_people, has_elevator, has_contract, interested_count, created_at,
        has_balcony, has_mezzanine, has_furniture, electricity_price
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
        ${preparedRoom.electricityPrice}
      )
      RETURNING *
    `;

    return NextResponse.json(mapRoomFromDb(rows[0]), { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Server error: " + err.message },
      { status: 505 }
    );
  }
}
