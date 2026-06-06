"use client";

import Header from "./Header";
import Footer from "./Footer";
import AuthModal from "./AuthModal";
import RoomDetailsModal from "./RoomDetailsModal";
import LoadingScreen from "./LoadingScreen";
import { useApp } from "@/context/AppContext";
import { MessageCircle } from "lucide-react";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const {
    loading,
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    setCurrentUser,
  } = useApp();

  const handleLoginClick = () => {
    setAuthModalMode("login");
    setIsAuthModalOpen(true);
  };

  const handleRegisterClick = () => {
    setAuthModalMode("register");
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (user: any) => {
    localStorage.setItem("bestroom_user", JSON.stringify(user));
    setCurrentUser(user);
  };

  return (
    <>
      <LoadingScreen loading={loading} />

      <Header
        onLoginClick={handleLoginClick}
        onRegisterClick={handleRegisterClick}
      />
      
      <main className="flex-1">
        {children}
      </main>

      <Footer />

      <RoomDetailsModal />

      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          initialMode={authModalMode}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      )}

      {/* Floating Zalo Support Button */}
      <a
        href="https://zalo.me/0327142982"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#4781fd] text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105 hover:bg-[#346fe9] group"
        title="Liên hệ hỗ trợ Zalo"
        id="zalo-support-btn"
      >
        <MessageCircle className="h-6 w-6 animate-pulse" />
        
        {/* Hover Tooltip/Label */}
        <span className="absolute right-16 scale-0 group-hover:scale-100 transition-all duration-200 origin-right bg-gray-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-md">
          Hỗ trợ Zalo
        </span>
      </a>
    </>
  );
}
