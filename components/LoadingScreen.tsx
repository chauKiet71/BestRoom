"use client";

import React, { useEffect, useState } from "react";
import PageLoader from "./PageLoader";

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
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white transition-opacity duration-500 ease-out select-none ${
        fadeActive ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <PageLoader text="Đang tải dữ liệu..." />
    </div>
  );
}
