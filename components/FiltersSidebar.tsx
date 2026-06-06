"use client";

import React, { useState, useEffect } from "react";
import { Star, RotateCcw, MapPin, Filter } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { FilterOptions } from "@/types";

export default function FiltersSidebar() {
  const { filters, setFilters, metadata, resetFilters } = useApp();

  const handleChange = (key: keyof FilterOptions, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const priceRanges = [
    { label: "Tất cả giá", value: "all" },
    { label: "Dưới 2 triệu", value: "under-2m" },
    { label: "Từ 2 - 4 triệu", value: "2m-4m" },
    { label: "Từ 4 - 7 triệu", value: "4m-7m" },
    { label: "Trên 7 triệu", value: "above-7m" },
  ];

  const ratingOptions = [null, 5, 4, 3, 2, 1];

  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);

  const [selectedProvinceCode, setSelectedProvinceCode] = useState<string>("");
  const [selectedDistrictCode, setSelectedDistrictCode] = useState<string>("");

  useEffect(() => {
    fetch("https://provinces.open-api.vn/api/p/")
      .then((res) => res.json())
      .then((data) => setProvinces(data))
      .catch((err) => console.error("Error fetching provinces:", err));
  }, []);

  useEffect(() => {
    if (!selectedProvinceCode) {
      setDistricts([]);
      return;
    }
    fetch(`https://provinces.open-api.vn/api/p/${selectedProvinceCode}?depth=2`)
      .then((res) => res.json())
      .then((data) => setDistricts(data.districts || []))
      .catch((err) => console.error("Error fetching districts:", err));
  }, [selectedProvinceCode]);

  useEffect(() => {
    if (!selectedDistrictCode) {
      setWards([]);
      return;
    }
    fetch(`https://provinces.open-api.vn/api/d/${selectedDistrictCode}?depth=2`)
      .then((res) => res.json())
      .then((data) => setWards(data.wards || []))
      .catch((err) => console.error("Error fetching wards:", err));
  }, [selectedDistrictCode]);

  useEffect(() => {
    if (!filters.city) {
      setSelectedProvinceCode("");
      setSelectedDistrictCode("");
    }
  }, [filters.city]);

  useEffect(() => {
    if (!filters.district) {
      setSelectedDistrictCode("");
    }
  }, [filters.district]);

  return (
    <div id="filters-container" className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs sticky top-[80px] max-h-[calc(100vh-100px)] overflow-y-auto custom-scrollbar">
      {/* Sidebar Header Title and Reset Actions */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-blue-600" />
          <h2 className="text-base font-bold text-gray-900">Bộ Lọc Chi Tiết</h2>
        </div>
        <button
          id="btn-reset-filters"
          onClick={resetFilters}
          className="text-xs text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 font-semibold hover:underline cursor-pointer bg-transparent border-none"
        >
          <RotateCcw className="h-3 w-3" />
          Xóa lọc
        </button>
      </div>

      {/* Filter form compartments */}
      <div className="space-y-5">
        {/* SECTION 1: SEARCH BY NAME */}
        <div>
          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block mb-1.5">Tìm theo từ khoá/tên</label>
          <input
            id="filter-search-name"
            type="text"
            placeholder="Nhập tên đường, phòng..."
            value={filters.searchQuery}
            onChange={(e) => handleChange("searchQuery", e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 bg-gray-50/50"
          />
        </div>

        {/* SECTION 2: PRICE RANGE */}
        <div>
          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block mb-1.5">Khoản Giá Thuê</label>
          <div className="grid grid-cols-1 gap-1">
            {priceRanges.map((range) => (
              <label 
                key={range.value}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm ${filters.priceRange === range.value ? "bg-blue-50/60 font-medium text-blue-700" : "hover:bg-gray-50 text-gray-600"}`}
              >
                <input
                  type="radio"
                  name="priceRangeRadio"
                  checked={filters.priceRange === range.value}
                  onChange={() => handleChange("priceRange", range.value)}
                  className="accent-blue-600 h-4 w-4"
                />
                <span>{range.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* SECTION 3: ADDRESS DROP-DOWNS */}
        <div className="border-t border-gray-100 pt-4 space-y-3">
          <div className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Địa Chỉ Khu Vực</span>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Tỉnh / Thành phố</label>
            <select
              id="filter-city"
              value={selectedProvinceCode}
              onChange={(e) => {
                const code = e.target.value;
                setSelectedProvinceCode(code);
                setSelectedDistrictCode("");
                const province = provinces.find((p) => String(p.code) === code);
                setFilters((prev) => ({
                  ...prev,
                  city: province ? province.name : "",
                  district: "",
                  ward: "",
                }));
              }}
              className="w-full text-xs border border-gray-200 rounded-lg px-2 py-2 outline-none bg-white focus:border-blue-500"
            >
              <option value="">-- Tất cả thành phố --</option>
              {provinces.map((province) => (
                <option key={province.code} value={province.code}>{province.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Quận / Huyện</label>
            <select
              id="filter-district"
              value={selectedDistrictCode}
              disabled={!selectedProvinceCode}
              onChange={(e) => {
                const code = e.target.value;
                setSelectedDistrictCode(code);
                const district = districts.find((d) => String(d.code) === code);
                setFilters((prev) => ({
                  ...prev,
                  district: district ? district.name : "",
                  ward: "",
                }));
              }}
              className="w-full text-xs border border-gray-200 rounded-lg px-2 py-2 outline-none bg-white focus:border-blue-500 disabled:bg-gray-100"
            >
              <option value="">-- Tất cả Quận / Huyện --</option>
              {districts.map((district) => (
                <option key={district.code} value={district.code}>{district.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Phường / Xã</label>
            <select
              id="filter-ward"
              value={filters.ward ? (wards.find((w) => w.name === filters.ward)?.code || "") : ""}
              disabled={!selectedDistrictCode}
              onChange={(e) => {
                const code = e.target.value;
                const ward = wards.find((w) => String(w.code) === code);
                setFilters((prev) => ({
                  ...prev,
                  ward: ward ? ward.name : "",
                }));
              }}
              className="w-full text-xs border border-gray-200 rounded-lg px-2 py-2 outline-none bg-white focus:border-blue-500 disabled:bg-gray-100"
            >
              <option value="">-- Tất cả Phường --</option>
              {wards.map((ward) => (
                <option key={ward.code} value={ward.code}>{ward.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Tên Đường (Dữ liệu sẵn có)</label>
            <select
              id="filter-street"
              value={filters.street}
              onChange={(e) => handleChange("street", e.target.value)}
              className="w-full text-xs border border-gray-200 rounded-lg px-2 py-2 outline-none bg-white focus:border-blue-500"
            >
              <option value="">-- Tất cả Đường --</option>
              {metadata.streets.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
        </div>

        {/* SECTION 4: STAR RATING */}
        <div className="border-t border-gray-100 pt-4">
          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block mb-1.5">Đánh giá tối thiểu</label>
          <div className="grid grid-cols-3 gap-1">
            {ratingOptions.map((star) => (
              <button
                key={star === null ? "all" : star}
                id={`filter-star-btn-${star === null ? "all" : star}`}
                type="button"
                onClick={() => handleChange("rating", star)}
                className={`py-1.5 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1 transition-all ${
                  filters.rating === star
                    ? "bg-amber-500 border-amber-600 text-white"
                    : "border-gray-200 hover:bg-gray-50 text-gray-600"
                }`}
              >
                {star === null ? (
                  "Tất cả"
                ) : (
                  <>
                    <span>{star}</span>
                    <Star className={`h-3 w-3 ${filters.rating === star ? "fill-white text-white" : "fill-amber-400 text-amber-400"}`} />
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* SECTION 5: ROOM BUILDING AGE (THÂM NIÊN PHÒNG/NĂM XÂY DỰNG) */}
        <div className="border-t border-gray-100 pt-4">
          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block mb-1.5">Năm xây dựng (Thâm Niên)</label>
          <select
            id="filter-build-year"
            value={filters.buildYear}
            onChange={(e) => handleChange("buildYear", e.target.value)}
            className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 outline-none bg-white focus:border-blue-500"
          >
            <option value="all">Tất cả số thâm niên năm</option>
            {metadata.years.length > 0 ? (
              metadata.years.map((year) => (
                <option key={year} value={year.toString()}>Năm mới xây: {year}</option>
              ))
            ) : (
              <>
                <option value="2025">Nổi bật: 2025</option>
                <option value="2024">Nổi bật: 2024</option>
                <option value="2023">Nổi bật: 2023</option>
                <option value="2022">Năm 2022</option>
                <option value="2021">Năm 2021</option>
                <option value="2020">Năm 2020 và trước</option>
              </>
            )}
          </select>
        </div>

        {/* SECTION 6: BOOLEAN AND YES/NO ADVANCED OPTIONS */}
        <div className="border-t border-gray-100 pt-4 space-y-4">
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Tiện Nghi & Quy Định</span>

          {/* Grid Layout of options to keep vertical density perfect */}
          <div className="space-y-3">
            {/* Chung Chủ */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 font-medium">Chung chủ nhà</span>
              <div className="inline-flex rounded-lg overflow-hidden border border-gray-200 shrink-0">
                {["all", "no", "yes"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleChange("isSharedOwner", opt)}
                    className={`px-2 py-1 text-[11px] whitespace-nowrap transition-colors border-none cursor-pointer ${
                      filters.isSharedOwner === opt 
                        ? "bg-blue-600 text-white font-semibold" 
                        : "bg-white hover:bg-gray-50 text-gray-600"
                    }`}
                  >
                    {opt === "all" ? "Tất cả" : opt === "yes" ? "Có" : "Không"}
                  </button>
                ))}
              </div>
            </div>

            {/* Wifi */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 font-medium">Internet / Wifi</span>
              <div className="inline-flex rounded-lg overflow-hidden border border-gray-200 shrink-0">
                {["all", "yes", "no"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleChange("hasWifi", opt)}
                    className={`px-2 py-1 text-[11px] whitespace-nowrap transition-colors border-none cursor-pointer ${
                      filters.hasWifi === opt 
                        ? "bg-blue-600 text-white font-semibold" 
                        : "bg-white hover:bg-gray-50 text-gray-600"
                    }`}
                  >
                    {opt === "all" ? "Tất cả" : opt === "yes" ? "Có" : "Không"}
                  </button>
                ))}
              </div>
            </div>

            {/* Nước uống */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 font-medium">Khoản phí nước</span>
              <div className="inline-flex rounded-lg overflow-hidden border border-gray-200 shrink-0">
                {["all", "miễn phí", "có phí"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleChange("waterFeeType", opt)}
                    className={`px-2 py-1 text-[11px] whitespace-nowrap transition-colors border-none cursor-pointer ${
                      filters.waterFeeType === opt 
                        ? "bg-blue-600 text-white font-semibold" 
                        : "bg-white hover:bg-gray-50 text-gray-600"
                    }`}
                  >
                    {opt === "all" ? "Tất cả" : opt === "miễn phí" ? "Miễn phí" : "Có phí"}
                  </button>
                ))}
              </div>
            </div>

            {/* Trạng thái */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 font-medium">Trạng thái phòng</span>
              <div className="inline-flex rounded-lg overflow-hidden border border-gray-200 shrink-0">
                {["all", "còn phòng", "hết phòng"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleChange("status", opt)}
                    className={`px-2 py-1 text-[11px] whitespace-nowrap transition-colors border-none cursor-pointer ${
                      filters.status === opt 
                        ? "bg-blue-600 text-white font-semibold" 
                        : "bg-white hover:bg-gray-50 text-gray-600"
                    }`}
                  >
                    {opt === "all" ? "Tất cả" : opt === "còn phòng" ? "Còn" : "Hết"}
                  </button>
                ))}
              </div>
            </div>

            {/* Giờ giấc */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 font-medium">Giờ giấc ra vào</span>
              <div className="inline-flex rounded-lg overflow-hidden border border-gray-200 shrink-0">
                {["all", "tự do", "cố định"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleChange("hoursType", opt)}
                    className={`px-2 py-1 text-[11px] whitespace-nowrap transition-colors border-none cursor-pointer ${
                      filters.hoursType === opt 
                        ? "bg-blue-600 text-white font-semibold" 
                        : "bg-white hover:bg-gray-50 text-gray-600"
                    }`}
                  >
                    {opt === "all" ? "Tất cả" : opt === "tự do" ? "Tự do" : "Cố định"}
                  </button>
                ))}
              </div>
            </div>

            {/* Chỗ để xe */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 font-medium">Khu vực để xe</span>
              <div className="inline-flex rounded-lg overflow-hidden border border-gray-200 shrink-0">
                {["all", "yes", "no"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleChange("hasParking", opt)}
                    className={`px-2 py-1 text-[11px] whitespace-nowrap transition-colors border-none cursor-pointer ${
                      filters.hasParking === opt 
                        ? "bg-blue-600 text-white font-semibold" 
                        : "bg-white hover:bg-gray-50 text-gray-600"
                    }`}
                  >
                    {opt === "all" ? "Tất cả" : opt === "yes" ? "Có" : "Không"}
                  </button>
                ))}
              </div>
            </div>

            {/* Giới hạn người */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 font-medium">Giới hạn số người</span>
              <div className="inline-flex rounded-lg overflow-hidden border border-gray-200 shrink-0">
                {["all", "yes", "no"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleChange("isPeopleLimited", opt)}
                    className={`px-2 py-1 text-[11px] whitespace-nowrap transition-colors border-none cursor-pointer ${
                      filters.isPeopleLimited === opt 
                        ? "bg-blue-600 text-white font-semibold" 
                        : "bg-white hover:bg-gray-50 text-gray-600"
                    }`}
                  >
                    {opt === "all" ? "Tất cả" : opt === "yes" ? "Có" : "Không"}
                  </button>
                ))}
              </div>
            </div>

            {/* Thang máy */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 font-medium">Thang máy di chuyển</span>
              <div className="inline-flex rounded-lg overflow-hidden border border-gray-200 shrink-0">
                {["all", "yes", "no"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleChange("hasElevator", opt)}
                    className={`px-2 py-1 text-[11px] whitespace-nowrap transition-colors border-none cursor-pointer ${
                      filters.hasElevator === opt 
                        ? "bg-blue-600 text-white font-semibold" 
                        : "bg-white hover:bg-gray-50 text-gray-600"
                    }`}
                  >
                    {opt === "all" ? "Tất cả" : opt === "yes" ? "Có" : "Không"}
                  </button>
                ))}
              </div>
            </div>

            {/* Hợp đồng thuê */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 font-medium">Hợp đồng thuê phòng</span>
              <div className="inline-flex rounded-lg overflow-hidden border border-gray-200 shrink-0">
                {["all", "yes", "no"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleChange("hasContract", opt)}
                    className={`px-2 py-1 text-[11px] whitespace-nowrap transition-colors border-none cursor-pointer ${
                      filters.hasContract === opt 
                        ? "bg-blue-600 text-white font-semibold" 
                        : "bg-white hover:bg-gray-50 text-gray-600"
                    }`}
                  >
                    {opt === "all" ? "Tất cả" : opt === "yes" ? "Có" : "Không"}
                  </button>
                ))}
              </div>
            </div>

            {/* Ban công */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 font-medium">Ban công</span>
              <div className="inline-flex rounded-lg overflow-hidden border border-gray-200 shrink-0">
                {["all", "yes", "no"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleChange("hasBalcony", opt)}
                    className={`px-2 py-1 text-[11px] whitespace-nowrap transition-colors border-none cursor-pointer ${
                      filters.hasBalcony === opt 
                        ? "bg-blue-600 text-white font-semibold" 
                        : "bg-white hover:bg-gray-50 text-gray-600"
                    }`}
                  >
                    {opt === "all" ? "Tất cả" : opt === "yes" ? "Có" : "Không"}
                  </button>
                ))}
              </div>
            </div>

            {/* Gác */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 font-medium">Gác lửng</span>
              <div className="inline-flex rounded-lg overflow-hidden border border-gray-200 shrink-0">
                {["all", "yes", "no"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleChange("hasMezzanine", opt)}
                    className={`px-2 py-1 text-[11px] whitespace-nowrap transition-colors border-none cursor-pointer ${
                      filters.hasMezzanine === opt 
                        ? "bg-blue-600 text-white font-semibold" 
                        : "bg-white hover:bg-gray-50 text-gray-600"
                    }`}
                  >
                    {opt === "all" ? "Tất cả" : opt === "yes" ? "Có" : "Không"}
                  </button>
                ))}
              </div>
            </div>

            {/* Nội thất */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 font-medium">Nội thất</span>
              <div className="inline-flex rounded-lg overflow-hidden border border-gray-200 shrink-0">
                {["all", "yes", "no"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleChange("hasFurniture", opt)}
                    className={`px-2 py-1 text-[11px] whitespace-nowrap transition-colors border-none cursor-pointer ${
                      filters.hasFurniture === opt 
                        ? "bg-blue-600 text-white font-semibold" 
                        : "bg-white hover:bg-gray-50 text-gray-600"
                    }`}
                  >
                    {opt === "all" ? "Tất cả" : opt === "yes" ? "Có" : "Không"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
