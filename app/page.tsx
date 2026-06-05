"use client";

import React from "react";
import { Search, Sparkles, ChevronRight, ArrowRight, AlertCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import RoomCard from "@/components/RoomCard";

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

  // Section A: Newly posted rooms (sorted by date descending)
  const newlyPostedRooms = [...rooms]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  // Section B: Highly interested rooms (sorted by interestedCount descending)
  const premiumInterestedRooms = [...rooms]
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
      <section className="relative bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 text-white py-16 px-4 overflow-hidden shadow-md">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          <span className="bg-blue-500/20 text-blue-300 text-xs font-semibold py-1.5 px-3 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 border border-blue-400/20 mx-auto select-none">
            <Sparkles className="h-3.5 w-3.5" />
            Tìm Phòng Trọ Giá Tốt - An Ninh Nhất 2026
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

      {/* PRICE BUCKETS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center md:text-left mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Khoảng Giá Trọ Cho Thuê Phổ Biến</h2>
          <p className="text-sm text-gray-500">Bấm lựa chọn phân khúc giá để tìm kiếm bộ lọc trọ ưng ý nhất</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: "Giá siêu rẻ", val: "under-2m", desc: "Dưới 2 triệu", col: "from-teal-50 to-teal-100 text-teal-900 border-teal-200" },
            { label: "Sinh viên", val: "2m-4m", desc: "Từ 2M - 4 triệu", col: "from-blue-50 to-blue-100 text-blue-900 border-blue-200" },
            { label: "Người đi làm", val: "4m-7m", desc: "Từ 4M - 7 triệu", col: "from-indigo-50 to-indigo-100 text-indigo-900 border-indigo-200" },
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
