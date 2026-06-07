import type { Metadata } from "next";
import { AppContextProvider } from "@/context/AppContext";
import LayoutWrapper from "@/components/LayoutWrapper";
import "./globals.css";
import Script from "next/script";

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
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "x2wfyt2u5x");
          `}
        </Script>
        <AppContextProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </AppContextProvider>
      </body>
    </html>
  );
}

