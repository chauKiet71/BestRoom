"use client";

import React from "react";
import { Facebook, Globe2, Mail, MapPin, Phone, Youtube } from "lucide-react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";

export default function Footer() {
  const router = useRouter();
  const { resetFilters } = useApp();

  const goHome = () => {
    resetFilters();
    router.push("/");
  };

  return (
    <footer id="app-footer" className="mt-auto bg-blue-800 text-white">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-8 px-4 py-8 sm:px-6 md:grid-cols-[1.35fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <button onClick={goHome} className="mb-3 rounded-md border-none bg-white p-2 text-left">
            <img src="/bestroom-logo.png" alt="BestRoom" className="h-10 w-auto object-contain" />
          </button>
          <p className="max-w-xs text-sm font-medium leading-relaxed text-blue-50">
            Nền tảng tìm kiếm và đăng tin cho thuê phòng trọ, căn hộ uy tín hàng đầu Việt Nam.
          </p>
          <div className="mt-5 flex gap-3">
            {[Facebook, Youtube, Globe2].map((Icon, index) => (
              <span key={index} className="grid h-8 w-8 place-items-center rounded-full bg-white text-blue-800">
                <Icon className="h-4 w-4" />
              </span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-base font-black">Về chúng tôi</h3>
          <ul className="space-y-2 text-sm font-medium text-blue-50">
            <li>Giới thiệu</li>
            <li>Quy chế hoạt động</li>
            <li>Chính sách bảo mật</li>
            <li>Điều khoản sử dụng</li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-base font-black">Hỗ trợ</h3>
          <ul className="space-y-2 text-sm font-medium text-blue-50">
            <li>Câu hỏi thường gặp</li>
            <li>Hướng dẫn đăng tin</li>
            <li>Thanh toán & Bảng giá</li>
            <li>Liên hệ hỗ trợ</li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-base font-black">Liên hệ</h3>
          <ul className="space-y-3 text-sm font-medium text-blue-50">
            <li className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />42 Tân Thới Nhất, P. Đông Hưng Thuận, TP. Hồ Chí Minh</li>
            <li className="flex gap-2"><Phone className="h-4 w-4 shrink-0" />032 714 2982</li>
            <li className="flex gap-2"><Mail className="h-4 w-4 shrink-0" />bestroom2222@gmail.com</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-blue-700 py-3 text-center text-sm font-medium text-blue-50">
        © 2026 BestRoom.vn - All rights reserved.
      </div>
    </footer>
  );
}
