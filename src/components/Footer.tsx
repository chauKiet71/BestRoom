import React from "react";
import { Home, Phone, Mail, MapPin, Heart, ShieldCheck, HelpCircle } from "lucide-react";

interface FooterProps {
  setCurrentTab: (tab: "home" | "search" | "admin") => void;
  onPriceSelect: (rangeValue: string) => void;
}

export default function Footer({ setCurrentTab, onPriceSelect }: FooterProps) {
  return (
    <footer id="app-footer" className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-auto pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        {/* Brand visual summary */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => setCurrentTab("home")}>
            <img 
              src="/logo.jpg" 
              alt="BestRoom Logo" 
              className="h-9 w-9 rounded-xl object-cover shadow-md shadow-blue-500/10 group-hover:scale-105 transition-all duration-300"
            />
            <div>
              <h3 className="text-base font-bold text-white tracking-tight leading-none group-hover:text-blue-400 transition-colors">BestRoom</h3>
              <span className="text-[10px] text-blue-400 font-semibold tracking-wider font-mono">BẢO ĐẢM AN TOÀN TRỌ</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Hệ thống tìm kiếm thông tin phòng trọ chuyên nghiệp, chi tiết bậc nhất từ dải giá rẻ sinh viên tới căn hộ studio chung cư mini cao cấp đầy đủ tiện ích tối tân.
          </p>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
            <span>© {new Date().getFullYear()} BestRoom Corp.</span>
          </div>
        </div>

        {/* Quick Price Links Segment */}
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4 font-mono pb-2 border-b border-slate-850">Phân Phân Khúc Giá</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button 
                onClick={() => onPriceSelect("under-2m")} 
                className="hover:text-blue-400 transition-colors cursor-pointer text-left py-0.5 block"
              >
                Phòng trọ giá siêu rẻ (Dưới 2 triệu)
              </button>
            </li>
            <li>
              <button 
                onClick={() => onPriceSelect("2m-4m")} 
                className="hover:text-blue-400 transition-colors cursor-pointer text-left py-0.5 block"
              >
                Phòng trọ sinh viên tiện nghi (2M - 4 triệu)
              </button>
            </li>
            <li>
              <button 
                onClick={() => onPriceSelect("4m-7m")} 
                className="hover:text-blue-400 transition-colors cursor-pointer text-left py-0.5 block"
              >
                Chung cư mini cao cấp (4M - 7 triệu)
              </button>
            </li>
            <li>
              <button 
                onClick={() => onPriceSelect("above-7m")} 
                className="hover:text-blue-400 transition-colors cursor-pointer text-left py-0.5 block"
              >
                Premium Studio / Penthouse (Trên 7 triệu)
              </button>
            </li>
          </ul>
        </div>

        {/* Cities Location Links */}
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4 font-mono pb-2 border-b border-slate-850">Khu Vực Phổ Biến</h4>
          <ul className="space-y-2 text-xs text-slate-400">
            <li className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-blue-500 shrink-0" />
              <span>Thành phố Hồ Chí Minh</span>
            </li>
            <li className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-blue-500 shrink-0" />
              <span>Thành phố Hà Nội</span>
            </li>
            <li className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-blue-500 shrink-0" />
              <span>Thành phố Đà Nẵng</span>
            </li>
            <li className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span className="text-slate-300 font-semibold cursor-pointer hover:text-blue-400" onClick={() => setCurrentTab("admin")}>
                Quản lý hệ thống đăng phòng
              </span>
            </li>
          </ul>
        </div>

        {/* Contact Hotline & Support info */}
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4 font-mono pb-2 border-b border-slate-850">Hỗ Trợ & Liên Hệ</h4>
          <div className="space-y-3.5 text-xs">
            <div className="flex items-start gap-2.5">
              <Phone className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <span className="block text-slate-500 text-[10px] uppercase font-mono">Tổng đài 24/7 (CSKH)</span>
                <a href="tel:0327142982" className="text-slate-100 font-extrabold hover:text-blue-400">032 714 2982 (Miễn phí)</a>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Mail className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <span className="block text-slate-500 text-[10px] uppercase font-mono">Email hỗ trợ đối tác</span>
                <a href="mailto:bestroom2222@gmail.com" className="text-slate-200 font-semibold hover:text-blue-400">bestroom2222@gmail.com</a>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <HelpCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Hệ thống tuân thủ nghiêm ngặt quy định hợp đồng, chống cò đất và đảm bảo minh bạch thông tin 100%.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Underline bottom status */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-slate-500 text-[11px]">
        <div>
          <span>BestRoom - Giải pháp kết nối chỗ ở sinh viên và người lao động toàn quốc hàng đầu Việt Nam.</span>
        </div>
      </div>
    </footer>
  );
}
