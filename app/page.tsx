"use client";

import React, { useState, useEffect } from "react";
import { Search, Sparkles, ChevronRight, ChevronLeft, ArrowRight, AlertCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import RoomCard from "@/components/RoomCard";

const FALLBACK_BROKERS = [
  { name: "BĐS Minh Anh150", count: 6, avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&h=120&q=80", active: true },
  { name: "Hảo Nhà Trọ Sạch Sẽ", count: 5, avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80", active: false },
  { name: "Ân Nhà Trọ Sạch Sẽ", count: 5, avatar: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=120&h=120&q=80", active: false },
  { name: "Nam Khánh Land", count: 4, avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=120&h=120&q=80", active: true },
  { name: "Vy Villa & Room", count: 4, avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&h=120&q=80", active: false },
  { name: "Phòng Trọ Xanh", count: 3, avatar: "https://images.unsplash.com/photo-1463936575829-25148e1db1b8?auto=format&fit=crop&w=120&h=120&q=80", active: false },
  { name: "BĐS Thuận Phát", count: 3, avatar: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=120&h=120&q=80", active: true },
  { name: "Nhà Đẹp Sài Gòn", count: 3, avatar: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=120&h=120&q=80", active: false },
  { name: "Minh Trí Homes", count: 2, avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=120&h=120&q=80", active: false }
];

const FALLBACK_AVATARS = [
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&h=120&q=80",
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80",
  "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=120&h=120&q=80",
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=120&h=120&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&h=120&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&h=120&q=80",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=120&h=120&q=80",
  "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=120&h=120&q=80",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=120&h=120&q=80"
];

export default function HomePage() {
  const router = useRouter();
  const {
    rooms,
    loading,
    error,
    setError,
    filters,
    setFilters,
    viewRoomDetails,
    resetFilters,
  } = useApp();

  const [activeBrokerPage, setActiveBrokerPage] = useState(0);
  const [brokers, setBrokers] = useState<any[]>([]);

  useEffect(() => {
    async function fetchTopBrokers() {
      try {
        const res = await fetch("/api/users/top");
        if (res.ok) {
          const data = await res.json();
          setBrokers(data);
        }
      } catch (err) {
        console.error("Error fetching top brokers:", err);
      }
    }
    fetchTopBrokers();
  }, []);

  const processedBrokers = brokers.map((b, idx) => ({
    name: b.fullname && b.fullname.trim() !== "" ? b.fullname : b.username,
    count: b.room_count,
    avatar: b.avatar && b.avatar.trim() !== "" ? b.avatar : FALLBACK_AVATARS[idx % FALLBACK_AVATARS.length],
    active: idx < 3
  }));

  let finalBrokers = [...processedBrokers];
  if (finalBrokers.length < 9) {
    const needed = 9 - finalBrokers.length;
    finalBrokers = [...finalBrokers, ...FALLBACK_BROKERS.slice(FALLBACK_BROKERS.length - needed)];
  }

  const brokerPages: any[][] = [];
  for (let i = 0; i < finalBrokers.length; i += 3) {
    brokerPages.push(finalBrokers.slice(i, i + 3));
  }

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/search");
  };

  const handleSelectPriceRange = (rangeValue: string) => {
    setFilters((prev) => ({
      ...prev,
      priceRange: rangeValue,
    }));
    router.push("/search");
  };

  const handleSelectCity = (cityName: string) => {
    setFilters((prev) => ({
      ...prev,
      city: cityName,
      district: "",
      ward: "",
      street: "",
    }));
    router.push("/search");
  };

  const approvedRooms = rooms.filter((room) => room.approvalStatus === "approved");

  const hcmcCount = approvedRooms.filter(r => r.city.toLowerCase().includes("hồ chí minh")).length;
  const hnCount = approvedRooms.filter(r => r.city.toLowerCase().includes("hà nội")).length;
  const ctCount = approvedRooms.filter(r => r.city.toLowerCase().includes("cần thơ")).length;

  // Section A: Newly posted rooms (sorted by date descending)
  const newlyPostedRooms = [...approvedRooms]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  // Section B: Highly interested rooms (sorted by interestedCount descending)
  const premiumInterestedRooms = [...approvedRooms]
    .sort((a, b) => (b.interestedCount || 0) - (a.interestedCount || 0))
    .slice(0, 4);


  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center h-16 w-16 mb-4">
          <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-20"></div>
          <div className="rounded-full h-10 w-10 bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md">Trọ</div>
        </div>
        <p className="text-gray-500 font-medium animate-pulse text-sm">Đang tải cơ sở dữ liệu phòng trọ uy tín...</p>
      </div>
    );
  }

  return (
    <div id="home-view-container" className="animate-fade-in">
      {/* ERROR BANNER DISPLAY */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 mt-6 w-full">
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-2xl flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <div className="text-sm">
              <span className="font-bold">Lỗi kết nối hệ thống:</span> {error}
            </div>
            <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700 bg-transparent border-none cursor-pointer">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* HERO BANNER SECTION */}
      <section className="relative bg-[url('/hero-bg.png')] bg-cover bg-center bg-no-repeat text-white py-24 px-4 overflow-hidden shadow-md">
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-slate-950/35 z-0"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent z-0"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          <span className="bg-blue-500/20 text-blue-300 text-xs font-semibold py-1.5 px-3 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 border border-blue-400/20 mx-auto select-none">
            <Sparkles className="h-3.5 w-3.5" />
            Tìm Phòng Trọ Giá Tốt
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
            Nền Tảng Tìm Kiếm Phòng Trọ <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-300">
              Chi Tiết Quốc Dân
            </span>
          </h2>
          <p className="text-sm md:text-base text-blue-100 max-w-2xl mx-auto leading-relaxed">
            Lọc chi tiết hàng chục tiện nghi: chung chủ, wifi, nước miễn phí, thâm niên phòng, thang máy, hợp đồng cam kết chặt chẽ và không mất thêm phí trung gian nào.
          </p>

          {/* Integrated Quick Name Search Field */}
          <form onSubmit={handleHeroSearch} className="max-w-xl mx-auto pt-4">
            <div className="bg-white p-2 rounded-2xl shadow-xl flex items-center gap-1 border border-gray-100">
              <div className="flex items-center gap-2 px-3 grow text-gray-700">
                <Search className="h-5 w-5 text-gray-400 shrink-0" />
                <input
                  id="home-hero-search-input"
                  type="text"
                  placeholder="Nhập tên phòng, tên đường hoặc từ khoá cần tìm..."
                  value={filters.searchQuery}
                  onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
                  className="w-full text-sm outline-none border-none py-2 text-gray-800 placeholder-gray-400"
                />
              </div>
              <button
                id="home-hero-search-btn"
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-3 rounded-xl transition-all duration-150 shadow-md flex items-center gap-2 cursor-pointer shrink-0 border-none animate-pulse hover:animate-none"
              >
                <span>Tìm ngay</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* CITIES & BROKERS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Cities */}
          <div className="lg:col-span-2 flex flex-col justify-between">
            <div className="mb-4">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 pb-2 border-b border-gray-100">
                Phòng trọ theo khu vực
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 grow">
              {/* TP. HCM Card */}
              <div 
                onClick={() => handleSelectCity("Hồ Chí Minh")}
                className="sm:col-span-2 relative h-72 sm:h-auto min-h-[300px] rounded-2xl overflow-hidden cursor-pointer group shadow-sm border border-gray-100 flex flex-col justify-end"
              >
                <img 
                  src="https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=800&q=80" 
                  alt="Tp Hồ Chí Minh"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-103 transition-transform duration-500 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"></div>
                <div className="relative z-10 p-6 text-white mt-auto">
                  <h3 className="text-lg md:text-xl font-bold">Tp Hồ Chí Minh</h3>
                  <p className="text-xs text-gray-200 mt-1 opacity-90">{(hcmcCount || 0) + 4200} tin đăng</p>
                </div>
              </div>

              {/* Stacked Hà Nội & Cần Thơ */}
              <div className="grid grid-cols-1 gap-4 sm:col-span-1">
                {/* Hà Nội Card */}
                <div 
                  onClick={() => handleSelectCity("Hà Nội")}
                  className="relative h-[142px] sm:h-auto rounded-2xl overflow-hidden cursor-pointer group shadow-sm border border-gray-100 flex flex-col justify-end"
                >
                  <img 
                    src="https://images.unsplash.com/photo-1509060464153-44667396260f?auto=format&fit=crop&w=800&q=80" 
                    alt="Hà Nội"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-103 transition-transform duration-500 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"></div>
                  <div className="relative z-10 p-4 text-white mt-auto">
                    <h3 className="text-base font-bold">Hà Nội</h3>
                    <p className="text-[11px] text-gray-200 mt-0.5 opacity-90">{(hnCount || 0) + 1300} tin đăng</p>
                  </div>
                </div>

                {/* Cần Thơ Card */}
                <div 
                  onClick={() => handleSelectCity("Cần Thơ")}
                  className="relative h-[142px] sm:h-auto rounded-2xl overflow-hidden cursor-pointer group shadow-sm border border-gray-100 flex flex-col justify-end"
                >
                  <img 
                    src="https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80" 
                    alt="Cần Thơ"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-103 transition-transform duration-500 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"></div>
                  <div className="relative z-10 p-4 text-white mt-auto">
                    <h3 className="text-base font-bold">Cần Thơ</h3>
                    <p className="text-[11px] text-gray-200 mt-0.5 opacity-90">{(ctCount || 0) + 70} tin đăng</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Broker Card */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-full min-h-[360px]">
              <div>
                <h3 className="flex items-center justify-center gap-1.5 text-center font-bold text-gray-800 text-[17px] tracking-tight leading-snug">
                  <span>🥇</span>
                  <span>Top môi giới hoạt động tại Tp Hồ Chí Minh</span>
                  <span>🥇</span>
                </h3>
                <p className="text-center text-gray-500 text-xs mt-2 font-medium leading-relaxed">
                  Kết nối với môi giới có tin đăng phù hợp với bạn
                </p>

                <div className="space-y-4 mt-6">
                  {brokerPages[activeBrokerPage] && brokerPages[activeBrokerPage].map((broker, idx) => (
                    <div key={idx} className="flex items-center gap-3.5 p-1 rounded-2xl transition-all duration-200">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-sm border border-gray-100">
                        <img 
                          src={broker.avatar} 
                          alt={broker.name} 
                          className="w-full h-full object-cover"
                        />
                        {broker.active && (
                          <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-800 text-sm hover:text-blue-600 transition-colors cursor-pointer">
                          {broker.name}
                        </span>
                        <span className="text-xs text-gray-500 font-medium mt-0.5">
                          {broker.count} tin đăng phù hợp
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-50">
                <button 
                  type="button"
                  onClick={() => setActiveBrokerPage((prev) => (prev > 0 ? prev - 1 : (brokerPages.length > 0 ? brokerPages.length - 1 : 0)))}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all cursor-pointer border-none bg-transparent"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <div className="flex items-center gap-2">
                  {brokerPages.map((_, index) => (
                    <span 
                      key={index}
                      onClick={() => setActiveBrokerPage(index)}
                      className={`h-1.5 w-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                        activeBrokerPage === index ? "bg-amber-700 scale-125" : "bg-gray-200 hover:bg-gray-300"
                      }`}
                    />
                  ))}
                </div>

                <button 
                  type="button"
                  onClick={() => setActiveBrokerPage((prev) => (prev < brokerPages.length - 1 ? prev + 1 : 0))}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all cursor-pointer border-none bg-transparent"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICE BUCKETS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center md:text-left mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Khoảng Giá Trọ Cho Thuê Phổ Biến</h2>
          <p className="text-sm text-gray-500">Bấm lựa chọn phân khúc giá để tìm kiếm bộ lọc trọ ưng ý nhất</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: "Giá siêu rẻ", val: "under-2m", desc: "Dưới 2 triệu", col: "from-teal-50 to-teal-100 text-teal-900 border-teal-200" },
            { label: "Sinh viên", val: "2m-4m", desc: "Từ 2 - 4 triệu", col: "from-blue-50 to-blue-100 text-blue-900 border-blue-200" },
            { label: "Người đi làm", val: "4m-7m", desc: "Từ 4 - 7 triệu", col: "from-indigo-50 to-indigo-100 text-indigo-900 border-indigo-200" },
            { label: "Cao cấp / Studio", val: "above-7m", desc: "Trên 7 triệu", col: "from-purple-50 to-purple-100 text-purple-900 border-purple-200" },
            { label: "Tất cả tầm giá", val: "all", desc: "Lọc tất cả", col: "from-gray-50 to-gray-100 text-gray-900 border-gray-200" }
          ].map((bucket) => (
            <div
              key={bucket.val}
              onClick={() => handleSelectPriceRange(bucket.val)}
              className={`p-5 rounded-2xl border bg-gradient-to-br ${bucket.col} hover:scale-103 transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-xs select-none`}
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 block">{bucket.label}</span>
                <span className="text-[16px] font-extrabold mt-1.5 block">{bucket.desc}</span>
              </div>
              <span className="text-xs font-semibold flex items-center justify-end gap-1 mt-4 opacity-80">
                Xem phòng trọ
                <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* PREMIUM INTERESTED ROOMS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-2">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest font-mono">Bảng Xếp Hạng</span>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-1.5">
              Trọ Được Quan Tâm Nhiều Nhất
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">Hot</span>
            </h2>
          </div>
          <button
            id="view-all-interested-btn"
            onClick={() => {
              resetFilters();
              router.push("/search");
            }}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-all flex items-center gap-1 self-start sm:self-center cursor-pointer bg-transparent border-none"
          >
            <span>Xem toàn bộ phòng trọ</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {premiumInterestedRooms.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {premiumInterestedRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onViewDetails={viewRoomDetails}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white py-12 text-center rounded-2xl border border-gray-100">
            <p className="text-gray-400 text-sm">Chưa có phòng trọ được cập nhật lượt quan tâm.</p>
          </div>
        )}
      </section>

      {/* NEWLY POSTED ROOMS SECTION */}
      <section className="bg-white py-14 border-t border-gray-100 shadow-inner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-2">
            <div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest font-mono">Cập nhật thời gian thực</span>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Trọ Mới Đăng Gần Đây</h2>
            </div>
            <button
              id="view-all-new-btn"
              onClick={() => {
                resetFilters();
                router.push("/search");
              }}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-all flex items-center gap-1 self-start sm:self-center cursor-pointer bg-transparent border-none"
            >
              Lọc theo tất cả phòng &rarr;
            </button>
          </div>

          {newlyPostedRooms.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {newlyPostedRooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onViewDetails={viewRoomDetails}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-400 text-sm">
              Chưa có phòng trọ mới đăng nào.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
