import { apiFetch } from "./api";
import { PricingPlan, User, UserPlanPurchase } from "@/types";

export const pricingService = {
  async getPlans(userRole?: string, userId?: string): Promise<PricingPlan[]> {
    const headers: Record<string, string> = {};
    if (userRole) headers["x-user-role"] = userRole;
    if (userId) headers["x-user-id"] = userId;
    return apiFetch("/api/pricing/plans", { headers });
  },

  async purchasePlan(planId: string, userRole: string, userId: string): Promise<{ success: boolean; purchase: UserPlanPurchase; postingStats: Partial<User> }> {
    return apiFetch("/api/pricing/purchase", {
      method: "POST",
      headers: {
        "x-user-role": userRole,
        "x-user-id": userId,
      },
      body: JSON.stringify({ planId }),
    });
  },

  async createSepayCheckout(planId: string, userRole: string, userId: string): Promise<{
    success: boolean;
    paymentId: string;
    invoiceNumber: string;
    qrUrl: string;
    amount: number;
    description: string;
    account: string;
    bank: string;
    plan: {
      id: string;
      name: string;
      price: number;
      postLimit: number;
      durationDays: number;
    };
  }> {
    return apiFetch("/api/pricing/checkout/sepay", {
      method: "POST",
      headers: {
        "x-user-role": userRole,
        "x-user-id": userId,
      },
      body: JSON.stringify({ planId }),
    });
  },

  async getSepayPaymentStatus(invoiceNumber: string, userRole: string, userId: string): Promise<{
    success: boolean;
    status: "pending" | "paid" | "failed";
    postingStats: Partial<User> | null;
  }> {
    return apiFetch(`/api/pricing/checkout/sepay?invoice=${encodeURIComponent(invoiceNumber)}`, {
      headers: {
        "x-user-role": userRole,
        "x-user-id": userId,
      },
    });
  },

  async savePlan(plan: Partial<PricingPlan>, userRole: string, userId: string) {
    if (plan.id) {
      return apiFetch(`/api/pricing/plans/${plan.id}`, {
        method: "PUT",
        headers: {
          "x-user-role": userRole,
          "x-user-id": userId,
        },
        body: JSON.stringify(plan),
      });
    }

    return apiFetch("/api/pricing/plans", {
      method: "POST",
      headers: {
        "x-user-role": userRole,
        "x-user-id": userId,
      },
      body: JSON.stringify(plan),
    });
  },
};
