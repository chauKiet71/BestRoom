"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LogOut, Menu, Plus, User, X } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { userService } from "@/services/userService";

interface HeaderProps {
  onLoginClick: () => void;
  onRegisterClick: () => void;
}

const navItems = [
  { href: "/", label: "Trang chủ" },
  { href: "/search", label: "Tìm phòng" },
  { href: "/admin", label: "Đăng tin" },
  // { href: "#pricing", label: "Bảng giá" },
  { href: "/favorites", label: "Yêu thích" },
];

export default function Header({ onLoginClick, onRegisterClick }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, setCurrentUser, logout, resetFilters } = useApp();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRequestingPostPermission, setIsRequestingPostPermission] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const canPost = currentUser?.role === "admin" || currentUser?.postPermissionStatus === "approved";
  const postButtonLabel = canPost ? "Đăng tin" : "Đăng tin miễn phí";

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!currentUser?.id) return;

    let cancelled = false;
    const syncCurrentUser = async () => {
      try {
        const freshUser = await userService.getUser(currentUser.id);
        if (cancelled) return;
        if (
          freshUser.postPermissionStatus !== currentUser.postPermissionStatus ||
          freshUser.role !== currentUser.role
        ) {
          const updatedUser = { ...currentUser, ...freshUser };
          setCurrentUser(updatedUser);
          localStorage.setItem("bestroom_user", JSON.stringify(updatedUser));
        }
      } catch (err) {
        console.error("Không thể đồng bộ trạng thái tài khoản", err);
      }
    };

    window.addEventListener("focus", syncCurrentUser);
    const intervalId = currentUser.postPermissionStatus === "pending"
      ? window.setInterval(syncCurrentUser, 10000)
      : null;

    return () => {
      cancelled = true;
      window.removeEventListener("focus", syncCurrentUser);
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [currentUser?.id, currentUser?.postPermissionStatus, currentUser?.role, setCurrentUser]);

  const goHome = () => {
    resetFilters();
    router.push("/");
  };

  const postRoom = async () => {
    if (!currentUser) {
      onRegisterClick();
      return;
    }

    if (currentUser.role === "admin" || currentUser.postPermissionStatus === "approved") {
      router.push(`/user/${currentUser.username}?edit&tab=listing`);
      return;
    }

    if (currentUser.postPermissionStatus === "pending") {
      alert("Yêu cầu đăng tin của bạn đang chờ admin duyệt.");
      return;
    }

    try {
      setIsRequestingPostPermission(true);
      const data = await userService.updatePostPermission(currentUser.id, "request", currentUser.role, currentUser.id);
      if (data.success) {
        const updatedUser = { ...currentUser, ...data.user };
        setCurrentUser(updatedUser);
        localStorage.setItem("bestroom_user", JSON.stringify(updatedUser));
        alert("Đã gửi yêu cầu đăng tin đến admin. Sau khi được duyệt, nút này sẽ chuyển thành Đăng tin.");
      }
    } catch (err: any) {
      alert(err.message || "Không thể gửi yêu cầu đăng tin lúc này.");
    } finally {
      setIsRequestingPostPermission(false);
    }
  };

  return (
    <header id="app-header" className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[60px] max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <button onClick={goHome} className="group flex items-center gap-2 border-none bg-transparent p-0">
          <img
            src="/bestroom-logo.png"
            alt="BestRoom"
            className="h-11 w-auto object-contain transition duration-200 group-hover:scale-[1.02]"
          />
        </button>

        <nav className="hidden items-center gap-7 lg:flex">
          {navItems.map((item) => {
            const active = pathname === item.href;
            if (item.href === "/admin") {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={postRoom}
                  className={`border-b-2 bg-transparent px-1 py-5 text-sm font-extrabold transition ${
                    active ? "border-blue-700 text-blue-700" : "border-transparent text-slate-800 hover:text-blue-700"
                  }`}
                >
                  {item.label}
                </button>
              );
            }
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`border-b-2 px-1 py-5 text-sm font-extrabold transition ${
                  active ? "border-blue-700 text-blue-700" : "border-transparent text-slate-800 hover:text-blue-700"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-3 md:flex">
            {currentUser ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen((open) => !open)}
                  className="flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-extrabold text-slate-800 hover:border-blue-300"
                >
                  <User className="h-5 w-5" />
                  {currentUser.username}
                  <ChevronDown className={`h-4 w-4 transition ${isDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white py-2 shadow-xl">
                    <Link href={`/user/${currentUser.username}?edit`} className="block px-4 py-2 text-sm font-bold text-slate-700 hover:bg-blue-50">Thông tin của tôi</Link>                    {currentUser.role === "admin" ? (
                      <Link href="/admin" className="block px-4 py-2 text-sm font-bold text-slate-700 hover:bg-blue-50">Quản lý tin đăng</Link>
                    ) : (
                      <Link href={`/user/${currentUser.username}?edit&tab=listing`} className="block px-4 py-2 text-sm font-bold text-slate-700 hover:bg-blue-50">Đăng tin phòng trọ</Link>
                    )}
                    <button onClick={logout} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-bold text-red-600 hover:bg-red-50">
                      <LogOut className="h-4 w-4" /> Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={onLoginClick} className="flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-extrabold text-slate-800 hover:border-blue-300">
                <User className="h-5 w-5" />
                Đăng nhập
              </button>
            )}
            <button onClick={postRoom} disabled={isRequestingPostPermission} className="flex h-9 items-center gap-2 rounded-md bg-[#ffc400] px-4 text-sm font-black text-slate-950 shadow hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-70">
              {isRequestingPostPermission ? "Đang gửi..." : postButtonLabel}
              <Plus className="h-5 w-5" />
            </button>
          </div>

          <button onClick={() => setIsMobileMenuOpen(true)} className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white lg:hidden" aria-label="Mở menu">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {isMobileMenuOpen && mounted && createPortal(
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-slate-950/50" onClick={() => setIsMobileMenuOpen(false)} aria-label="Đóng menu" />
          <div className="absolute bottom-0 right-0 top-0 flex w-80 max-w-[86vw] flex-col bg-white p-5 shadow-2xl">
            <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
              <img src="/bestroom-logo.png" alt="BestRoom" className="h-10 w-auto object-contain" />
              <button onClick={() => setIsMobileMenuOpen(false)} className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {navItems.map((item) => {
                if (item.href === "/admin") {
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        postRoom();
                      }}
                      className={`rounded-lg px-3 py-3 text-left text-sm font-extrabold ${pathname === item.href ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"}`}
                    >
                      {item.label}
                    </button>
                  );
                }
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`rounded-lg px-3 py-3 text-sm font-extrabold ${pathname === item.href ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"}`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <div className="mt-auto grid gap-3 border-t border-slate-100 pt-5">
              {currentUser && (
                <>
                  <Link
                    href={`/user/${currentUser.username}?edit`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex h-11 items-center justify-center rounded-lg border border-slate-300 text-sm font-black text-slate-800"
                  >
                    Thông tin của tôi
                  </Link>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      logout();
                    }}
                    className="flex h-11 items-center justify-center gap-2 rounded-lg border border-red-200 text-sm font-black text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" /> Đăng xuất
                  </button>
                </>
              )}
              {!currentUser && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onLoginClick();
                  }}
                  className="h-11 rounded-lg border border-slate-300 text-sm font-black text-slate-800"
                >
                  Đăng nhập
                </button>
              )}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  postRoom();
                }}
                disabled={isRequestingPostPermission}
                className="h-11 rounded-lg bg-[#ffc400] text-sm font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isRequestingPostPermission ? "Đang gửi..." : postButtonLabel}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
