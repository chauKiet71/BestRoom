"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Bath,
  BedDouble,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  BriefcaseBusiness,
  Crown,
  GraduationCap,
  Heart,
  Home,
  MapPin,
  Search,
  ShieldCheck,
  Sofa,
  Star,
  Trophy,
  Users,
  Wallet,
  Wifi,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { BoardingRoom, ROOM_TYPE_OPTIONS } from "@/types";
import { roomDetailPath } from "@/lib/routes";
import PageLoader from "@/components/PageLoader";

const roomImages = [
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=85",
];

const fallbackRooms = [
  { id: "demo-1", title: "Phòng trọ có gác, cửa sổ lớn", price: 3200000, area: 20, district: "Gò Vấp", city: "TP. HCM", image: roomImages[0], hasWifi: true, hasAirConditioner: true, hasFurniture: false },
  { id: "demo-2", title: "Căn hộ mini ban công rộng", price: 4800000, area: 28, district: "Bình Thạnh", city: "TP. HCM", image: roomImages[1], hasWifi: false, hasAirConditioner: true, hasFurniture: true },
  { id: "demo-3", title: "Phòng trọ mới xây, sạch sẽ", price: 3500000, area: 22, district: "Tân Phú", city: "TP. HCM", image: roomImages[2], hasWifi: true, hasAirConditioner: true, hasFurniture: false },
  { id: "demo-4", title: "Căn hộ mini full nội thất", price: 5500000, area: 30, district: "Phú Nhuận", city: "TP. HCM", image: roomImages[3], hasWifi: false, hasAirConditioner: true, hasFurniture: true },
];

const categories = [
  { title: "Phòng trọ", desc: "Giá rẻ, phù hợp sinh viên, người đi làm", icon: BedDouble, tint: "bg-blue-100 text-blue-700", value: "all" },
  { title: "Căn hộ mini", desc: "Tiện nghi, riêng tư, đầy đủ nội thất", icon: Sofa, tint: "bg-amber-100 text-amber-700", value: "above-7m" },
  { title: "Ký túc xá", desc: "Tiết kiệm chi phí, môi trường năng động", icon: Building2, tint: "bg-emerald-100 text-emerald-700", value: "under-2m" },
  { title: "Ở ghép", desc: "Chia sẻ không gian, tiết kiệm chi phí", icon: Users, tint: "bg-violet-100 text-violet-700", value: "2m-4m" },
];

const displayTitles = [
  "Phòng trọ có gác, cửa sổ lớn",
  "Căn hộ mini ban công rộng",
  "Phòng trọ mới xây, sạch sẽ",
  "Căn hộ mini full nội thất",
];

const cityAreas = [
  {
    name: "TP Hồ Chí Minh",
    city: "Hồ Chí Minh",
    image: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Hà Nội",
    city: "Hà Nội",
    image: "/hanoi.png",
  },
  {
    name: "Cần Thơ",
    city: "Cần Thơ",
    image: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=85",
  },
];

const normalizeCityName = (value: string) =>
  value
    .toLowerCase()
    .replace(/^(thành phố|tỉnh|tp\.?|tp)\s+/g, "")
    .replace(/\s+/g, "")
    .trim();

const isSameCity = (roomCity: string, targetCity: string) => {
  const roomValue = normalizeCityName(roomCity);
  const targetValue = normalizeCityName(targetCity);
  return Boolean(roomValue && targetValue && (roomValue.includes(targetValue) || targetValue.includes(roomValue)));
};

const formatListingCount = (count: number) => `${count.toLocaleString("vi-VN")} tin đăng`;

const brokerPages = [
  [
    {
      name: "Tuyền270506",
      count: "34 tin đăng phù hợp",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=85",
    },
    {
      name: "iciet123",
      count: "4 tin đăng phù hợp",
      avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=120&h=120&q=85",
    },
    {
      name: "Châu Kiệt",
      count: "2 tin đăng phù hợp",
      avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=120&h=120&q=85",
    },
  ],
  [
    {
      name: "Minh Anh Home",
      count: "18 tin đăng phù hợp",
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=120&h=120&q=85",
    },
    {
      name: "Phòng Xanh",
      count: "9 tin đăng phù hợp",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&h=120&q=85",
    },
    {
      name: "An Nhiên",
      count: "6 tin đăng phù hợp",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=85",
    },
  ],
  [
    {
      name: "BestRoom Pro",
      count: "12 tin đăng phù hợp",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=120&h=120&q=85",
    },
    {
      name: "Sài Gòn Room",
      count: "8 tin đăng phù hợp",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&h=120&q=85",
    },
    {
      name: "Nhà Trọ Sạch",
      count: "5 tin đăng phù hợp",
      avatar: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=120&h=120&q=85",
    },
  ],
];

const priceBuckets = [
  {
    label: "GIÁ SIÊU RẺ",
    title: "Dưới 2 triệu",
    value: "under-2m",
    icon: Wallet,
    tone: "from-teal-50 to-white border-teal-100 text-teal-700 shadow-teal-100",
    mark: "bg-teal-100 text-teal-700",
  },
  {
    label: "SINH VIÊN",
    title: "Từ 2 - 4 triệu",
    value: "2m-4m",
    icon: GraduationCap,
    tone: "from-blue-50 to-white border-blue-100 text-blue-700 shadow-blue-100",
    mark: "bg-blue-100 text-blue-700",
  },
  {
    label: "NGƯỜI ĐI LÀM",
    title: "Từ 4 - 7 triệu",
    value: "4m-7m",
    icon: BriefcaseBusiness,
    tone: "from-indigo-50 to-white border-indigo-100 text-indigo-700 shadow-indigo-100",
    mark: "bg-indigo-100 text-indigo-700",
  },
  {
    label: "CAO CẤP / STUDIO",
    title: "Trên 7 triệu",
    value: "above-7m",
    icon: Crown,
    tone: "from-purple-50 to-white border-purple-100 text-purple-700 shadow-purple-100",
    mark: "bg-purple-100 text-purple-700",
  },
];

function formatVND(amount: number) {
  return `${amount.toLocaleString("vi-VN")} đ/tháng`;
}

function HomeRoomCard({
  room,
  index,
  onViewDetails,
  isFavorite,
  onToggleFavorite,
}: {
  room: Partial<BoardingRoom> & { id: string };
  index: number;
  onViewDetails: (room: BoardingRoom) => void;
  isFavorite: boolean;
  onToggleFavorite: (room: BoardingRoom) => void;
}) {
  const canOpen = "description" in room;
  const title = room.title || displayTitles[index] || "Phòng trọ nổi bật";
  const district = room.district || (index === 0 ? "Gò Vấp" : index === 1 ? "Bình Thạnh" : index === 2 ? "Tân Phú" : "Phú Nhuận");
  const city = room.city || "TP. HCM";

  return (
    <article className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(15,23,42,0.14)]">
      <div className="relative h-32 overflow-hidden bg-slate-100">
        <img
          src={room.image || roomImages[index % roomImages.length]}
          alt={title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            if (canOpen) {
              onToggleFavorite(room as BoardingRoom);
            }
          }}
          className={`absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/90 backdrop-blur transition ${isFavorite ? "text-blue-600" : "text-slate-500 hover:text-blue-600"
            }`}
          aria-label={isFavorite ? "Bỏ lưu tin" : "Lưu tin"}
        >
          <Heart className={`h-5 w-5 ${isFavorite ? "fill-blue-600" : ""}`} />
        </button>
      </div>
      <div className="p-3">
        <h3 className="line-clamp-1 text-sm font-extrabold text-slate-950">{title}</h3>
        <p className="mt-1 text-[15px] font-black text-blue-700">{formatVND(room.price || 3200000)}</p>
        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-600">
          <MapPin className="h-3.5 w-3.5 text-slate-700" />
          {district}, {city}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-semibold text-slate-600">
          <span className="inline-flex items-center gap-1"><Home className="h-3.5 w-3.5" />{room.area || 24} m²</span>
          <span className="inline-flex items-center gap-1"><Bath className="h-3.5 w-3.5" />WC riêng</span>
          {room.hasAirConditioner && <span className="inline-flex items-center gap-1">Máy lạnh</span>}
          {room.hasWifi && <span className="inline-flex items-center gap-1"><Wifi className="h-3.5 w-3.5" />Wi-Fi</span>}
        </div>
        <button
          onClick={() => canOpen && onViewDetails(room as BoardingRoom)}
          className="mt-3 w-full rounded-md border border-blue-600 py-1.5 text-xs font-extrabold text-blue-700 transition hover:bg-blue-600 hover:text-white"
        >
          Xem chi tiết
        </button>
      </div>
    </article>
  );
}

export default function HomePage() {
  const router = useRouter();
  const {
    rooms,
    loading,
    filters,
    setFilters,
    resetFilters,
    isFavoriteRoom,
    toggleFavoriteRoom,
    currentUser,
    setAuthModalMode,
    setIsAuthModalOpen,
  } = useApp();
  const [activeBrokerPage, setActiveBrokerPage] = useState(0);
  const [provinces, setProvinces] = useState<Array<{ code: number; name: string }>>([]);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);

  useEffect(() => {
    let mounted = true;
    setIsLoadingProvinces(true);

    fetch("https://provinces.open-api.vn/api/p/")
      .then((response) => response.json())
      .then((data) => {
        if (mounted && Array.isArray(data)) {
          setProvinces(data);
        }
      })
      .catch((error) => {
        console.error("Error fetching provinces:", error);
      })
      .finally(() => {
        if (mounted) {
          setIsLoadingProvinces(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const featuredRooms = useMemo(() => {
    const approved = rooms.filter((room) => room.approvalStatus === "approved");
    return approved.length
      ? [...approved]
        .sort((a, b) => Number(b.interestedCount || 0) - Number(a.interestedCount || 0))
        .slice(0, 4)
      : fallbackRooms;
  }, [rooms]);

  const approvedRooms = useMemo(
    () => rooms.filter((room) => room.approvalStatus === "approved"),
    [rooms]
  );

  const cityAreaStats = useMemo(
    () =>
      cityAreas.map((area) => ({
        ...area,
        count: approvedRooms.filter((room) => isSameCity(room.city || "", area.city)).length,
      })),
    [approvedRooms]
  );

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    router.push("/search");
  };

  const handlePostRoomBannerClick = async () => {
    if (!currentUser) {
      setAuthModalMode("register");
      setIsAuthModalOpen(true);
      return;
    }

    if (currentUser.role === "admin" || (currentUser.freePostsRemaining || 0) > 0 || (currentUser.activePlan?.remainingPosts || 0) > 0) {
      router.push(`/user/${currentUser.username}?edit&tab=listing`);
      return;
    }

    router.push("/pricing");
  };

  const applyPrice = (value: string) => {
    setFilters((prev) => ({ ...prev, priceRange: value }));
    router.push("/search");
  };

  const applyCity = (city: string) => {
    setFilters((prev) => ({ ...prev, city, district: "", ward: "", street: "" }));
    router.push("/search");
  };

  if (loading) {
    return <PageLoader text="Đang tải dữ liệu phòng trọ..." className="min-h-[60vh]" />;
  }

  return (
    <div id="home-view-container" className="bg-white text-slate-950">
      <section className="relative w-full overflow-visible bg-[#075fe9] bg-[url('/hero-section-bg.png')] bg-cover sm:bg-[length:100%_100%] bg-center bg-no-repeat">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-700/50 via-blue-600/10 to-transparent" />
        <div className="relative mx-auto grid h-[500px] max-w-[1200px] grid-cols-1 items-center gap-8 px-4 pb-24 pt-10 sm:px-6 lg:grid-cols-[1fr_540px] lg:px-8">
          <div className="max-w-xl text-white">
            <h1 className="text-4xl font-black leading-tight tracking-normal sm:text-[56px]">
              Tìm phòng dễ dàng
              <span className="block text-[#ffc400]">Đăng tin nhanh chóng</span>
            </h1>
            <p className="mt-5 max-w-xl text-xl font-semibold leading-relaxed text-blue-50">
              Nền tảng kết nối người thuê và chủ trọ uy tín, giúp bạn tìm không gian sống lý tưởng.
            </p>
          </div>

          <div className="hidden">
            <div className="relative ml-auto h-[255px]">
              <img
                src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=840&q=85"
                alt="Không gian phòng BestRoom"
                className="absolute bottom-0 right-32 h-52 w-80 rounded-t-[44px] object-cover shadow-2xl"
              />
              <div className="absolute right-2 top-0 w-48 rounded-[30px] border-[10px] border-blue-800 bg-white p-3 shadow-2xl">
                <div className="mb-2 h-3 w-20 rounded-full bg-slate-100" />
                <img src={roomImages[1]} alt="Tin phòng nổi bật" className="h-24 w-full rounded-xl object-cover" />
                <div className="mt-3 space-y-2">
                  <div className="h-3 w-28 rounded-full bg-slate-200" />
                  <div className="h-3 w-20 rounded-full bg-blue-600" />
                  <div className="flex gap-2">
                    <div className="h-2 w-8 rounded-full bg-slate-200" />
                    <div className="h-2 w-10 rounded-full bg-slate-200" />
                    <div className="h-2 w-8 rounded-full bg-slate-200" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSearch}
          className="absolute bottom-0 left-1/2 z-10 grid w-[calc(100%-2rem)] max-w-[1200px] -translate-x-1/2 translate-y-1/2 grid-cols-1 gap-3 rounded-xl bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.18)] sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_190px]"
        >
          <label className="space-y-2">
            <span className="block text-sm font-extrabold text-slate-800">Khu vực</span>
            <span className="flex h-11 items-center gap-3 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-500">
              <MapPin className="h-5 w-5 text-slate-900" />
              <select
                value={filters.city}
                onChange={(event) => setFilters((prev) => ({ ...prev, city: event.target.value, district: "", ward: "", street: "" }))}
                className="w-full appearance-none border-none bg-transparent outline-none"
              >
                <option value="">{isLoadingProvinces ? "Đang tải khu vực..." : "Chọn khu vực"}</option>
                {provinces.map((province) => (
                  <option key={province.code} value={province.name}>
                    {province.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-4 w-4" />
            </span>
          </label>
          <label className="space-y-2">
            <span className="block text-sm font-extrabold text-slate-800">Mức giá</span>
            <span className="flex h-11 items-center gap-3 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-500">
              <span className="grid h-5 w-5 place-items-center rounded border border-slate-900 text-[10px] font-black">₫</span>
              <select
                value={filters.priceRange}
                onChange={(event) => setFilters((prev) => ({ ...prev, priceRange: event.target.value }))}
                className="w-full appearance-none border-none bg-transparent outline-none"
              >
                <option value="all">Chọn mức giá</option>
                <option value="under-2m">Dưới 2 triệu</option>
                <option value="2m-4m">2 - 4 triệu</option>
                <option value="4m-7m">4 - 7 triệu</option>
                <option value="above-7m">Trên 7 triệu</option>
              </select>
              <ChevronDown className="h-4 w-4" />
            </span>
          </label>
          <label className="space-y-2">
            <span className="block text-sm font-extrabold text-slate-800">Loại phòng</span>
            <span className="flex h-11 items-center gap-3 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-500">
              <Home className="h-5 w-5 text-slate-900" />
              <select
                value={filters.roomType}
                onChange={(event) => setFilters((prev) => ({ ...prev, roomType: event.target.value }))}
                className="w-full appearance-none border-none bg-transparent outline-none"
              >
                <option value="all">Chọn loại phòng</option>
                {ROOM_TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <ChevronDown className="h-4 w-4" />
            </span>
          </label>
          <button className="mt-auto flex h-11 items-center justify-center gap-3 rounded-lg bg-blue-700 px-5 text-sm font-black text-white shadow-lg shadow-blue-200 transition hover:bg-blue-800">
            <Search className="h-5 w-5" />
            Tìm kiếm
          </button>
        </form>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 pt-24 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-white  py-8">
          <div className="pointer-events-none absolute -right-12 top-0 h-48 w-48 rounded-full border-[26px] border-blue-100/70" />
          <div className="pointer-events-none absolute left-0 top-28 h-28 w-28 rounded-full bg-blue-50/70" />
          <div className="pointer-events-none absolute left-8 top-32 grid grid-cols-5 gap-3 opacity-50">
            {Array.from({ length: 20 }).map((_, index) => (
              <span key={index} className="h-1.5 w-1.5 rounded-full bg-blue-300" />
            ))}
          </div>
          <div className="pointer-events-none absolute right-10 top-56 grid grid-cols-5 gap-2 opacity-70">
            {Array.from({ length: 25 }).map((_, index) => (
              <span key={index} className="h-1.5 w-1.5 rounded-full bg-amber-300" />
            ))}
          </div>

          <div className="relative">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mb-6 flex items-center justify-center gap-4">
                <span className="hidden h-px flex-1 bg-slate-200 sm:block" />
                <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-xs font-black uppercase tracking-wide text-blue-700 shadow-sm">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  Tìm trọ dễ dàng cùng BestRoom
                </span>
                <span className="hidden h-px flex-1 bg-slate-200 sm:block" />
              </div>
              <h2 className="text-2xl font-black leading-tight text-blue-950 sm:text-3xl lg:text-4xl">
                Khoảng Giá Trọ Cho Thuê Phổ Biến
              </h2>
              <p className="mt-4 text-sm font-semibold text-slate-500 sm:text-base">
                Bấm lựa chọn phân khúc giá để tìm kiếm bộ lọc trọ ưng ý nhất
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {priceBuckets.map((bucket) => {
                const Icon = bucket.icon;
                return (
                  <button
                    key={bucket.value}
                    type="button"
                    onClick={() => applyPrice(bucket.value)}
                    className={`group overflow-hidden rounded-xl border bg-gradient-to-br text-left shadow-md transition hover:-translate-y-0.5 hover:shadow-lg ${bucket.tone}`}
                  >
                    <div className="flex h-[82px] items-center gap-4 px-4">
                      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${bucket.mark}`}>
                        <Icon className="h-6 w-6" />
                      </span>
                      <div className="min-w-0">
                        <span className="block text-[11px] font-black tracking-wide">{bucket.label}</span>
                        <h3 className="mt-1.5 whitespace-nowrap text-lg font-black text-blue-950">{bucket.title}</h3>
                      </div>
                    </div>
                    <div className="h-px bg-slate-200/90" />
                    <span className="flex h-11 items-center justify-end gap-2 px-3 text-xs font-black text-blue-700">
                      Xem phòng trọ
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="hidden">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-950">Danh mục nổi bật</h2>
          <button onClick={() => router.push("/search")} className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-900">
            Xem tất cả danh mục <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.title}
                onClick={() => applyPrice(item.value)}
                className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-[0_8px_24px_rgba(15,23,42,0.07)] transition hover:-translate-y-0.5 hover:border-blue-200"
              >
                <span className={`grid h-16 w-16 shrink-0 place-items-center rounded-full ${item.tint}`}>
                  <Icon className="h-9 w-9" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-black text-slate-950">{item.title}</span>
                  <span className="mt-1 block text-sm font-medium leading-snug text-slate-600">{item.desc}</span>
                </span>
                <ChevronRight className="h-5 w-5 rounded-full border border-blue-100 text-blue-600" />
              </button>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-xl font-black text-slate-950">Phòng trọ phổ biến</h2>
          <button
            type="button"
            onClick={() => {
              resetFilters();
              router.push("/search");
            }}
            className="inline-flex items-center gap-2 text-sm font-black text-blue-700 hover:text-blue-900"
          >
            Xem tất cả tin đăng
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featuredRooms.map((room, index) => (
            <HomeRoomCard
              key={room.id}
              room={room}
              index={index}
              onViewDetails={(room) => router.push(roomDetailPath(room.id))}
              isFavorite={isFavoriteRoom(room.id)}
              onToggleFavorite={toggleFavoriteRoom}
            />
          ))}
        </div>
      </section>

      <section className="hidden">
        <div className="grid items-center gap-5 rounded-xl border border-amber-300 bg-[linear-gradient(90deg,#fff7db_0%,#ffffff_44%,#fff7db_100%)] p-4 shadow-sm lg:grid-cols-[220px_1fr_560px_190px]">
          <div className="hidden h-24 items-end justify-center overflow-hidden rounded-lg bg-blue-50 lg:flex">
            <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=260&q=80" alt="Chủ trọ BestRoom" className="h-full w-full object-cover" />
          </div>
          <div>
            <h2 className="text-2xl font-black leading-tight text-slate-950">Bạn là chủ trọ?<br />Đăng tin ngay hôm nay!</h2>
            <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">Tiếp cận hàng ngàn khách thuê tiềm năng trên toàn quốc. Đăng tin nhanh chóng, quản lý dễ dàng, hiệu quả tối ưu.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Tiếp cận nhiều khách thuê", "Hiển thị đến hàng ngàn người tìm phòng mỗi ngày."],
              ["Quản lý tin dễ dàng", "Cập nhật, chỉnh sửa, gia hạn tin chỉ với vài thao tác."],
              ["Uy tín & an toàn", "Nền tảng ưu tiên thông tin minh bạch, đáng tin cậy."],
            ].map(([title, desc]) => (
              <div key={title} className="border-l border-amber-200 pl-4">
                <div className="mb-2 grid h-9 w-9 place-items-center rounded-full bg-blue-700 text-white">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-black text-slate-950">{title}</h3>
                <p className="mt-1 text-xs font-medium leading-relaxed text-slate-600">{desc}</p>
              </div>
            ))}
          </div>
          <button onClick={() => router.push("/admin")} className="flex h-12 items-center justify-center gap-3 rounded-lg bg-[#ffc400] px-5 text-sm font-black text-slate-950 shadow hover:bg-amber-300">
            Đăng tin miễn phí <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </section>



      <section className="mx-auto max-w-[1200px] px-4 pb-0 sm:px-6 lg:px-8">
        <div className="grid rounded-t-xl bg-blue-50 px-6 py-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["25.000+", "Tin đăng"],
            ["180.000+", "Người dùng hoạt động"],
            ["45.000+", "Lượt kết nối thành công"],
            ["100%", "Tin đăng được kiểm duyệt"],
          ].map(([number, label]) => (
            <div key={label} className="flex items-center justify-center gap-4 border-slate-300 py-3 lg:border-r last:border-r-0">
              <ShieldCheck className="h-9 w-9 text-blue-700" />
              <div>
                <p className="text-2xl font-black text-blue-700">{number}</p>
                <p className="text-sm font-bold text-slate-700">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>


      <section className="mx-auto max-w-[1200px] px-4 py-5 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_390px]">
          <div>
            <h2 className="mb-3 text-xl font-black text-slate-950">Phòng trọ nổi bật</h2>
            <div className="grid gap-4 md:grid-cols-[1.9fr_1fr]">
              <button
                type="button"
                onClick={() => applyCity(cityAreaStats[0].city)}
                className="group relative min-h-[310px] overflow-hidden rounded-xl bg-slate-900 text-left shadow-[0_10px_28px_rgba(15,23,42,0.16)]"
              >
                <img
                  src={cityAreaStats[0].image}
                  alt={cityAreaStats[0].name}
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <h3 className="text-2xl font-black leading-tight">{cityAreaStats[0].name}</h3>
                  <p className="mt-3 text-sm font-bold text-white/85">{formatListingCount(cityAreaStats[0].count)}</p>
                </div>
              </button>

              <div className="grid gap-4">
                {cityAreaStats.slice(1).map((area) => (
                  <button
                    key={area.name}
                    type="button"
                    onClick={() => applyCity(area.city)}
                    className="group relative min-h-[145px] overflow-hidden rounded-xl bg-slate-900 text-left shadow-[0_10px_28px_rgba(15,23,42,0.12)]"
                  >
                    <img
                      src={area.image}
                      alt={area.name}
                      className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />
                    <div className="absolute bottom-5 left-5 right-5 text-white">
                      <h3 className="text-xl font-black leading-tight">{area.name}</h3>
                      <p className="mt-2 text-sm font-bold text-white/85">{formatListingCount(area.count)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <aside className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.10)]">
            <div className="text-center">
              <h3 className="inline-flex items-center justify-center gap-2 text-base font-black text-blue-950">
                <Trophy className="h-5 w-5 text-amber-500" />
                Top môi giới hoạt động tại TP Hồ Chí Minh
                <Trophy className="h-5 w-5 text-amber-500" />
              </h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">Kết nối với môi giới có tin đăng phù hợp với bạn</p>
            </div>

            <div className="mt-6 space-y-5">
              {brokerPages[activeBrokerPage].map((broker) => (
                <div key={broker.name} className="flex items-center gap-4">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    <img src={broker.avatar} alt={broker.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-950">{broker.name}</h4>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{broker.count}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-7 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveBrokerPage((page) => (page === 0 ? brokerPages.length - 1 : page - 1))}
                className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition hover:bg-blue-50 hover:text-blue-700"
                aria-label="Môi giới trước"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-3">
                {brokerPages.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setActiveBrokerPage(index)}
                    className={`h-2.5 w-2.5 rounded-full transition ${activeBrokerPage === index ? "bg-orange-500" : "bg-slate-200 hover:bg-slate-300"}`}
                    aria-label={`Trang môi giới ${index + 1}`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => setActiveBrokerPage((page) => (page + 1) % brokerPages.length)}
                className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition hover:bg-blue-50 hover:text-blue-700"
                aria-label="Môi giới tiếp theo"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </aside>
        </div>
      </section>


      <section className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={handlePostRoomBannerClick}
          className="block w-full overflow-hidden rounded-xl border border-amber-200 bg-white p-0 "
          aria-label="Đăng tin miễn phí dành cho chủ trọ"
        >
          <img
            src="/section_banner1.png"
            alt="Bạn là chủ trọ? Đăng tin ngay hôm nay!"
            className="block h-auto w-full"
          />
        </button>
      </section>

            <section className="mx-auto max-w-[1200px] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-xl font-black text-slate-950">Phòng trọ mới đăng</h2>
          <button
            type="button"
            onClick={() => {
              resetFilters();
              router.push("/search");
            }}
            className="inline-flex items-center gap-2 text-sm font-black text-blue-700 hover:text-blue-900"
          >
            Xem tất cả tin đăng
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featuredRooms.map((room, index) => (
            <HomeRoomCard
              key={room.id}
              room={room}
              index={index}
              onViewDetails={(room) => router.push(roomDetailPath(room.id))}
              isFavorite={isFavoriteRoom(room.id)}
              onToggleFavorite={toggleFavoriteRoom}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
