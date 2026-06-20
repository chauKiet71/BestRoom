import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ensureSchema, sql } from "@/lib/db";
import { getUserPostingStats } from "@/lib/pricing";

const SEPAY_ACCOUNT = process.env.SEPAY_ACCOUNT || "LOCSPAY000339156";
const SEPAY_BANK = process.env.SEPAY_BANK || "ACB";

function buildSepayQrUrl(amount: number, description: string) {
  const params = new URLSearchParams({
    acc: SEPAY_ACCOUNT,
    bank: SEPAY_BANK,
    amount: String(amount),
    des: description,
  });

  return `https://qr.sepay.vn/img?${params.toString()}`;
}

export async function POST(request: NextRequest) {
  try {
    await ensureSchema();

    const userRole = request.headers.get("x-user-role");
    const userId = request.headers.get("x-user-id");
    if (!userId || (userRole !== "user" && userRole !== "admin")) {
      return NextResponse.json({ error: "Bạn cần đăng nhập để mua gói đăng tin." }, { status: 403 });
    }

    const { planId } = await request.json();
    if (!planId) {
      return NextResponse.json({ error: "Thiếu mã gói dịch vụ." }, { status: 400 });
    }

    const planRows = await sql`
      SELECT *
      FROM pricing_plans
      WHERE id = ${planId}
        AND is_active = TRUE
      LIMIT 1
    `;

    if (planRows.length === 0) {
      return NextResponse.json({ error: "Gói dịch vụ không còn khả dụng." }, { status: 404 });
    }

    const userRows = await sql`
      SELECT username
      FROM users
      WHERE id = ${userId}
      LIMIT 1
    `;

    if (userRows.length === 0) {
      return NextResponse.json({ error: "Không tìm thấy tài khoản thanh toán." }, { status: 404 });
    }

    const plan = planRows[0];
    const username = String(userRows[0].username || userId);
    const amount = Number(plan.price || 0);
    const invoiceNumber = `BR-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const paymentId = `payment-${Date.now()}`;
    const qrUrl = buildSepayQrUrl(amount, username);

    await sql`
      INSERT INTO plan_payments (
        id, invoice_number, user_id, plan_id, amount, status, provider, checkout_fields
      )
      VALUES (
        ${paymentId},
        ${invoiceNumber},
        ${userId},
        ${plan.id},
        ${amount},
        'pending',
        'sepay',
        ${JSON.stringify({
          qrUrl,
          amount,
          description: username,
          account: SEPAY_ACCOUNT,
          bank: SEPAY_BANK,
        })}::jsonb
      )
    `;

    return NextResponse.json({
      success: true,
      paymentId,
      invoiceNumber,
      qrUrl,
      amount,
      description: username,
      account: SEPAY_ACCOUNT,
      bank: SEPAY_BANK,
      plan: {
        id: plan.id,
        name: plan.name,
        price: amount,
        postLimit: Number(plan.post_limit || 0),
        durationDays: Number(plan.duration_days || 30),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Server error: " + err.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureSchema();

    const invoiceNumber = request.nextUrl.searchParams.get("invoice");
    const userId = request.headers.get("x-user-id");
    if (!invoiceNumber || !userId) {
      return NextResponse.json({ error: "Thiếu thông tin giao dịch." }, { status: 400 });
    }

    const rows = await sql`
      SELECT status, plan_id, created_at
      FROM plan_payments
      WHERE invoice_number = ${invoiceNumber}
        AND user_id = ${userId}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Không tìm thấy giao dịch." }, { status: 404 });
    }

    let status = rows[0].status;
    let postingStats = status === "paid" ? await getUserPostingStats(userId) : null;

    if (status === "pending") {
      const activeRows = await sql`
        SELECT id
        FROM user_plan_purchases
        WHERE user_id = ${userId}
          AND plan_id = ${rows[0].plan_id}
          AND status = 'active'
          AND created_at >= (${rows[0].created_at}::timestamp - INTERVAL '30 minutes')
        LIMIT 1
      `;

      if (activeRows.length > 0) {
        status = "paid";
        postingStats = await getUserPostingStats(userId);
      }
    }

    return NextResponse.json({
      success: true,
      status,
      postingStats,
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Server error: " + err.message }, { status: 500 });
  }
}
