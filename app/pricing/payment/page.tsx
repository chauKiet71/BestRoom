"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Copy, Loader2, QrCode, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { pricingService } from "@/services/pricingService";
import PageLoader from "@/components/PageLoader";

type PaymentData = {
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
};

const formatPrice = (value: number) => `${value.toLocaleString("vi-VN")} đ`;

export default function SepayPaymentPage() {
  const router = useRouter();
  const { currentUser, setCurrentUser, setAuthModalMode, setIsAuthModalOpen } = useApp();
  const [planId, setPlanId] = useState("");
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [status, setStatus] = useState<"pending" | "paid" | "failed">("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const createdRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setPlanId(params.get("planId") || "");
  }, []);

  useEffect(() => {
    if (!planId) return;

    if (!currentUser) {
      setAuthModalMode("login");
      setIsAuthModalOpen(true);
      router.push("/pricing");
      return;
    }

    if (createdRef.current) return;
    createdRef.current = true;

    const createPayment = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await pricingService.createSepayCheckout(planId, currentUser.role, currentUser.id);
        setPayment(data);
      } catch (err: any) {
        setError(err.message || "Không thể tạo mã QR thanh toán.");
      } finally {
        setLoading(false);
      }
    };

    createPayment();
  }, [currentUser, planId, router, setAuthModalMode, setIsAuthModalOpen]);

  useEffect(() => {
    if (!payment || !currentUser || status !== "pending") return;

    const timer = window.setInterval(async () => {
      try {
        const data = await pricingService.getSepayPaymentStatus(payment.invoiceNumber, currentUser.role, currentUser.id);
        setStatus(data.status);
        if (data.status === "paid" && data.postingStats) {
          const updatedUser = { ...currentUser, ...data.postingStats };
          setCurrentUser(updatedUser);
          localStorage.setItem("bestroom_user", JSON.stringify(updatedUser));
          window.clearInterval(timer);
        }
      } catch {
        // SePay IPN cÃ³ thá»ƒ chÆ°a vá» ká»‹p; giá»¯ nguyÃªn tráº¡ng thÃ¡i chá».
      }
    }, 5000);

    return () => window.clearInterval(timer);
  }, [currentUser, payment, setCurrentUser, status]);

  const copyText = async (label: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(null), 1600);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-20">
        <PageLoader text="Đang tạo mã QR thanh toán..." />
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="mx-auto max-w-[760px] px-4 py-16 text-center">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm font-bold text-red-600">
          {error || "Không tìm thấy giao dịch thanh toán."}
        </div>
        <button
          type="button"
          onClick={() => router.push("/pricing")}
          className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-black text-white hover:bg-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại bảng giá
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={() => router.push("/pricing")}
        className="mb-5 inline-flex items-center gap-2 text-sm font-black text-blue-600 hover:text-blue-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại bảng giá
      </button>

      <div className="grid gap-6 lg:grid-cols-[1fr_440px]">
        <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="flex items-start gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
              <QrCode className="h-7 w-7" />
            </span>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">Thanh toán</p>
              <h1 className="mt-2 text-3xl font-black leading-tight text-blue-950">Quét mã QR để kích hoạt gói</h1>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                Sau khi thanh toán thành công, hệ thống sẽ tự động kích hoạt gói cho bạn.
              </p>
            </div>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <InfoBox label="Gói đăng tin" value={payment.plan.name} />
            <InfoBox label="Số lượt đăng" value={`${payment.plan.postLimit} lượt`} />
            <InfoBox label="Thời hạn" value={`${payment.plan.durationDays} ngày`} />
            <InfoBox label="Số tiền" value={formatPrice(payment.amount)} highlight />
          </div>

          <div className="mt-6 space-y-3">
            <CopyRow label="Ngân hàng" value={payment.bank} copied={copied === "bank"} onCopy={() => copyText("bank", payment.bank)} />
            <CopyRow label="Tài khoản" value={"LE CHAU KIET"} copied={copied === "account"} onCopy={() => copyText("account", payment.account)} />
            <CopyRow label="Số tiền" value={String(payment.amount)} copied={copied === "amount"} onCopy={() => copyText("amount", String(payment.amount))} />
            <CopyRow label="Nội dung" value={payment.description} copied={copied === "description"} onCopy={() => copyText("description", payment.description)} />
          </div>
        </section>

        <aside className="rounded-3xl border border-blue-100 bg-white p-6 text-center shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
          <div className="rounded-3xl bg-slate-50 p-4">
            <img src={payment.qrUrl} alt="Mã QR thanh toán SePay" className="mx-auto aspect-square w-full max-w-[340px] rounded-2xl bg-white object-contain p-3" />
          </div>
          <p className="mt-5 text-sm font-bold text-slate-500">Trạng thái giao dịch</p>
          <div className={`mx-auto mt-2 inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-black ${
            status === "paid"
              ? "bg-emerald-50 text-emerald-700"
              : status === "failed"
                ? "bg-red-50 text-red-600"
                : "bg-blue-50 text-blue-700"
          }`}>
            {status === "paid" ? <CheckCircle2 className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />}
            {status === "paid" ? "Đã thanh toán" : status === "failed" ? "Thanh toán lỗi" : "Đang chờ thanh toán"}
          </div>

          {status === "paid" && (
            <button
              type="button"
              onClick={() => router.push(`/user/${currentUser?.username}?edit&tab=listing`)}
              className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white hover:bg-blue-700"
            >
              Đăng tin phòng trọ
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}

function InfoBox({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className={`mt-1 text-lg font-black ${highlight ? "text-blue-600" : "text-blue-950"}`}>{value}</p>
    </div>
  );
}

function CopyRow({ label, value, copied, onCopy }: { label: string; value: string; copied: boolean; onCopy: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <div className="min-w-0 text-left">
        <p className="text-xs font-bold text-slate-400">{label}</p>
        <p className="truncate text-sm font-black text-blue-950">{value}</p>
      </div>
      <button
        type="button"
        onClick={onCopy}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-blue-100 text-blue-600 hover:bg-blue-50"
        aria-label={`Sao chép ${label}`}
      >
        {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}
