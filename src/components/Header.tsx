import { Home, Search, ShieldCheck, User, LogOut, Key } from "lucide-react";
import { User as UserType } from "../types";

interface HeaderProps {
  currentTab: "home" | "search" | "admin";
  setCurrentTab: (tab: "home" | "search" | "admin") => void;
  currentUser: UserType | null;
  onLogout: () => void;
  onLoginClick: () => void;
  onRegisterClick: () => void;
}

export default function Header({ 
  currentTab, 
  setCurrentTab, 
  currentUser, 
  onLogout, 
  onLoginClick, 
  onRegisterClick 
}: HeaderProps) {
  return (
    <header id="app-header" className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div 
          id="brand-logo" 
          onClick={() => setCurrentTab("home")} 
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
        >
          <img 
            src="/logo.jpg" 
            alt="BestRoom Logo" 
            className="h-10 w-10 rounded-xl object-cover shadow-md shadow-blue-100 group-hover:scale-105 transition-all duration-300"
          />
          <div className="hidden xs:block">
            <h1 className="text-lg font-bold text-gray-900 tracking-tight leading-none group-hover:text-blue-600 transition-colors">BestRoom</h1>
            <span className="text-xs text-blue-600 font-medium tracking-wide font-mono">HỆ THỐNG PHÒNG TRỌ</span>
          </div>
        </div>

        {/* Tab Selection Navigation */}
        <nav id="main-navigation" className="flex items-center gap-1 sm:gap-4 flex-1 justify-center sm:justify-start sm:pl-8">
          <button
            id="nav-btn-home"
            onClick={() => setCurrentTab("home")}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
              currentTab === "home"
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <Home className="h-4 w-4" />
            <span className="hidden md:inline">Trang Chủ</span>
          </button>

          <button
            id="nav-btn-search"
            onClick={() => setCurrentTab("search")}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
              currentTab === "search"
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <Search className="h-4 w-4" />
            <span>Tìm Kiếm</span>
          </button>

          {currentUser?.role === "admin" && (
            <button
              id="nav-btn-admin"
              onClick={() => setCurrentTab("admin")}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
                currentTab === "admin"
                  ? "bg-amber-50 text-amber-800 border border-amber-200/50"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <ShieldCheck className="h-4 w-4 text-amber-600" />
              <span>Trang Admin</span>
            </button>
          )}
        </nav>

        {/* User Account Session Controls */}
        <div id="user-header-actions" className="flex items-center gap-2 shrink-0">
          {currentUser ? (
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-2xl p-1.5 pr-3 select-none">
              {/* User Avatar Circle */}
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xs font-mono flex items-center justify-center shadow-sm">
                {currentUser.username.substring(0, 2).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <span className="block text-xs font-extrabold text-gray-800 max-w-[80px] truncate leading-none">
                  {currentUser.username}
                </span>
                <span className={`inline-block text-[8px] font-bold uppercase tracking-wider px-1 py-0.5 rounded ${
                  currentUser.role === "admin" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                } mt-0.5`}>
                  {currentUser.role}
                </span>
              </div>
              
              {/* Logout action */}
              <button
                onClick={onLogout}
                className="ml-1 text-gray-400 hover:text-red-500 p-1 rounded-lg hover:bg-gray-200/60 transition-colors cursor-pointer"
                title="Đăng xuất khỏi tài khoản"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={onLoginClick}
                className="hidden xs:inline-flex items-center justify-center px-3.5 py-2 hover:bg-gray-50 text-gray-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Đăng Nhập
              </button>
              <button
                onClick={onRegisterClick}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-3.5 rounded-xl transition-all shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 cursor-pointer flex items-center gap-1"
              >
                <User className="h-3.5 w-3.5 shrink-0" />
                <span>Đăng Ký</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

