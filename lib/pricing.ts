import { sql } from "@/lib/db";
import { PricingPlan, UserPlanPurchase } from "@/types";

export const FREE_POST_LIMIT = 3;

export function mapPlanFromDb(row: any): PricingPlan {
  return {
    id: row.id,
    name: row.name,
    description: row.description || "",
    price: Number(row.price || 0),
    postLimit: Number(row.post_limit || 0),
    durationDays: Number(row.duration_days || 30),
    isActive: Boolean(row.is_active),
    subscriberCount: row.subscriber_count !== undefined ? Number(row.subscriber_count || 0) : undefined,
    revenue: row.revenue !== undefined ? Number(row.revenue || 0) : undefined,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
  };
}

export function mapPurchaseFromDb(row: any): UserPlanPurchase {
  return {
    id: row.id,
    userId: row.user_id,
    planId: row.plan_id,
    planName: row.plan_name,
    pricePaid: Number(row.price_paid || 0),
    postLimit: Number(row.post_limit || 0),
    remainingPosts: Number(row.remaining_posts || 0),
    status: row.status === "expired" ? "expired" : "active",
    startAt: row.start_at ? new Date(row.start_at).toISOString() : new Date().toISOString(),
    endAt: row.end_at ? new Date(row.end_at).toISOString() : new Date().toISOString(),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

export async function syncExpiredPlans(userId?: string) {
  if (userId) {
    await sql`
      UPDATE user_plan_purchases
      SET status = 'expired'
      WHERE user_id = ${userId}
        AND status = 'active'
        AND end_at < CURRENT_TIMESTAMP
    `;
    return;
  }

  await sql`
    UPDATE user_plan_purchases
    SET status = 'expired'
    WHERE status = 'active'
      AND end_at < CURRENT_TIMESTAMP
  `;
}

export async function getActivePlanForUser(userId: string): Promise<UserPlanPurchase | null> {
  await syncExpiredPlans(userId);

  const rows = await sql`
    SELECT *
    FROM user_plan_purchases
    WHERE user_id = ${userId}
      AND status = 'active'
      AND end_at >= CURRENT_TIMESTAMP
    ORDER BY end_at ASC, created_at ASC
    LIMIT 1
  `;

  if (rows.length === 0) return null;

  const purchase = mapPurchaseFromDb(rows[0]);
  const usageRows = await sql`
    SELECT COUNT(*)::int AS used
    FROM rooms
    WHERE owner_id = ${userId}
      AND created_at >= ${new Date(purchase.startAt)}
      AND created_at <= ${new Date(purchase.endAt)}
  `;
  const usedPosts = Number(usageRows[0]?.used || 0);
  purchase.remainingPosts = Math.max(0, purchase.postLimit - usedPosts);

  await sql`
    UPDATE user_plan_purchases
    SET remaining_posts = ${purchase.remainingPosts}
    WHERE id = ${purchase.id}
  `;

  return purchase;
}

export async function activatePlanForUser(userId: string, plan: any, paymentId?: string) {
  await syncExpiredPlans(userId);
  await sql`
    UPDATE user_plan_purchases
    SET status = 'expired'
    WHERE user_id = ${userId}
      AND status = 'active'
  `;

  const durationDays = Number(plan.duration_days || plan.durationDays || 30);
  const endAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
  const purchaseId = `purchase-${Date.now()}`;
  const purchaseRows = await sql`
    INSERT INTO user_plan_purchases (
      id, user_id, plan_id, plan_name, price_paid, post_limit, remaining_posts, status, start_at, end_at
    )
    VALUES (
      ${purchaseId},
      ${userId},
      ${plan.id},
      ${plan.name},
      ${Number(plan.price || 0)},
      ${Number(plan.post_limit || plan.postLimit || 0)},
      ${Number(plan.post_limit || plan.postLimit || 0)},
      'active',
      CURRENT_TIMESTAMP,
      ${endAt}
    )
    RETURNING *
  `;

  if (paymentId) {
    await sql`
      UPDATE plan_payments
      SET status = 'paid',
          paid_at = COALESCE(paid_at, CURRENT_TIMESTAMP),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${paymentId}
    `;
  }

  return mapPurchaseFromDb(purchaseRows[0]);
}

export async function getUserPostingStats(userId: string) {
  const userRows = await sql`
    SELECT COALESCE(free_posts_used, 0)::int AS free_posts_used
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `;

  const freePostsUsed = Number(userRows[0]?.free_posts_used || 0);
  const activePlan = await getActivePlanForUser(userId);

  return {
    freePostsLimit: FREE_POST_LIMIT,
    freePostsUsed,
    freePostsRemaining: Math.max(0, FREE_POST_LIMIT - freePostsUsed),
    activePlan,
  };
}

export async function consumePostingCredit(userId: string) {
  const freeRows = await sql`
    UPDATE users
    SET free_posts_used = COALESCE(free_posts_used, 0) + 1
    WHERE id = ${userId}
      AND COALESCE(free_posts_used, 0) < ${FREE_POST_LIMIT}
    RETURNING COALESCE(free_posts_used, 0)::int AS free_posts_used
  `;

  if (freeRows.length > 0) {
    return { source: "free" as const, freePostsUsed: Number(freeRows[0].free_posts_used || 0) };
  }

  await syncExpiredPlans(userId);

  const activePlan = await getActivePlanForUser(userId);
  if (!activePlan) {
    return { source: "none" as const };
  }

  return { source: "plan" as const, activePlan };
}
