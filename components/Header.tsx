"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Search, ShieldCheck, User, LogIn, LogOut, ChevronDown, Menu, X } from "lucide-react";
import { useApp } from "@/context/AppContext";

interface HeaderProps {
  onLoginClick: () => void;
  onRegisterClick: () => void;
}

export default function Header({
  onLoginClick,
  onRegisterClick
}: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout, resetFilters } = useApp();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogoClick = () => {
    resetFilters();
    router.push("/");
  };

  return (
    <header id="app-header" className="sticky top-0 z-45 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div
          id="brand-logo"
          onClick={handleLogoClick}
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
        >
          <img
            src="/logo.jpg"
            alt="BestRoom Logo"
            className="h-10 w-10 rounded-xl object-cover shadow-blue-100 group-hover:scale-105 transition-all duration-300"
          />
          <div className="hidden xs:block">
            <h1 className="text-lg font-bold text-gray-900 tracking-tight leading-none group-hover:text-blue-600 transition-colors">BestRoom</h1>
            <span className="text-xs text-blue-600 font-medium tracking-wide font-mono">HỆ THỐNG PHÒNG TRỌ</span>
          </div>
        </div>



        {/* User Account Session Controls & Hamburger Menu Toggle */}
        <div id="user-header-actions" className="flex items-center gap-2 shrink-0">
          {/* Desktop view (md and larger screens) */}
          <div className="hidden md:flex items-center gap-2">
            {currentUser ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2.5 bg-gray-50 hover:bg-gray-100/80 border border-gray-100 rounded-2xl p-1.5 pl-1.5 pr-3 select-none cursor-pointer transition-all duration-200 text-left"
                >
                  {/* User Avatar Circle */}
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.username}
                      className="h-8 w-8 rounded-xl object-cover shadow-sm shrink-0 border border-gray-105"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xs font-mono flex items-center justify-center shadow-sm shrink-0">
                      {currentUser.username.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="hidden sm:block text-left">
                    <span className="block text-xs font-extrabold text-gray-800 max-w-[80px] truncate leading-none">
                      {currentUser.username}
                    </span>
                    <span className={`inline-block text-[8px] font-bold uppercase tracking-wider px-1 py-0.5 rounded ${currentUser.role === "admin" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                      } mt-0.5`}>
                      {currentUser.role}
                    </span>
                  </div>
                  <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50 transition-all">
                    <Link
                      href={`/user/${currentUser.username}`}
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-gray-750 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      <User className="h-4 w-4 text-blue-600" />
                      <span>Thông tin của tôi</span>
                    </Link>
                    <Link
                      href="/admin"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-gray-750 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      <ShieldCheck className="h-4 w-4 text-blue-600" />
                      <span>{currentUser.role === "admin" ? "Trang Admin" : "Đăng & Quản Lý Phòng"}</span>
                    </Link>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer bg-transparent border-none text-left"
                    >
                      <LogOut className="h-4 w-4 text-red-500" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onLoginClick}
                  className="inline-flex items-center justify-center px-4 py-2 hover:bg-gray-50 text-gray-700 rounded-xl font-bold text-xs transition-colors cursor-pointer bg-transparent border-none"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={onRegisterClick}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-4 rounded-xl transition-all shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 cursor-pointer flex items-center gap-1 border-none"
                >
                  <span>Đăng ký</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile view (hamburger toggle icon, hidden on md+) */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden flex items-center justify-center p-2 rounded-xl text-gray-650 hover:bg-gray-100 transition-colors cursor-pointer bg-transparent border-none"
            aria-label="Toggle Menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer Slide-In Menu (sliding from right) */}
      {isMobileMenuOpen && mounted && createPortal(
        <div className="md:hidden fixed inset-0 z-50">
          {/* Backdrop Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>

          {/* Drawer container */}
          <div className="absolute top-0 right-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col p-6 animate-slide-in-from-right z-50">
            {/* Header: Logo and Close button */}
            <div className="flex items-center justify-between pb-5 border-b border-gray-100 mb-6">
              <div className="flex items-center gap-2">
                <img
                  src="/logo.jpg"
                  alt="BestRoom Logo"
                  className="h-8 w-8 rounded-lg object-cover"
                />
                <span className="font-bold text-gray-900 text-sm">BestRoom</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-gray-400 hover:text-gray-650 p-1 bg-transparent border-none cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Navigation links */}
            <div className="mb-8">
              <div className="flex flex-col gap-2">
                <Link
                  href="/"
                  onClick={() => {
                    resetFilters();
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${pathname === "/"
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50"
                    }`}
                >
                  <Home className="h-4 w-4" />
                  <span>Trang Chủ</span>
                </Link>
                <Link
                  href="/search"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${pathname === "/search"
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50"
                    }`}
                >
                  <Search className="h-4 w-4" />
                  <span>Tìm Kiếm</span>
                </Link>
              </div>
            </div>

            {/* Session actions */}
            <div className="mt-auto space-y-4 pt-6 border-t border-gray-100">
              {currentUser ? (
                <div className="space-y-4">
                  {/* User Profile Card inside Drawer */}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    {currentUser.avatar ? (
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.username}
                        className="h-10 w-10 rounded-xl object-cover border border-gray-150"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-sm font-mono flex items-center justify-center shadow-sm shrink-0">
                        {currentUser.username.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="text-left">
                      <span className="block text-xs font-extrabold text-gray-800 truncate leading-none">
                        {currentUser.username}
                      </span>
                      <span className={`inline-block text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${currentUser.role === "admin" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                        } mt-1.5`}>
                        {currentUser.role}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Link
                      href={`/user/${currentUser.username}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-gray-750 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-all"
                    >
                      <User className="h-4 w-4 text-blue-650" />
                      <span>Thông tin của tôi</span>
                    </Link>
                    <Link
                      href="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-gray-750 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-all"
                    >
                      <ShieldCheck className="h-4 w-4 text-blue-650" />
                      <span>{currentUser.role === "admin" ? "Trang Admin" : "Đăng & Quản Lý Phòng"}</span>
                    </Link>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-all cursor-pointer bg-transparent border-none text-left"
                    >
                      <LogOut className="h-4 w-4 text-red-500" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onLoginClick();
                    }}
                    className="w-full py-3 hover:bg-gray-50 text-gray-750 border border-gray-200 rounded-xl font-bold text-xs transition-colors cursor-pointer bg-transparent"
                  >
                    Đăng nhập
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onRegisterClick();
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md cursor-pointer border-none flex items-center justify-center gap-1.5"
                  >
                    <span>Đăng ký</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
