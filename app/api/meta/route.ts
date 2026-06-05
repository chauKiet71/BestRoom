import { NextResponse } from "next/server";
import { ensureSchema, sql } from "@/lib/db";

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
    return NextResponse.json(
      { error: "Cannot retrieve metadata: " + err.message },
      { status: 500 }
    );
  }
}
