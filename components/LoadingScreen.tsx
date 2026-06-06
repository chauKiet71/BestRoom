"use client";

import React, { useEffect, useState } from "react";

interface LoadingScreenProps {
  loading: boolean;
}

export default function LoadingScreen({ loading }: LoadingScreenProps) {
  const [shouldRender, setShouldRender] = useState(true);
  const [fadeActive, setFadeActive] = useState(false);

  useEffect(() => {
    if (!loading) {
      setFadeActive(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 500); // 500ms matches the transition-opacity duration-500
      return () => clearTimeout(timer);
    } else {
      setShouldRender(true);
      setFadeActive(false);
    }
  }, [loading]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#4781fd] transition-opacity duration-500 ease-out select-none ${
        fadeActive ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="relative flex flex-col items-center">
        {/* Glow effect background */}
        <div className="absolute w-36 h-36 bg-blue-500/20 rounded-full blur-2xl animate-pulse"></div>

        {/* Outer spinning ring with gradient border */}
        <div className="w-24 h-24 rounded-3xl flex items-center justify-center relative">
          <div className="absolute inset-0 rounded-3xl border-4 border-blue-400/20 border-t-white animate-spin"></div>
          
          {/* Logo container inside */}
          <div className="w-16 h-16 bg-white rounded-2xl p-1 shadow-2xl border border-white/20 relative z-10 flex items-center justify-center">
            <img
              src="/logo.jpg"
              alt="BestRoom Logo"
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
        </div>

        {/* Text descriptions */}
        <div className="mt-8 text-center">
          <h2 className="text-2xl font-black tracking-wider text-white uppercase drop-shadow-md">
            BestRoom
          </h2>
          <p className="text-[10px] font-bold text-blue-200/80 uppercase tracking-widest font-mono mt-2 flex items-center gap-1.5 justify-center">
            <span>Đang tải dữ liệu</span>
            <span className="flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
