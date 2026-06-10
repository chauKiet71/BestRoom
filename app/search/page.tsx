"use client";

import React, { useState, useEffect } from "react";
import { Filter, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useApp } from "@/context/AppContext";
import FiltersSidebar from "@/components/FiltersSidebar";
import RoomCard from "@/components/RoomCard";
import { roomService } from "@/services/roomService";
import { BoardingRoom } from "@/types";

const cleanName = (name: string): string => {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/^(thành phố|tỉnh|quận|huyện|phường|xã|đường|thành phố hồ chí minh|tp\.? hcm|tp\.? hồ chí minh)\s+/g, "")
    .replace(/\s+/g, "")
    .trim();
};

const matchLocation = (a: string, b: string): boolean => {
  if (!a || !b) return true;
  const cleanA = cleanName(a);
  const cleanB = cleanName(b);
  return cleanA.includes(cleanB) || cleanB.includes(cleanA);
};

export default function SearchPage() {
  const {
    filters,
    setFilters,
    viewRoomDetails,
    resetFilters,
    currentUser,
  } = useApp();

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;

  const [searchResults, setSearchResults] = useState<BoardingRoom[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchLoading, setSearchLoading] = useState(true);

  // Reset page to 1 when any filters are changed
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  useEffect(() => {
    let active = true;
    const fetchRooms = async () => {
      try {
        setSearchLoading(true);
        const res = await roomService.getRooms(currentUser?.role, currentUser?.id, {
          paginated: true,
          page: currentPage,
          limit: ITEMS_PER_PAGE,
          filters
        });
        if (active) {
          setSearchResults(res.rooms || []);
          setTotalCount(res.totalCount || 0);
          setTotalPages(res.totalPages || 0);
        }
      } catch (err) {
        console.error("Lỗi khi tìm kiếm phòng từ server:", err);
      } finally {
        if (active) {
          setSearchLoading(false);
        }
      }
    };
    fetchRooms();
    return () => {
      active = false;
    };
  }, [filters, currentPage, currentUser]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (searchLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center h-16 w-16 mb-4">
          <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-20"></div>
          <div className="rounded-full h-10 w-10 bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md">Trọ</div>
        </div>
        <p className="text-gray-500 font-medium animate-pulse text-sm">Đang nạp bộ lọc thông tin phòng...</p>
      </div>
    );
  }

  const startIndex = totalCount > 0 ? (currentPage - 1) * ITEMS_PER_PAGE : 0;
  const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, totalCount);

  return (
    <div id="search-view-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Search Info Heading */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">Khu Vực Tìm Kiếm Phòng Trọ</h2>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            {totalCount > 0 ? (
              <>
                Hiển thị từ <span className="font-bold text-blue-600">{startIndex + 1}</span> đến <span className="font-bold text-blue-600">{endIndex}</span> trong tổng số <span className="font-bold text-blue-600">{totalCount}</span> phòng trọ.
              </>
            ) : (
              "Không tìm thấy phòng trọ nào đạt tiêu chuẩn."
            )}
          </p>
        </div>

        {/* Active filters summary */}
        <div className="flex flex-wrap items-center gap-1.5">
          {filters.priceRange !== "all" && (
            <span className="text-[11px] bg-blue-50 text-blue-700 font-semibold px-2 py-1 rounded-md border border-blue-100 flex items-center gap-1">
              Giá: {filters.priceRange}
              <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => setFilters((p) => ({ ...p, priceRange: "all" }))} />
            </span>
          )}
          {filters.areaRange !== "all" && (
            <span className="text-[11px] bg-blue-50 text-blue-700 font-semibold px-2 py-1 rounded-md border border-blue-100 flex items-center gap-1">
              Diện tích: {filters.areaRange === "under-20" ? "Dưới 20 m²" : filters.areaRange === "20-30" ? "20 - 30 m²" : filters.areaRange === "30-45" ? "30 - 45 m²" : "Trên 45 m²"}
              <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => setFilters((p) => ({ ...p, areaRange: "all" }))} />
            </span>
          )}
          {filters.city && (
            <span className="text-[11px] bg-red-50 text-red-700 font-semibold px-2 py-1 rounded-md border border-red-100 flex items-center gap-1">
              {filters.city}
              <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => setFilters((p) => ({ ...p, city: "", district: "", ward: "" }))} />
            </span>
          )}
          {filters.district && (
            <span className="text-[11px] bg-red-50 text-red-700 font-semibold px-2 py-1 rounded-md border border-red-100 flex items-center gap-1">
              {filters.district}
              <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => setFilters((p) => ({ ...p, district: "", ward: "" }))} />
            </span>
          )}
          {filters.ward && (
            <span className="text-[11px] bg-red-50 text-red-700 font-semibold px-2 py-1 rounded-md border border-red-100 flex items-center gap-1">
              {filters.ward}
              <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => setFilters((p) => ({ ...p, ward: "" }))} />
            </span>
          )}
          {filters.isSharedOwner !== "all" && (
            <span className="text-[11px] bg-amber-50 text-amber-700 font-semibold px-2 py-1 rounded-md border border-amber-100 flex items-center gap-1">
              {filters.isSharedOwner === "yes" ? "Chung chủ" : "Không chung chủ"}
              <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => setFilters((p) => ({ ...p, isSharedOwner: "all" }))} />
            </span>
          )}
          {filters.rating !== null && (
            <span className="text-[11px] bg-yellow-50 text-yellow-800 font-semibold px-2 py-1 rounded-md border border-yellow-200 flex items-center gap-1">
              Tối thiểu {filters.rating} sao
              <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => setFilters((p) => ({ ...p, rating: null }))} />
            </span>
          )}
          {filters.status !== "all" && (
            <span className="text-[11px] bg-emerald-50 text-emerald-800 font-semibold px-2 py-1 rounded-md border border-emerald-100 flex items-center gap-1">
              Trạng thái: {filters.status}
              <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => setFilters((p) => ({ ...p, status: "all" }))} />
            </span>
          )}
          {filters.hasBalcony !== "all" && (
            <span className="text-[11px] bg-sky-50 text-sky-700 font-semibold px-2 py-1 rounded-md border border-sky-100 flex items-center gap-1">
              Ban công: {filters.hasBalcony === "yes" ? "Có" : "Không"}
              <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => setFilters((p) => ({ ...p, hasBalcony: "all" }))} />
            </span>
          )}
          {filters.hasMezzanine !== "all" && (
            <span className="text-[11px] bg-amber-50 text-amber-700 font-semibold px-2 py-1 rounded-md border border-amber-100 flex items-center gap-1">
              Gác lửng: {filters.hasMezzanine === "yes" ? "Có" : "Không"}
              <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => setFilters((p) => ({ ...p, hasMezzanine: "all" }))} />
            </span>
          )}
          {filters.hasFurniture !== "all" && (
            <span className="text-[11px] bg-teal-50 text-teal-700 font-semibold px-2 py-1 rounded-md border border-teal-100 flex items-center gap-1">
              Nội thất: {filters.hasFurniture === "yes" ? "Có" : "Không"}
              <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => setFilters((p) => ({ ...p, hasFurniture: "all" }))} />
            </span>
          )}
          {filters.hasAirConditioner !== "all" && (
            <span className="text-[11px] bg-blue-50 text-blue-700 font-semibold px-2 py-1 rounded-md border border-blue-100 flex items-center gap-1">
              Máy lạnh: {filters.hasAirConditioner === "yes" ? "Có" : "Không"}
              <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => setFilters((p) => ({ ...p, hasAirConditioner: "all" }))} />
            </span>
          )}
        </div>
      </div>

      {/* Grid Layout: Sidebar Filter & Room Results */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* SIDEBAR FILTERS (Col span 1) */}
        <div className="lg:col-span-1">
          <FiltersSidebar />
        </div>

        {/* ROOM RESULTS LIST GRID (Col span 3) */}
        <div className="lg:col-span-3 flex flex-col justify-between h-full">
          <div>
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    onViewDetails={viewRoomDetails}
                  />
                ))}
              </div>
            ) : (
              /* Empty result state */
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-xs flex flex-col items-center justify-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                  <Filter className="h-8 w-8" />
                </div>
                <h4 className="text-base font-bold text-gray-900">Không tìm thấy phòng trọ nào đạt tiêu chuẩn</h4>
                <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                  Yêu cầu của bạn đang lọc bộ tối ưu quá cao. Hãy xóa bớt một vài bộ lọc tiện nghi hoặc mở rộng phân khúc khoảng giá để có nhiều kết quả tốt nhất.
                </p>
                <button
                  id="empty-reset-filters-btn"
                  onClick={resetFilters}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md cursor-pointer border-none"
                >
                  Làm mới bộ lọc (Xóa lọc)
                </button>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2 border-t border-gray-100 pt-8">
              <button
                onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center justify-center p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer disabled:cursor-not-allowed bg-white"
                aria-label="Previous Page"
              >
                <ChevronLeft className="h-4.5 w-4.5" />
              </button>

              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  if (
                    totalPages > 7 &&
                    page !== 1 &&
                    page !== totalPages &&
                    Math.abs(page - currentPage) > 1
                  ) {
                    if (page === 2 && currentPage > 3) {
                      return <span key="dots-start" className="text-gray-400 px-1 select-none">...</span>;
                    }
                    if (page === totalPages - 1 && currentPage < totalPages - 2) {
                      return <span key="dots-end" className="text-gray-400 px-1 select-none">...</span>;
                    }
                    return null;
                  }

                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`h-10 w-10 flex items-center justify-center rounded-xl text-sm font-extrabold transition-all cursor-pointer border-none ${
                        currentPage === page
                          ? "bg-[#4781fd] text-white shadow-md shadow-blue-500/10"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center justify-center p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer disabled:cursor-not-allowed bg-white"
                aria-label="Next Page"
              >
                <ChevronRight className="h-4.5 w-4.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
