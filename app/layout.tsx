import type { Metadata } from "next";
import { AppContextProvider } from "@/context/AppContext";
import LayoutWrapper from "@/components/LayoutWrapper";
import "./globals.css";

export const metadata: Metadata = {
  title: "BestRoom - Hệ Thống Tìm Kiếm Phòng Trọ Giá Tốt",
  description: "Lọc chi tiết hàng chục tiện nghi: chung chủ, wifi, nước miễn phí, thâm niên phòng, thang máy, hợp đồng cam kết chặt chẽ và không mất thêm phí trung gian.",
  icons: {
    icon: "/logo.jpg",
    apple: "/logo.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="font-sans antialiased min-h-screen bg-gray-50/50 text-gray-800 flex flex-col">
        <AppContextProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </AppContextProvider>
      </body>
    </html>
  );
}
