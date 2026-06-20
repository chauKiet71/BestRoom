import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ensureSchema, sql } from "@/lib/db";
import { activatePlanForUser, getUserPostingStats } from "@/lib/pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function pickFirstValue(body: any, keys: string[]) {
  for (const key of keys) {
    if (body?.[key] !== undefined && body?.[key] !== null && body?.[key] !== "") {
      return String(body[key]);
    }
  }
  return "";
}

function isPaidEvent(body: any) {
  const eventName = pickFirstValue(body, ["event", "event_name", "operation", "status", "transaction_status"]);
  if (!eventName) return true;
  return ["ORDER_PAID", "PAID", "SUCCESS", "COMPLETED"].includes(eventName.toUpperCase());
}

function parseAmount(value: string) {
  return Number(value.replace(/[^\d]/g, "") || 0);
}

function normalizeSecret(value: string) {
  return value.replace(/^(Bearer|Apikey)\s+/i, "").trim();
}

export async function GET() {
  return NextResponse.json({ success: true, message: "SePay IPN endpoint is ready." });
}

export async function POST(request: NextRequest) {
  try {
    await ensureSchema();

    const ipnSecret = normalizeSecret(process.env.SEPAY_IPN_SECRET || process.env.SEPAY_SECRET_KEY || "");
    if (ipnSecret) {
      const receivedSecret =
        request.headers.get("x-secret-key") ||
        request.headers.get("x-sepay-secret-key") ||
        normalizeSecret(request.headers.get("authorization") || "") ||
        "";

      if (receivedSecret !== ipnSecret) {
        return NextResponse.json({ success: false, error: "Invalid IPN secret." }, { status: 401 });
      }
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: true, ignored: true, reason: "Empty or invalid JSON payload." });
    }
    const invoiceNumber = pickFirstValue(body, [
      "order_invoice_number",
      "invoice_number",
      "invoiceNumber",
      "orderCode",
      "referenceCode",
    ]);
    const transferContent = pickFirstValue(body, [
      "content",
      "description",
      "transfer_content",
      "transaction_content",
      "des",
    ]);
    const paidAmount = parseAmount(pickFirstValue(body, [
      "amount",
      "transferAmount",
      "transfer_amount",
      "transaction_amount",
    ]));

    if (!invoiceNumber && !transferContent) {
      return NextResponse.json({ success: true, ignored: true, reason: "Missing payment reference." });
    }

    if (!isPaidEvent(body)) {
      if (invoiceNumber) {
        await sql`
          UPDATE plan_payments
          SET status = 'failed',
              provider_ref = ${pickFirstValue(body, ["transaction_id", "transactionId", "id"])},
              updated_at = CURRENT_TIMESTAMP
          WHERE invoice_number = ${invoiceNumber}
            AND status = 'pending'
        `;
      }

      return NextResponse.json({ success: true, ignored: true });
    }

    let paymentRows;
    if (invoiceNumber) {
      paymentRows = await sql`
        SELECT
          pp.id AS payment_id,
          pp.user_id,
          pp.plan_id,
          pp.status AS payment_status,
          p.id,
          p.name,
          p.price,
          p.post_limit,
          p.duration_days
        FROM plan_payments pp
        JOIN pricing_plans p ON p.id = pp.plan_id
        WHERE pp.invoice_number = ${invoiceNumber}
        LIMIT 1
      `;
    } else {
      paymentRows = await sql`
        SELECT
          pp.id AS payment_id,
          pp.user_id,
          pp.plan_id,
          pp.status AS payment_status,
          p.id,
          p.name,
          p.price,
          p.post_limit,
          p.duration_days
        FROM plan_payments pp
        JOIN pricing_plans p ON p.id = pp.plan_id
        JOIN users u ON u.id = pp.user_id
        WHERE pp.status = 'pending'
          AND pp.amount = ${paidAmount}
          AND POSITION(LOWER(u.username) IN LOWER(${transferContent})) > 0
        ORDER BY pp.created_at DESC
        LIMIT 1
      `;
    }

    if (paymentRows.length === 0) {
      return NextResponse.json({ success: true, ignored: true, reason: "Payment not found." });
    }

    const payment = paymentRows[0];
    if (payment.payment_status === "paid") {
      return NextResponse.json({ success: true, alreadyProcessed: true });
    }

    const purchase = await activatePlanForUser(payment.user_id, payment, payment.payment_id);
    const providerRef = pickFirstValue(body, ["transaction_id", "transactionId", "id"]);

    await sql`
      UPDATE plan_payments
      SET status = 'paid',
          provider_ref = ${providerRef},
          paid_at = COALESCE(paid_at, CURRENT_TIMESTAMP),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${payment.payment_id}
    `;

    const postingStats = await getUserPostingStats(payment.user_id);

    return NextResponse.json({
      success: true,
      purchase,
      postingStats,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: "Server error: " + err.message }, { status: 500 });
  }
}
