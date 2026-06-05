import { NextResponse } from "next/server";
import { ensureSchema } from "@/lib/db";

export async function GET() {
  try {
    await ensureSchema();
    return NextResponse.json({ status: "ok" });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Database connection failed: " + err.message },
      { status: 500 }
    );
  }
}
