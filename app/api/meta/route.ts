import { NextResponse } from "next/server";
import { ensureSchema, sql } from "@/lib/db";
import { getDefaultRooms } from "@/lib/roomData";

export async function GET() {
  try {
    await ensureSchema();

    const citiesRows = await sql`SELECT DISTINCT city FROM rooms WHERE city IS NOT NULL AND city != ''`;
    const wardsRows = await sql`SELECT DISTINCT ward FROM rooms WHERE ward IS NOT NULL AND ward != ''`;
    const streetsRows = await sql`SELECT DISTINCT street FROM rooms WHERE street IS NOT NULL AND street != ''`;
    const yearsRows = await sql`SELECT DISTINCT build_year FROM rooms WHERE build_year IS NOT NULL ORDER BY build_year DESC`;

    return NextResponse.json({
      cities: citiesRows.map((r: any) => r.city),
      wards: wardsRows.map((r: any) => r.ward),
      streets: streetsRows.map((r: any) => r.street),
      years: yearsRows.map((r: any) => Number(r.build_year))
    });
  } catch (err: any) {
    const rooms = getDefaultRooms();
    const metadata = {
      cities: Array.from(new Set(rooms.map((room: any) => room.city).filter(Boolean))),
      wards: Array.from(new Set(rooms.map((room: any) => room.ward).filter(Boolean))),
      streets: Array.from(new Set(rooms.map((room: any) => room.street).filter(Boolean))),
      years: Array.from(new Set(rooms.map((room: any) => room.buildYear).filter(Boolean))).sort((a, b) => b - a),
    };

    return NextResponse.json(metadata);
  }
}
