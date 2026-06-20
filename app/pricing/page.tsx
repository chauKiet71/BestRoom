"use client";

import React, { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Crown, Receipt, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { PricingPlan } from "@/types";
import { pricingService } from "@/services/pricingService";
import { userService } from "@/services/userService";
import PageLoader from "@/components/PageLoader";

const formatPrice = (value: number) => `${value.toLocaleString("vi-VN")} đ`;

export default function PricingPage() {
  const router = useRouter();
  const { currentUser, setCurrentUser, setAuthModalMode, setIsAuthModalOpen } = useApp();
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buyingPlanId, setBuyingPlanId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"success" | "error" | "cancel" | null>(null);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await pricingService.getPlans();
        setPlans(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.message || "Không thể tải bảng giá.");
      } finally {
        setLoading(false);
      }
    };

    loadPlans();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const status = params.get("payment");
    if (status === "success" || status === "error" || status === "cancel") {
      setPaymentStatus(status);
    }
  }, []);

  useEffect(() => {
    if (paymentStatus !== "success" || !currentUser) return;

    const timer = window.setTimeout(async () => {
      try {
        const freshUser = await userService.getUser(currentUser.id);
        const updatedUser = { ...currentUser, ...freshUser };
        setCurrentUser(updatedUser);
        localStorage.setItem("bestroom_user", JSON.stringify(updatedUser));
      } catch {
        // IPN cÃ³ thá»ƒ xá»­ lÃ½ cháº­m hÆ¡n redirect; header sáº½ tá»± Ä‘á»“ng bá»™ láº¡i sau.
      }
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [currentUser, paymentStatus, setCurrentUser]);

  const handleBuyPlan = async (planId: string) => {
    if (!currentUser) {
      setAuthModalMode("register");
      setIsAuthModalOpen(true);
      return;
    }

    try {
      setBuyingPlanId(planId);
      router.push(`/pricing/payment?planId=${encodeURIComponent(planId)}`);
    } catch (err: any) {
      alert(err.message || "Không thể kích hoạt gói đăng tin lúc này.");
    } finally {
      setBuyingPlanId(null);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-center px-4 py-24">
        <PageLoader text="Đang tải bảng giá đăng tin..." className="py-0" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">
      

      {error && (
        <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-600">
          {error}
        </div>
      )}

      {paymentStatus && (
        <div className={`mt-6 rounded-2xl border px-5 py-4 text-sm font-bold ${
          paymentStatus === "success"
            ? "border-emerald-100 bg-emerald-50 text-emerald-700"
            : "border-amber-100 bg-amber-50 text-amber-700"
        }`}>
          {paymentStatus === "success"
            ? "Thanh toan da hoan tat. He thong se cap nhat goi dang tin sau khi SePay xac nhan IPN."
            : paymentStatus === "cancel"
              ? "Ban da huy thanh toan. Goi chua duoc kich hoat."
              : "Thanh toan khong thanh cong. Vui long thu lai hoac chon goi khac."}
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-semibold leading-6 text-blue-800">
        Chủ trọ được đăng 3 tin miễn phí. Khi mua gói, bạn được đăng tối đa theo giới hạn của gói trong thời gian gói còn hiệu lực. Mỗi tin đăng sẽ hiển thị 30 ngày kể từ ngày đăng.
      </div>

      <section className="mt-10 grid items-center gap-7 lg:grid-cols-[0.96fr_1.08fr_0.96fr]">
        {plans.map((plan, index) => (
          <article
            key={plan.id}
            className={`relative overflow-hidden rounded-[26px] border bg-white shadow-[0_18px_48px_rgba(15,23,42,0.08)] transition ${
              index === 1
                ? "min-h-[640px] border-blue-500 p-7 ring-2 ring-blue-100 lg:-my-5 lg:scale-[1.04]"
                : "min-h-[590px] border-slate-200 p-6"
            }`}
          >
            {index === 1 && (
              <span className="absolute right-5 top-5 inline-flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-white">
                <Crown className="h-3.5 w-3.5" />
                Phổ biến
              </span>
            )}
            <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">{plan.name}</p>
            <h2 className="mt-3 text-4xl font-black text-blue-950">{formatPrice(plan.price)}</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">Thời hạn {plan.durationDays} ngày</p>
            <p className="mt-4 min-h-[52px] text-sm font-medium leading-6 text-slate-600">{plan.description}</p>

            <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Quyền lợi</p>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="text-3xl font-black text-blue-700">{plan.postLimit}</p>
                  <p className="text-sm font-semibold text-slate-500">lượt đăng tin</p>
                </div>
                <ShieldCheck className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <ul className="mt-6 space-y-3">
              {[
                `${plan.postLimit} lượt đăng trong gói`,
                `Hiệu lực ${plan.durationDays} ngày`,
                "Tin đăng vẫn qua bước admin duyệt",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm font-semibold text-slate-600">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                  {item}
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => handleBuyPlan(plan.id)}
              disabled={buyingPlanId === plan.id}
              className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#ffc400] text-sm font-black text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {buyingPlanId === plan.id ? "Đang chuyển sang SePay..." : "Đăng ký ngay"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </article>
        ))}
      </section>
    </div>
  );
}
