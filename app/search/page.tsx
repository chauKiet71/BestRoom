"use client";

import React from "react";
import { Filter, X } from "lucide-react";
import { useApp } from "@/context/AppContext";
import FiltersSidebar from "@/components/FiltersSidebar";
import RoomCard from "@/components/RoomCard";

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
    rooms,
    loading,
    filters,
    setFilters,
    viewRoomDetails,
    resetFilters,
  } = useApp();

  // Filtered rooms logic
  const getFilteredRooms = () => {
    return rooms.filter((room) => {
      // Only show approved rooms in search view
      if (room.approvalStatus !== "approved") return false;

      // 1. Search Query (Title / description / Street name / Address)
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const matchesTitle = room.title.toLowerCase().includes(q);
        const matchesDesc = room.description?.toLowerCase().includes(q) || false;
        const matchesStreet = room.street?.toLowerCase().includes(q) || false;
        const matchesAddress = room.addressDetailed?.toLowerCase().includes(q) || false;
        if (!matchesTitle && !matchesDesc && !matchesStreet && !matchesAddress) {
          return false;
        }
      }

      // 2. Price Range
      if (filters.priceRange !== "all") {
        const p = room.price;
        if (filters.priceRange === "under-2m" && p >= 2000000) return false;
        if (filters.priceRange === "2m-4m" && (p < 2000000 || p > 4000000)) return false;
        if (filters.priceRange === "4m-7m" && (p < 4000000 || p > 7000000)) return false;
        if (filters.priceRange === "above-7m" && p <= 7000000) return false;
      }

      // 3. Address components
      if (filters.city && !matchLocation(room.city, filters.city)) return false;
      if (filters.district && !matchLocation(room.district, filters.district)) return false;
      if (filters.ward && !matchLocation(room.ward, filters.ward)) return false;
      if (filters.street && !matchLocation(room.street, filters.street)) return false;

      // 4. Shared Owner
      if (filters.isSharedOwner !== "all") {
        const targetShare = filters.isSharedOwner === "yes";
        if (room.isSharedOwner !== targetShare) return false;
      }

      // 5. Min Rating
      if (filters.rating !== null && room.rating < filters.rating) return false;

      // 6. Wifi
      if (filters.hasWifi !== "all") {
        const targetWifi = filters.hasWifi === "yes";
        if (room.hasWifi !== targetWifi) return false;
      }

      // 7. Water fee
      if (filters.waterFeeType !== "all" && room.waterFeeType !== filters.waterFeeType) return false;

      // 8. Status
      if (filters.status !== "all" && room.status !== filters.status) return false;

      // 9. Hours Type
      if (filters.hoursType !== "all" && room.hoursType !== filters.hoursType) return false;

      // 10. Build Year (Using string "all" or specific numeric years)
      if (filters.buildYear !== "all" && room.buildYear.toString() !== filters.buildYear) return false;

      // 11. Parking Space
      if (filters.hasParking !== "all") {
        const targetParking = filters.hasParking === "yes";
        if (room.hasParking !== targetParking) return false;
      }

      // 12. Limit people
      if (filters.isPeopleLimited !== "all") {
        const targetLimit = filters.isPeopleLimited === "yes";
        if (room.isPeopleLimited !== targetLimit) return false;
      }

      // 13. Elevator
      if (filters.hasElevator !== "all") {
        const targetElevator = filters.hasElevator === "yes";
        if (room.hasElevator !== targetElevator) return false;
      }

      // 14. Contract
      if (filters.hasContract !== "all") {
        const targetContract = filters.hasContract === "yes";
        if (room.hasContract !== targetContract) return false;
      }

      // 15. Balcony
      if (filters.hasBalcony !== "all") {
        const targetBalcony = filters.hasBalcony === "yes";
        if (room.hasBalcony !== targetBalcony) return false;
      }

      // 16. Mezzanine (Gác)
      if (filters.hasMezzanine !== "all") {
        const targetMezzanine = filters.hasMezzanine === "yes";
        if (room.hasMezzanine !== targetMezzanine) return false;
      }

      // 17. Furniture (Nội thất)
      if (filters.hasFurniture !== "all") {
        const targetFurniture = filters.hasFurniture === "yes";
        if (room.hasFurniture !== targetFurniture) return false;
      }

      return true;
    });
  };

  const filteredRooms = getFilteredRooms();

  if (loading) {
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

  return (
    <div id="search-view-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Search Info Heading */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">Khu Vực Tìm Kiếm Phòng Trọ</h2>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            Hiển thị <span className="font-bold text-blue-600">{filteredRooms.length}</span> phòng trọ phù hợp với các tiêu chí của bạn.
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
        </div>
      </div>

      {/* Grid Layout: Sidebar Filter & Room Results */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* SIDEBAR FILTERS (Col span 1) */}
        <div className="lg:col-span-1">
          <FiltersSidebar />
        </div>

        {/* ROOM RESULTS LIST GRID (Col span 3) */}
        <div className="lg:col-span-3">
          {filteredRooms.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRooms.map((room) => (
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
      </div>
    </div>
  );
}
