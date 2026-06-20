import { NextResponse, NextRequest } from "next/server";
import { ensureSchema, sql } from "@/lib/db";
import { mapRoomFromDb } from "@/lib/mappers";
import { consumePostingCredit, getUserPostingStats } from "@/lib/pricing";
import { filterRooms, getDefaultRooms } from "@/lib/roomData";

export async function GET(request: NextRequest) {
  try {
    await ensureSchema();
    const userRole = request.headers.get("x-user-role");
    const userId = request.headers.get("x-user-id");

    const query = (sql as any).query.bind(sql);
    const { searchParams } = new URL(request.url);

    const isPaginated = searchParams.get("paginated") === "true";
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "9");
    const offset = (page - 1) * limit;

    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "DESC";

    // Sanitize sort parameters
    const allowedSortFields = ["created_at", "interested_count", "price", "area", "rating"];
    const verifiedSortBy = allowedSortFields.includes(sortBy) ? sortBy : "created_at";
    const verifiedSortOrder = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const conditions: string[] = [];
    const params: any[] = [];

    // Helper to add parameter and condition
    function addCondition(columnName: string, value: any, operator: string = "=") {
      if (value !== null && value !== undefined && value !== "" && value !== "all") {
        params.push(value);
        conditions.push(`${columnName} ${operator} $${params.length}`);
      }
    }

    // Authorization scopes
    if (userRole === "admin") {
      // Admin sees everything
    } else if (userRole === "user" && userId) {
      params.push(userId);
      conditions.push(`(approval_status = 'approved' OR (owner_id = $${params.length} AND approval_status != 'rejected'))`);
    } else {
      conditions.push(`approval_status = 'approved'`);
    }

    // Filters from search queries
    const searchQuery = searchParams.get("searchQuery");
    if (searchQuery) {
      params.push(`%${searchQuery.toLowerCase()}%`);
      conditions.push(`(
        LOWER(title) LIKE $${params.length} OR 
        LOWER(description) LIKE $${params.length} OR 
        LOWER(street) LIKE $${params.length} OR 
        LOWER(address_detailed) LIKE $${params.length}
      )`);
    }

    const priceRange = searchParams.get("priceRange");
    if (priceRange && priceRange !== "all") {
      if (priceRange === "under-2m") {
        conditions.push(`price < 2000000`);
      } else if (priceRange === "2m-4m") {
        conditions.push(`price >= 2000000 AND price <= 4000000`);
      } else if (priceRange === "4m-7m") {
        conditions.push(`price >= 4000000 AND price <= 7000000`);
      } else if (priceRange === "above-7m") {
        conditions.push(`price > 7000000`);
      }
    }

    const roomType = searchParams.get("roomType");
    if (roomType && roomType !== "all") {
      addCondition("room_type", roomType);
    }

    const areaRange = searchParams.get("areaRange");
    if (areaRange && areaRange !== "all") {
      if (areaRange === "under-20") {
        conditions.push(`area < 20`);
      } else if (areaRange === "20-30") {
        conditions.push(`area >= 20 AND area <= 30`);
      } else if (areaRange === "30-45") {
        conditions.push(`area >= 30 AND area <= 45`);
      } else if (areaRange === "above-45") {
        conditions.push(`area > 45`);
      }
    }

    // Location components
    const city = searchParams.get("city");
    if (city) {
      params.push(`%${city.toLowerCase()}%`);
      conditions.push(`LOWER(city) LIKE $${params.length}`);
    }
    const district = searchParams.get("district");
    if (district) {
      params.push(`%${district.toLowerCase()}%`);
      conditions.push(`LOWER(district) LIKE $${params.length}`);
    }
    const ward = searchParams.get("ward");
    if (ward) {
      params.push(`%${ward.toLowerCase()}%`);
      conditions.push(`LOWER(ward) LIKE $${params.length}`);
    }
    const street = searchParams.get("street");
    if (street) {
      params.push(`%${street.toLowerCase()}%`);
      conditions.push(`LOWER(street) LIKE $${params.length}`);
    }

    // Utilities and regulations
    const isSharedOwner = searchParams.get("isSharedOwner");
    if (isSharedOwner && isSharedOwner !== "all") {
      addCondition("is_shared_owner", isSharedOwner === "yes");
    }

    const rating = searchParams.get("rating");
    if (rating && rating !== "null" && rating !== "") {
      addCondition("rating", Number(rating), ">=");
    }

    const hasWifi = searchParams.get("hasWifi");
    if (hasWifi && hasWifi !== "all") {
      addCondition("has_wifi", hasWifi === "yes");
    }

    const waterFeeType = searchParams.get("waterFeeType");
    if (waterFeeType && waterFeeType !== "all") {
      addCondition("water_fee_type", waterFeeType);
    }

    const status = searchParams.get("status");
    if (status && status !== "all") {
      addCondition("status", status);
    }

    const hoursType = searchParams.get("hoursType");
    if (hoursType && hoursType !== "all") {
      addCondition("hours_type", hoursType);
    }

    const buildYear = searchParams.get("buildYear");
    if (buildYear && buildYear !== "all") {
      addCondition("build_year", Number(buildYear));
    }

    const hasParking = searchParams.get("hasParking");
    if (hasParking && hasParking !== "all") {
      addCondition("has_parking", hasParking === "yes");
    }

    const parkingFeeType = searchParams.get("parkingFeeType");
    if (parkingFeeType && parkingFeeType !== "all") {
      addCondition("parking_fee_type", parkingFeeType);
    }

    const isPeopleLimited = searchParams.get("isPeopleLimited");
    if (isPeopleLimited && isPeopleLimited !== "all") {
      addCondition("is_people_limited", isPeopleLimited === "yes");
    }

    const hasElevator = searchParams.get("hasElevator");
    if (hasElevator && hasElevator !== "all") {
      addCondition("has_elevator", hasElevator === "yes");
    }

    const hasContract = searchParams.get("hasContract");
    if (hasContract && hasContract !== "all") {
      addCondition("has_contract", hasContract === "yes");
    }

    const hasBalcony = searchParams.get("hasBalcony");
    if (hasBalcony && hasBalcony !== "all") {
      addCondition("has_balcony", hasBalcony === "yes");
    }

    const hasMezzanine = searchParams.get("hasMezzanine");
    if (hasMezzanine && hasMezzanine !== "all") {
      addCondition("has_mezzanine", hasMezzanine === "yes");
    }

    const hasFurniture = searchParams.get("hasFurniture");
    if (hasFurniture && hasFurniture !== "all") {
      addCondition("has_furniture", hasFurniture === "yes");
    }

    const hasAirConditioner = searchParams.get("hasAirConditioner");
    if (hasAirConditioner && hasAirConditioner !== "all") {
      addCondition("has_air_conditioner", hasAirConditioner === "yes");
    }

    const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

    if (isPaginated) {
      // 1. Get total count
      const countQuery = `SELECT COUNT(*) as total FROM rooms ${whereClause}`;
      const countResult = await query(countQuery, params);
      const totalCount = Number(countResult[0]?.total || 0);
      const totalPages = Math.ceil(totalCount / limit);

      // 2. Fetch paginated records
      const limitIndex = params.length + 1;
      const offsetIndex = params.length + 2;
      const dataQuery = `
        SELECT * FROM rooms 
        ${whereClause} 
        ORDER BY ${verifiedSortBy} ${verifiedSortOrder} 
        LIMIT $${limitIndex} OFFSET $${offsetIndex}
      `;
      const rows = await query(dataQuery, [...params, limit, offset]);
      
      return NextResponse.json({
        rooms: rows.map(mapRoomFromDb),
        totalCount,
        totalPages,
        currentPage: page
      });
    } else {
      // Fetch all matching records (non-paginated)
      const dataQuery = `
        SELECT * FROM rooms 
        ${whereClause} 
        ORDER BY ${verifiedSortBy} ${verifiedSortOrder}
      `;
      const rows = await query(dataQuery, params);
      return NextResponse.json(rows.map(mapRoomFromDb));
    }
  } catch (err: any) {
    const searchParams = new URL(request.url).searchParams;
    const fallbackFilters = Object.fromEntries(searchParams.entries()) as Record<string, string>;
    const fallbackRooms = getDefaultRooms();
    const filteredRooms = filterRooms(fallbackRooms, fallbackFilters as any);
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "9");
    const isPaginated = searchParams.get("paginated") === "true";

    if (isPaginated) {
      const totalCount = filteredRooms.length;
      const totalPages = Math.max(1, Math.ceil(totalCount / limit));
      const start = (page - 1) * limit;
      const pagedRooms = filteredRooms.slice(start, start + limit);

      return NextResponse.json({
        rooms: pagedRooms,
        totalCount,
        totalPages,
        currentPage: page,
      });
    }

    return NextResponse.json(filteredRooms);
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

    if (userRole === "user") {
      const postingStats = await getUserPostingStats(userId || "");
      const hasQuota = postingStats.freePostsRemaining > 0 || (postingStats.activePlan?.remainingPosts || 0) > 0;
      if (!hasQuota) {
        return NextResponse.json(
          { error: "Bạn đã dùng hết 3 bài miễn phí. Vui lòng mua gói để tiếp tục đăng tin." },
          { status: 403 }
        );
      }
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
      roomType: newRoom.roomType || "Phòng trọ",
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
        id, room_type, title, description, price, area, city, district, ward, street, address_detailed,
        contact_name, contact_phone, image, images, is_shared_owner, rating,
        has_wifi, water_fee_type, status, hours_type, build_year, has_parking, parking_fee_type,
        is_people_limited, max_people, has_elevator, has_contract, interested_count, created_at,
        has_balcony, has_mezzanine, has_furniture, has_air_conditioner, electricity_price, owner_id, approval_status
      ) VALUES (
        ${preparedRoom.id},
        ${preparedRoom.roomType},
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
        ${preparedRoom.parkingFeeType || "miễn phí"},
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

    if (userRole === "user" && userId) {
      const quotaResult = await consumePostingCredit(userId);
      if (quotaResult.source === "none") {
        await sql`DELETE FROM rooms WHERE id = ${preparedRoom.id}`;
        return NextResponse.json(
          { error: "Bạn đã hết lượt đăng tin miễn phí và chưa có gói còn hiệu lực." },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(mapRoomFromDb(rows[0]), { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Server error: " + err.message },
      { status: 500 }
    );
  }
}
