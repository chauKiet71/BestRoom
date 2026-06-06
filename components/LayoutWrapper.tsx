"use client";

import Header from "./Header";
import Footer from "./Footer";
import AuthModal from "./AuthModal";
import RoomDetailsModal from "./RoomDetailsModal";
import LoadingScreen from "./LoadingScreen";
import { useApp } from "@/context/AppContext";

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
    </>
  );
}
