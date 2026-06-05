import React, { useState, useEffect } from "react";
import {
  Home as HomeIcon,
  Search,
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  Star,
  Eye,
  MapPin,
  Maximize2,
  Calendar,
  Wifi,
  Clock,
  DollarSign,
  Phone,
  User,
  Heart,
  Filter,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  Sparkles,
  CheckCircle2,
  ArrowUpDown,
  Building,
  AlertCircle
} from "lucide-react";
import Header from "./components/Header";
import RoomCard, { formatVND } from "./components/RoomCard";
import FiltersSidebar from "./components/FiltersSidebar";
import Footer from "./components/Footer";
import AuthModal from "./components/AuthModal";
import { BoardingRoom, FilterOptions, User as UserType, Review } from "./types";


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

const INITIAL_FILTERS: FilterOptions = {
  searchQuery: "",
  priceRange: "all",
  city: "",
  district: "",
  ward: "",
  street: "",
  isSharedOwner: "all",
  rating: null,
  hasWifi: "all",
  waterFeeType: "all",
  status: "all",
  hoursType: "all",
  buildYear: "all",
  hasParking: "all",
  isPeopleLimited: "all",
  hasElevator: "all",
  hasContract: "all",
  hasBalcony: "all",
  hasMezzanine: "all",
  hasFurniture: "all"
};

export default function App() {
  // Authentication and Session States
  const [currentUser, setCurrentUser] = useState<UserType | null>(() => {
    try {
      const stored = localStorage.getItem("bestroom_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register" | "forgot">("login");

  // Ratings & Reviews handler states
  const [newReviewRating, setNewReviewRating] = useState<number>(5);
  const [newReviewComment, setNewReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [submitReviewError, setSubmitReviewError] = useState<string | null>(null);
  const [submitReviewSuccess, setSubmitReviewSuccess] = useState<boolean>(false);

  // Navigation State
  const [currentTab, setCurrentTab] = useState<"home" | "search" | "admin">("home");

  // Data States
  const [rooms, setRooms] = useState<BoardingRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [filters, setFilters] = useState<FilterOptions>(INITIAL_FILTERS);

  // Metadata for filter options (city, ward, street, buildYears)
  const [metadata, setMetadata] = useState<{
    cities: string[];
    wards: string[];
    streets: string[];
    years: number[];
  }>({
    cities: [],
    wards: [],
    streets: [],
    years: []
  });

  // Selected Room Details State
  const [selectedRoom, setSelectedRoom] = useState<BoardingRoom | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);


  // Admin CRUD Modal States
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<BoardingRoom | null>(null);

  // Admin form address dropdowns API states
  const [adminProvinces, setAdminProvinces] = useState<any[]>([]);
  const [adminDistricts, setAdminDistricts] = useState<any[]>([]);
  const [adminWards, setAdminWards] = useState<any[]>([]);
  const [selectedAdminProvCode, setSelectedAdminProvCode] = useState<string>("");
  const [selectedAdminDistCode, setSelectedAdminDistCode] = useState<string>("");

  useEffect(() => {
    if (isAdminModalOpen) {
      fetch("https://provinces.open-api.vn/api/p/")
        .then(res => res.json())
        .then(data => {
          setAdminProvinces(data);
          if (editingRoom) {
            const foundProv = data.find((p: any) => cleanName(p.name).includes(cleanName(editingRoom.city)) || cleanName(editingRoom.city).includes(cleanName(p.name)));
            if (foundProv) {
              setSelectedAdminProvCode(String(foundProv.code));
            }
          }
        })
        .catch(err => console.error("Error admin fetching provinces:", err));
    } else {
      setAdminProvinces([]);
      setAdminDistricts([]);
      setAdminWards([]);
      setSelectedAdminProvCode("");
      setSelectedAdminDistCode("");
    }
  }, [isAdminModalOpen, editingRoom]);

  useEffect(() => {
    if (!selectedAdminProvCode) {
      setAdminDistricts([]);
      return;
    }
    fetch(`https://provinces.open-api.vn/api/p/${selectedAdminProvCode}?depth=2`)
      .then(res => res.json())
      .then(data => {
        const dists = data.districts || [];
        setAdminDistricts(dists);
        if (editingRoom) {
          const foundDist = dists.find((d: any) => cleanName(d.name).includes(cleanName(editingRoom.district)) || cleanName(editingRoom.district).includes(cleanName(d.name)));
          if (foundDist) {
            setSelectedAdminDistCode(String(foundDist.code));
          }
        }
      })
      .catch(err => console.error("Error admin fetching districts:", err));
  }, [selectedAdminProvCode, editingRoom]);

  useEffect(() => {
    if (!selectedAdminDistCode) {
      setAdminWards([]);
      return;
    }
    fetch(`https://provinces.open-api.vn/api/d/${selectedAdminDistCode}?depth=2`)
      .then(res => res.json())
      .then(data => {
        setAdminWards(data.wards || []);
      })
      .catch(err => console.error("Error admin fetching wards:", err));
  }, [selectedAdminDistCode, editingRoom]);

  // Admin Form Fields
  const [formFields, setFormFields] = useState<Partial<BoardingRoom>>({
    title: "",
    description: "",
    price: 3000000,
    area: 25,
    city: "Hồ Chí Minh",
    district: "",
    ward: "Phường 12",
    street: "Cách Mạng Tháng Tám",
    addressDetailed: "",
    contactName: "",
    contactPhone: "",
    image: "",
    images: [],
    isSharedOwner: false,
    rating: 5,
    hasWifi: true,
    waterFeeType: "có phí",
    status: "còn phòng",
    hoursType: "tự do",
    buildYear: 2025,
    hasParking: true,
    isPeopleLimited: false,
    maxPeople: 2,
    hasElevator: false,
    hasContract: true,
    hasBalcony: false,
    hasMezzanine: false,
    hasFurniture: false,
    electricityPrice: 3500
  });

  // Fetch Rooms & Metadata
  const fetchAllData = async () => {
    try {
      setLoading(true);
      // Fetch Rooms
      const roomsRes = await fetch("/api/rooms");
      if (!roomsRes.ok) {
        const errData = await roomsRes.json().catch(() => ({}));
        throw new Error(errData.error || "Không thể kết nối API danh sách phòng");
      }
      const roomsData = await roomsRes.json();
      setRooms(roomsData);

      // Fetch Metadata
      const metaRes = await fetch("/api/meta");
      if (metaRes.ok) {
        const metaData = await metaRes.json();
        setMetadata(metaData);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Đã xảy ra lỗi khi đồng bộ dữ liệu phòng trọ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Sync details viewing
  const handleViewRoomDetails = async (room: BoardingRoom) => {
    setSelectedRoom(room);
    setActiveImageIndex(0);
    // Automatically increment interested view count via API call
    try {
      const res = await fetch(`/api/rooms/${room.id}`);
      if (res.ok) {
        const updatedRoom = await res.json();
        // Update local rooms array to reflect updated count
        setRooms(prev => prev.map(r => r.id === room.id ? { ...r, interestedCount: updatedRoom.interestedCount } : r));
        setSelectedRoom(updatedRoom);
      }
    } catch (e) {
      console.error("Lỗi cập nhật số lượt quan tâm", e);
    }
  };

  // Filtered rooms logic
  const getFilteredRooms = () => {
    return rooms.filter((room) => {
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

  // Highlight Collections for HOME PAGE
  // Section A: Trọ mới đăng (newly created - order by createdAt desc)
  const newlyPostedRooms = [...rooms]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  // Section B: Trọ được quan tâm (sorted by interestedCount desc)
  const premiumInterestedRooms = [...rooms]
    .sort((a, b) => (b.interestedCount || 0) - (a.interestedCount || 0))
    .slice(0, 4);

  // Quick action to search for a specific price bucket on Home page
  const handleSelectPriceRange = (rangeValue: string) => {
    setFilters((prev) => ({
      ...prev,
      priceRange: rangeValue,
    }));
    setCurrentTab("search");
  };

  // Reset all filters easily
  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  // Session management handlers
  const handleLogout = () => {
    localStorage.removeItem("bestroom_user");
    setCurrentUser(null);
    if (currentTab === "admin") {
      setCurrentTab("home");
    }
  };

  const handleAuthSuccess = (user: UserType) => {
    localStorage.setItem("bestroom_user", JSON.stringify(user));
    setCurrentUser(user);
  };

  // Submit Rating and Review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Bạn cần đăng nhập để viết đánh giá.");
      return;
    }
    if (!newReviewComment.trim()) {
      setSubmitReviewError("Vui lòng điền nội dung phòng trọ trước khi đăng.");
      return;
    }
    if (!selectedRoom) return;

    setSubmittingReview(true);
    setSubmitReviewError(null);
    setSubmitReviewSuccess(false);

    try {
      const res = await fetch(`/api/rooms/${selectedRoom.id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: currentUser.id,
          username: currentUser.username,
          rating: newReviewRating,
          comment: newReviewComment
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Không thể gửi phần đánh giá của bạn.");
      }

      setSubmitReviewSuccess(true);
      setNewReviewComment("");
      setNewReviewRating(5);

      // Reload room details dynamically to sync reviews array
      const roomRes = await fetch(`/api/rooms/${selectedRoom.id}`);
      if (roomRes.ok) {
        const updatedRoom = await roomRes.json();
        // Update both list array and also modal view selection
        setRooms(prev => prev.map(r => r.id === selectedRoom.id ? { ...r, rating: updatedRoom.rating } : r));
        setSelectedRoom(updatedRoom);
      }

      setTimeout(() => {
        setSubmitReviewSuccess(false);
      }, 3000);
    } catch (err: any) {
      setSubmitReviewError(err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Admin Section: DELETE ROOM (Admin check header applied)
  const handleDeleteRoom = async (id: string) => {
    try {
      const res = await fetch(`/api/rooms/${id}`, {
        method: "DELETE",
        headers: {
          "x-user-role": currentUser?.role || ""
        }
      });
      if (res.ok) {
        setRooms(prev => prev.filter(r => r.id !== id));
        // Reset details if opened
        if (selectedRoom?.id === id) {
          setSelectedRoom(null);
        }
      } else {
        const data = await res.json();
        alert(data.error || "Có lỗi xảy ra khi xoá phòng trọ.");
      }
    } catch (e) {
      console.error(e);
      alert("Không thể kết nối máy chủ để thực hiện.");
    }
  };

  // Admin Section: OPEN ADD POPUP
  const handleOpenAddModal = () => {
    setEditingRoom(null);
    setFormFields({
      title: "",
      description: "",
      price: 2500000,
      area: 22,
      city: "Hồ Chí Minh",
      district: "",
      ward: "Phường 15",
      street: "Điện Biên Phủ",
      addressDetailed: "280 Điện Biên Phủ, Phường 15, Quận Bình Thạnh, TP. HCM",
      contactName: "Quản Lý Nhà Trọ",
      contactPhone: "0909000111",
      image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
      images: [
        "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80"
      ],
      isSharedOwner: false,
      rating: 5,
      hasWifi: true,
      waterFeeType: "có phí",
      status: "còn phòng",
      hoursType: "tự do",
      buildYear: 2025,
      hasParking: true,
      isPeopleLimited: true,
      maxPeople: 3,
      hasElevator: false,
      hasContract: true,
      hasBalcony: false,
      hasMezzanine: false,
      hasFurniture: false,
      electricityPrice: 3500
    });
    setIsAdminModalOpen(true);
  };

  // Admin Section: OPEN EDIT POPUP
  const handleOpenEditModal = (room: BoardingRoom) => {
    setEditingRoom(room);
    setFormFields({
      ...room,
      images: Array.isArray(room.images) ? [...room.images] : (room.image ? [room.image] : []),
      hasBalcony: room.hasBalcony || false,
      hasMezzanine: room.hasMezzanine || false,
      hasFurniture: room.hasFurniture || false,
      electricityPrice: room.electricityPrice || 3500,
      district: room.district || ""
    });
    setIsAdminModalOpen(true);
  };

  // Admin Section: SAVE / SUBMIT FORM (CREATE & UPDATE - Admin authentication secured)
  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFields.title || !formFields.price || !formFields.city) {
      alert("Vui lòng nhập các thông tin bắt buộc: Tiêu đề, Giá phòng, Tỉnh/Thành phố.");
      return;
    }

    try {
      const method = editingRoom ? "PUT" : "POST";
      const url = editingRoom ? `/api/rooms/${editingRoom.id}` : "/api/rooms";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-user-role": currentUser?.role || ""
        },
        body: JSON.stringify(formFields)
      });

      if (res.ok) {
        const savedRoom = await res.json();
        if (editingRoom) {
          // Update item inline
          setRooms(prev => prev.map(r => r.id === savedRoom.id ? savedRoom : r));
        } else {
          // Put new item first
          setRooms(prev => [savedRoom, ...prev]);
        }
        setIsAdminModalOpen(false);
        setEditingRoom(null);
      } else {
        const err = await res.json();
        alert("Lỗi từ server: " + (err.error || "Không thể lưu phòng"));
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi đường truyền mạng khi gửi phòng trọ.");
    }
  };

  return (
    <div id="application-root" className="min-h-screen bg-gray-50/50 text-gray-800 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* HEADER SECTION NAV */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        onLoginClick={() => {
          setAuthModalMode("login");
          setIsAuthModalOpen(true);
        }}
        onRegisterClick={() => {
          setAuthModalMode("register");
          setIsAuthModalOpen(true);
        }}
      />

      {/* ERROR BANNER DISPLAY */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 mt-6 w-full">
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-2xl flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <div className="text-sm">
              <span className="font-bold">Lỗi kết nối hệ thống:</span> {error}
            </div>
            <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* PRIMARY VIEWS LAYOUT */}
      <main className="flex-1">
        {loading ? (
          /* Loading State skeleton */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex flex-col items-center justify-center">
            <div className="relative flex items-center justify-center h-16 w-16 mb-4">
              <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-20"></div>
              <div className="rounded-full h-10 w-10 bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md">Trọ</div>
            </div>
            <p className="text-gray-500 font-medium animate-pulse text-sm">Đang tải cơ sở dữ liệu phòng trọ uy tín...</p>
          </div>
        ) : (
          <>
            {/* VIEW 1: TRANG CHỦ (HOME PAGE) */}
            {currentTab === "home" && (
              <div id="home-view-container" className="animate-fade-in">
                {/* HERO BANNER SECTION */}
                <section className="relative bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 text-white py-16 px-4 overflow-hidden shadow-md">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent"></div>

                  <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
                    <span className="bg-blue-500/20 text-blue-300 text-xs font-semibold px-4, py-1.5 px-3 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 border border-blue-400/20 mx-auto">
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
                    <div className="max-w-xl mx-auto pt-4">
                      <div className="bg-white p-2 rounded-2xl shadow-xl flex items-center gap-1 border border-gray-100">
                        <div className="flex items-center gap-2 px-3 grow text-gray-700">
                          <Search className="h-5 w-5 text-gray-400 shrink-0" />
                          <input
                            id="home-hero-search-input"
                            type="text"
                            placeholder="Nhập tên phòng, tên đường hoặc từ khoá cần tìm..."
                            value={filters.searchQuery}
                            onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                setCurrentTab("search");
                              }
                            }}
                            className="w-full text-sm outline-none border-none py-2 text-gray-800 placeholder-gray-400"
                          />
                        </div>
                        <button
                          id="home-hero-search-btn"
                          onClick={() => setCurrentTab("search")}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-3 rounded-xl transition-all duration-150 shadow-md flex items-center gap-2 cursor-pointer shrink-0"
                        >
                          <span>Tìm ngay</span>
                          <ArrowRight className="h-4 w-4" />
                        </button>
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
                        setFilters(INITIAL_FILTERS);
                        setCurrentTab("search");
                      }}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-all flex items-center gap-1 self-start sm:self-center cursor-pointer"
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
                          onViewDetails={handleViewRoomDetails}
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
                          setFilters(INITIAL_FILTERS);
                          setCurrentTab("search");
                        }}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-all flex items-center gap-1 self-start sm:self-center cursor-pointer"
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
                            onViewDetails={handleViewRoomDetails}
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
            )}

            {/* VIEW 2: TRANG TÌM KIẾM CHI TIẾT (SEARCH LIST WITH FILTERS SIDEBAR) */}
            {currentTab === "search" && (
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
                        <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => setFilters(p => ({ ...p, priceRange: "all" }))} />
                      </span>
                    )}
                    {filters.city && (
                      <span className="text-[11px] bg-red-50 text-red-700 font-semibold px-2 py-1 rounded-md border border-red-100 flex items-center gap-1">
                        {filters.city}
                        <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => setFilters(p => ({ ...p, city: "", district: "", ward: "" }))} />
                      </span>
                    )}
                    {filters.district && (
                      <span className="text-[11px] bg-red-50 text-red-700 font-semibold px-2 py-1 rounded-md border border-red-100 flex items-center gap-1">
                        {filters.district}
                        <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => setFilters(p => ({ ...p, district: "", ward: "" }))} />
                      </span>
                    )}
                    {filters.ward && (
                      <span className="text-[11px] bg-red-50 text-red-700 font-semibold px-2 py-1 rounded-md border border-red-100 flex items-center gap-1">
                        {filters.ward}
                        <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => setFilters(p => ({ ...p, ward: "" }))} />
                      </span>
                    )}
                    {filters.isSharedOwner !== "all" && (
                      <span className="text-[11px] bg-amber-50 text-amber-700 font-semibold px-2 py-1 rounded-md border border-amber-100 flex items-center gap-1">
                        {filters.isSharedOwner === "yes" ? "Chung chủ" : "Không chung chủ"}
                        <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => setFilters(p => ({ ...p, isSharedOwner: "all" }))} />
                      </span>
                    )}
                    {filters.rating !== null && (
                      <span className="text-[11px] bg-yellow-50 text-yellow-800 font-semibold px-2 py-1 rounded-md border border-yellow-200 flex items-center gap-1">
                        Tối thiểu {filters.rating} sao
                        <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => setFilters(p => ({ ...p, rating: null }))} />
                      </span>
                    )}
                    {filters.status !== "all" && (
                      <span className="text-[11px] bg-emerald-50 text-emerald-800 font-semibold px-2 py-1 rounded-md border border-emerald-100 flex items-center gap-1">
                        Trạng thái: {filters.status}
                        <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => setFilters(p => ({ ...p, status: "all" }))} />
                      </span>
                    )}
                    {filters.hasBalcony !== "all" && (
                      <span className="text-[11px] bg-sky-50 text-sky-700 font-semibold px-2 py-1 rounded-md border border-sky-100 flex items-center gap-1">
                        Ban công: {filters.hasBalcony === "yes" ? "Có" : "Không"}
                        <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => setFilters(p => ({ ...p, hasBalcony: "all" }))} />
                      </span>
                    )}
                    {filters.hasMezzanine !== "all" && (
                      <span className="text-[11px] bg-amber-50 text-amber-700 font-semibold px-2 py-1 rounded-md border border-amber-100 flex items-center gap-1">
                        Gác lửng: {filters.hasMezzanine === "yes" ? "Có" : "Không"}
                        <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => setFilters(p => ({ ...p, hasMezzanine: "all" }))} />
                      </span>
                    )}
                    {filters.hasFurniture !== "all" && (
                      <span className="text-[11px] bg-teal-50 text-teal-700 font-semibold px-2 py-1 rounded-md border border-teal-100 flex items-center gap-1">
                        Nội thất: {filters.hasFurniture === "yes" ? "Có" : "Không"}
                        <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => setFilters(p => ({ ...p, hasFurniture: "all" }))} />
                      </span>
                    )}
                  </div>
                </div>

                {/* Grid Layout: Sidebar Filter & Room Results */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  {/* SIDEBAR FILTERS (Col span 1) */}
                  <div className="lg:col-span-1">
                    <FiltersSidebar
                      filters={filters}
                      setFilters={setFilters}
                      metadata={metadata}
                      onReset={handleResetFilters}
                    />
                  </div>

                  {/* ROOM RESULTS LIST GRID (Col span 3) */}
                  <div className="lg:col-span-3">
                    {filteredRooms.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRooms.map((room) => (
                          <RoomCard
                            key={room.id}
                            room={room}
                            onViewDetails={handleViewRoomDetails}
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
                          onClick={handleResetFilters}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
                        >
                          Làm mới bộ lọc (Xóa lọc)
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 3: TRANG QUẢN TRỊ (ADMIN DASHBOARD CONTROLS) */}
            {currentTab === "admin" && (
              currentUser?.role === "admin" ? (
                <div id="admin-view-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
                  {/* Header operations bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-5 mb-6 gap-4">
                    <div>
                      <h2 className="text-xl md:text-2xl font-black text-gray-900 flex items-center gap-2">
                        <ShieldCheck className="h-7 w-7 text-amber-600" />
                        Trang Quản Trị Hệ Thống Phòng Trọ
                      </h2>
                      <p className="text-xs text-gray-500 mt-1">
                        Thực hiện thêm mới, cập nhật thông tin phòng, giá thuê, địa chỉ, hoặc xoá phòng trọ khi đã hết phòng dài hạn.
                      </p>
                    </div>

                    <button
                      id="admin-add-room-trigger"
                      onClick={handleOpenAddModal}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 px-5 rounded-xl transition-all duration-150 shadow-md flex items-center justify-center gap-2 cursor-pointer self-start sm:self-center"
                    >
                      <Plus className="h-4 w-4" />
                      Thêm phòng trọ mới
                    </button>
                  </div>

                  {/* Dense CRUD Boarding Room Grid Layout with Admin actions enabled */}
                  <div className="space-y-6">
                    {rooms.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {rooms.map((room) => (
                          <RoomCard
                            key={room.id}
                            room={room}
                            isAdminMode={true}
                            onViewDetails={handleViewRoomDetails}
                            onEdit={handleOpenEditModal}
                            onDelete={handleDeleteRoom}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                        <p className="text-gray-400 text-sm">Chưa có phòng trọ nào trong hệ thống hoặc đã bị xoá hết.</p>
                        <button
                          onClick={handleOpenAddModal}
                          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-xl text-center"
                        >
                          Thêm phòng trọ đầu tiên
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div id="admin-locked-view" className="max-w-md mx-auto px-4 py-16 text-center space-y-6 animate-fade-in flex-1 flex flex-col justify-center">
                  <div className="mx-auto h-16 w-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-200">
                    <ShieldCheck className="h-8 w-8" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-black text-gray-900 font-sans tracking-tight">Yêu Cầu Quyền Quản Trị Viên</h2>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Để thực hiện đăng tin, sửa đổi nội dung và kiểm soát hoạt động chi tiết phòng trọ, vui lòng đăng nhập với tài khoản có quyền Quản trị hệ thống (Admin).
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs space-y-2 text-left text-slate-600">
                    <span className="font-bold text-slate-800 uppercase block tracking-wider text-[10px]">&bull; Tài khoản quản trị dùng thử:</span>
                    <div className="grid grid-cols-2 gap-1 font-mono">
                      <span>Tên đăng nhập: <strong className="text-blue-600">admin</strong></span>
                      <span>Mật khẩu: <strong className="text-blue-600 font-mono">admin</strong></span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setAuthModalMode("login");
                      setIsAuthModalOpen(true);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3.5 rounded-xl transition-all shadow-md mt-2 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Đăng Nhập Admin Thử Nghiệm</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )
            )}
          </>
        )}
      </main>

      {/* FOOTER SECTION */}
      <Footer setCurrentTab={setCurrentTab} onPriceSelect={handleSelectPriceRange} />

      {/* MODAL 1: ROOM DETAILED OVERLAY (XEM CHI TIẾT) */}
      {selectedRoom && (
        <div id="room-details-modal" className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl relative animate-scale-up max-h-[90vh] flex flex-col justify-between">

            {/* Header Controls */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
              <span className="bg-white/90 backdrop-blur-xs text-gray-800 text-xs font-semibold px-2.5 py-1 rounded-md shadow-xs flex items-center gap-1 select-none">
                <Eye className="h-3.5 w-3.5 text-blue-600" />
                <span>{selectedRoom.interestedCount} quan tâm</span>
              </span>

              <button
                id="close-details-modal"
                onClick={() => setSelectedRoom(null)}
                className="bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 custom-scrollbar">
              {/* Feature Image Banner with Dynamic Slide Gallery support */}
              {(() => {
                const roomImages = Array.isArray(selectedRoom.images) && selectedRoom.images.length > 0
                  ? selectedRoom.images
                  : [selectedRoom.image || "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80"];

                return (
                  <>
                    <div className="relative aspect-video w-full bg-slate-900 group">
                      <img
                        src={roomImages[activeImageIndex] || "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80"}
                        alt={`${selectedRoom.title} - ảnh ${activeImageIndex + 1}`}
                        className="h-full w-full object-cover transition-all duration-300"
                        referrerPolicy="no-referrer"
                      />

                      {/* Left Arrow Controls */}
                      {roomImages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setActiveImageIndex((prev) => (prev === 0 ? roomImages.length - 1 : prev - 1))}
                          className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-all cursor-pointer shadow-md select-none hover:scale-105 active:scale-95 z-20"
                          title="Ảnh trước"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                      )}

                      {/* Right Arrow Controls */}
                      {roomImages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setActiveImageIndex((prev) => (prev === roomImages.length - 1 ? 0 : prev + 1))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-all cursor-pointer shadow-md select-none hover:scale-105 active:scale-95 z-20"
                          title="Ảnh tiếp theo"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      )}

                      {/* Top-left Image Counter Badge */}
                      {roomImages.length > 1 && (
                        <span className="absolute top-4 left-4 bg-black/70 backdrop-blur-xs text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md shadow-sm z-20">
                          {activeImageIndex + 1} / {roomImages.length} ảnh
                        </span>
                      )}

                      {/* Available status Badge overlay */}
                      <span className={`absolute bottom-4 left-4 text-xs font-extrabold uppercase px-3 py-1 rounded-lg text-white shadow-md z-20 ${selectedRoom.status === "còn phòng" ? "bg-emerald-500" : "bg-gray-400"}`}>
                        Trạng thái: {selectedRoom.status}
                      </span>
                    </div>

                    {/* Interactive Clickable Thumbnails Row */}
                    {roomImages.length > 1 && (
                      <div className="bg-gray-50 border-b border-gray-100 p-3 flex gap-2 overflow-x-auto select-none custom-scrollbar shrink-0">
                        {roomImages.map((imgUrl, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveImageIndex(idx)}
                            className={`relative h-14 w-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${idx === activeImageIndex
                                ? "border-blue-600 scale-102 ring-2 ring-blue-100"
                                : "border-transparent opacity-60 hover:opacity-100"
                              }`}
                          >
                            <img
                              src={imgUrl}
                              className="h-full w-full object-cover"
                              alt={`Thu nhỏ ${idx + 1}`}
                              referrerPolicy="no-referrer"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Body Details */}
              <div className="p-6 sm:p-8 space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-blue-600 uppercase tracking-widest font-bold">
                    <span>{selectedRoom.city}{selectedRoom.district ? ` • ${selectedRoom.district}` : ""}{selectedRoom.ward ? ` • ${selectedRoom.ward}` : ""}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-gray-900 mt-2 leading-tight">
                    {selectedRoom.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2">
                    <MapPin className="h-4 w-4 text-rose-400 shrink-0" />
                    <span className="font-medium underline">{selectedRoom.addressDetailed}</span>
                  </div>
                </div>

                {/* Big Info Key metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="text-center md:text-left">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">Giá thuê hàng tháng</span>
                    <span className="text-[17px] font-extrabold text-red-600 block mt-0.5">{formatVND(selectedRoom.price)}</span>
                  </div>
                  <div className="text-center md:text-left border-l border-gray-200/60 pl-2">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">Diện tích sử dụng</span>
                    <span className="text-sm font-extrabold text-gray-800 block mt-0.5">{selectedRoom.area} m²</span>
                  </div>
                  <div className="text-center md:text-left border-l border-gray-200/60 pl-2">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">Năm xây dựng</span>
                    <span className="text-sm font-extrabold text-gray-800 block mt-0.5">{selectedRoom.buildYear} (Thâm niên)</span>
                  </div>
                  <div className="text-center md:text-left border-l border-gray-200/60 pl-2">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">Đánh giá uy tín</span>
                    <div className="flex items-center justify-center md:justify-start gap-1 mt-0.5">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-extrabold text-gray-800">{selectedRoom.rating}.0 / 5</span>
                    </div>
                  </div>
                </div>

                {/* Facilities List (Grid 2 cols) */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 uppercase tracking-wide">Chi Tiết Tiện Nghi & Quy Định Phòng</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    {/* Item 1 */}
                    <div className="flex items-center justify-between py-1 border-b border-gray-50">
                      <span className="text-gray-500">Chung chủ nhà:</span>
                      <span className={`font-semibold ${selectedRoom.isSharedOwner ? "text-amber-700 bg-amber-50" : "text-emerald-700 bg-emerald-50"} text-xs px-2.5 py-0.5 rounded-md`}>
                        {selectedRoom.isSharedOwner ? "Có chung chủ" : "Không chung chủ"}
                      </span>
                    </div>
                    {/* Item 2 */}
                    <div className="flex items-center justify-between py-1 border-b border-gray-50">
                      <span className="text-gray-500">Kết nối Wifi:</span>
                      <span className={`font-semibold ${selectedRoom.hasWifi ? "text-blue-700 bg-blue-50" : "text-gray-400 bg-gray-50"} text-xs px-2.5 py-0.5 rounded-md`}>
                        {selectedRoom.hasWifi ? "Có sẳn Wifi" : "Không cung cấp"}
                      </span>
                    </div>
                    {/* Item 3 */}
                    <div className="flex items-center justify-between py-1 border-b border-gray-50">
                      <span className="text-gray-500">Khoản thu phí nước:</span>
                      <span className="font-bold text-gray-800 text-xs capitalize bg-gray-100 px-2.5 py-0.5 rounded-md">
                        Nước {selectedRoom.waterFeeType}
                      </span>
                    </div>
                    {/* Item 4 */}
                    <div className="flex items-center justify-between py-1 border-b border-gray-50">
                      <span className="text-gray-500">Giờ giấc ra vào:</span>
                      <span className="font-bold text-indigo-700 bg-indigo-50 text-xs px-2.5 py-0.5 rounded-md capitalize">
                        Giờ {selectedRoom.hoursType}
                      </span>
                    </div>
                    {/* Item 5 */}
                    <div className="flex items-center justify-between py-1 border-b border-gray-50">
                      <span className="text-gray-500">Chỗ để phương tiện xe:</span>
                      <span className={`font-semibold ${selectedRoom.hasParking ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"} text-xs px-2.5 py-0.5 rounded-md`}>
                        {selectedRoom.hasParking ? "Có bãi đỗ xe" : "Không có bãi"}
                      </span>
                    </div>
                    {/* Item 6 */}
                    <div className="flex items-center justify-between py-1 border-b border-gray-50">
                      <span className="text-gray-500">Giới hạn số người ở:</span>
                      <span className="font-bold text-gray-800 text-xs">
                        {selectedRoom.isPeopleLimited ? `Tối đa ${selectedRoom.maxPeople || 3} người` : "Không giới hạn"}
                      </span>
                    </div>
                    {/* Item 7 */}
                    <div className="flex items-center justify-between py-1 border-b border-gray-50">
                      <span className="text-gray-500">Thang máy nội khu:</span>
                      <span className={`font-semibold ${selectedRoom.hasElevator ? "text-emerald-700 bg-emerald-50" : "text-gray-400 bg-gray-50"} text-xs px-2.5 py-0.5 rounded-md`}>
                        {selectedRoom.hasElevator ? "Có thang máy" : "Thang bộ"}
                      </span>
                    </div>
                    {/* Item 8 */}
                    <div className="flex items-center justify-between py-1 border-b border-gray-50">
                      <span className="text-gray-500">Cam kết hợp đồng thuê:</span>
                      <span className={`font-semibold ${selectedRoom.hasContract ? "text-emerald-700 bg-emerald-50" : "text-amber-700 bg-amber-50"} text-xs px-2.5 py-0.5 rounded-md`}>
                        {selectedRoom.hasContract ? "Có ký hợp đồng" : "Không bắt buộc"}
                      </span>
                    </div>
                    {/* Item 9: Balcony */}
                    <div className="flex items-center justify-between py-1 border-b border-gray-50">
                      <span className="text-gray-500">Ban công:</span>
                      <span className={`font-semibold ${selectedRoom.hasBalcony ? "text-sky-700 bg-sky-50" : "text-gray-400 bg-gray-50"} text-xs px-2.5 py-0.5 rounded-md`}>
                        {selectedRoom.hasBalcony ? "Có ban công" : "Không có ban công"}
                      </span>
                    </div>
                    {/* Item 10: Mezzanine */}
                    <div className="flex items-center justify-between py-1 border-b border-gray-50">
                      <span className="text-gray-500">Gác lửng:</span>
                      <span className={`font-semibold ${selectedRoom.hasMezzanine ? "text-amber-700 bg-amber-50" : "text-gray-400 bg-gray-50"} text-xs px-2.5 py-0.5 rounded-md`}>
                        {selectedRoom.hasMezzanine ? "Có gác" : "Không có gác"}
                      </span>
                    </div>
                    {/* Item 11: Furniture */}
                    <div className="flex items-center justify-between py-1 border-b border-gray-50">
                      <span className="text-gray-500">Nội thất:</span>
                      <span className={`font-semibold ${selectedRoom.hasFurniture ? "text-teal-700 bg-teal-50" : "text-gray-400 bg-gray-50"} text-xs px-2.5 py-0.5 rounded-md`}>
                        {selectedRoom.hasFurniture ? "Đầy đủ nội thất" : "Chưa có nội thất"}
                      </span>
                    </div>
                    {/* Item 12: Electricity price */}
                    <div className="flex items-center justify-between py-1 border-b border-gray-50">
                      <span className="text-gray-500">Giá điện tiêu thụ:</span>
                      <span className="font-bold text-blue-700 bg-blue-50 text-xs px-2.5 py-0.5 rounded-md">
                        {selectedRoom.electricityPrice ? `${selectedRoom.electricityPrice.toLocaleString("vi-VN")} đ/kWh` : "Theo giá nhà nước"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Text Description Box */}
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 uppercase tracking-wide">Mô tả thông tin chi tiết</h4>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{selectedRoom.description}</p>
                </div>

                {/* Room Contact Box */}
                <div className="bg-gradient-to-tr from-blue-50 to-indigo-50 border border-blue-100 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-blue-600 text-white font-bold rounded-xl flex items-center justify-center shadow-lg shadow-blue-100 shrink-0">
                      <User className="h-6 w-6" />
                    </div>
                    <div className="text-center sm:text-left">
                      <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider block">Liên hệ chủ phòng</span>
                      <span className="font-extrabold text-gray-900 block">{selectedRoom.contactName || "Chủ nhà trọ uy tín"}</span>
                    </div>
                  </div>
                  {currentUser ? (
                    <a
                      href={`tel:${selectedRoom.contactPhone}`}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm px-6 py-3 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
                    >
                      <Phone className="h-4 w-4 animate-bounce" />
                      <span>{selectedRoom.contactPhone || "0901234567"}</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthModalMode("login");
                        setIsAuthModalOpen(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm px-6 py-3 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
                    >
                      <Phone className="h-4 w-4" />
                      <span>Liên hệ</span>
                    </button>
                  )}
                </div>

                {/* REVIEWS & RATINGS SECTION */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-1.5">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span>Đánh Giá & Nhận Xét ({Array.isArray(selectedRoom.reviews) ? selectedRoom.reviews.length : 0})</span>
                    </h4>

                    {selectedRoom.rating && (
                      <span className="text-xs font-mono font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100 flex items-center gap-1">
                        Sức hút: {selectedRoom.rating.toFixed(1)} / 5 ★
                      </span>
                    )}
                  </div>

                  {/* List of Reviews */}
                  <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                    {Array.isArray(selectedRoom.reviews) && selectedRoom.reviews.length > 0 ? (
                      selectedRoom.reviews.map((rev) => (
                        <div key={rev.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-1.5 animate-fade-in text-xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-lg bg-blue-100 text-blue-800 font-extrabold flex items-center justify-center font-mono text-[10px]">
                                {rev.username ? rev.username.substring(0, 2).toUpperCase() : "TV"}
                              </div>
                              <div>
                                <span className="font-extrabold text-gray-800 block text-xs">{rev.username || "Thành viên"}</span>
                                <span className="text-[9px] text-gray-400 font-mono block">
                                  {new Date(rev.createdAt).toLocaleDateString("vi-VN", {
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  })}
                                </span>
                              </div>
                            </div>

                            {/* Stars rating */}
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`h-3 w-3 ${s <= rev.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-gray-600 pl-9 leading-relaxed whitespace-pre-line text-xs font-medium">
                            {rev.comment}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] text-gray-400 italic py-4 text-center">
                        Căn phòng trọ này chưa nhận được đánh giá nào. Hãy là người đầu tiên trải nghiệm và chia sẻ phản hồi!
                      </p>
                    )}
                  </div>

                  {/* Submission form */}
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 sm:p-5 mt-4 space-y-3">
                    <h5 className="text-xs font-bold text-gray-800 tracking-wide uppercase">Gửi Phản Hồi & Đánh Giá Của Bạn</h5>

                    {currentUser ? (
                      <form onSubmit={handleSubmitReview} className="space-y-3">
                        {/* Interactive stars selection */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 font-medium">Bình chọn:</span>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setNewReviewRating(star)}
                                className="p-0.5 cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                                title={`${star} sao`}
                              >
                                <Star
                                  className={`h-5 w-5 ${star <= newReviewRating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
                                />
                              </button>
                            ))}
                          </div>
                          <span className="text-xs font-extrabold text-amber-600 font-mono">({newReviewRating} / 5)</span>
                        </div>

                        {/* Comment text area */}
                        <div>
                          <textarea
                            rows={2}
                            required
                            placeholder="Môi trường sống sạch sẽ, wifi ổn định không? Thêm chia sẻ trải nghiệm thực tế..."
                            value={newReviewComment}
                            onChange={(e) => setNewReviewComment(e.target.value)}
                            className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 outline-none bg-white focus:border-blue-500 resize-none font-medium text-gray-700"
                          />
                        </div>

                        {submitReviewError && (
                          <div className="text-[11px] text-red-600 font-medium bg-red-50 p-2 rounded-lg border border-red-100">
                            {submitReviewError}
                          </div>
                        )}

                        {submitReviewSuccess && (
                          <div className="text-[11px] text-emerald-600 font-medium bg-emerald-50 p-2 rounded-lg border border-emerald-100 flex items-center gap-1.5 animate-bounce">
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                            <span>Đăng bài đánh giá thành công! Cảm ơn bạn.</span>
                          </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex justify-end">
                          <button
                            type="submit"
                            disabled={submittingReview}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl h-9 flex items-center justify-center transition-all shadow-md disabled:bg-gray-300 disabled:shadow-none cursor-pointer"
                          >
                            {submittingReview ? "Đang gửi..." : "Đăng đánh giá"}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="text-center py-4 px-2 space-y-3">
                        <p className="text-[11px] text-gray-500 leading-normal">
                          Bạn cần đăng ký hoặc đăng nhập làm thành viên để có quyền chấm điểm chất lượng phòng & gửi đánh giá công khai.
                        </p>
                        <div className="flex justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setAuthModalMode("login");
                              setIsAuthModalOpen(true);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-4 py-1.5 rounded-lg transition-all shadow-xs cursor-pointer"
                          >
                            Đăng Nhập
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAuthModalMode("register");
                              setIsAuthModalOpen(true);
                            }}
                            className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-[10px] font-bold px-4 py-1.5 rounded-lg transition-all cursor-pointer"
                          >
                            Đăng Ký
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer closed controls */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-end">
              <button
                onClick={() => setSelectedRoom(null)}
                className="bg-white border border-gray-200 text-gray-700 font-semibold text-xs px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors shadow-xs cursor-pointer"
              >
                Đóng thông tin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADMIN FORM CONTROL MODAL (ADD & EDIT BOARDING ROOM) */}
      {isAdminModalOpen && (
        <div id="admin-form-modal" className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative animate-scale-up max-h-[95vh] flex flex-col justify-between">

            {/* Header section with Dynamic Title */}
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-black text-gray-900">
                  {editingRoom ? "Chỉnh Sửa Thông Tin Phòng Trọ" : "Thêm Phòng Trọ Mới Vào Hệ Thống"}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Nhập đầy đủ thông tin bên dưới để đồng bộ cơ sở dữ liệu.</p>
              </div>
              <button
                onClick={() => setIsAdminModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Main scrollable form elements */}
            <form onSubmit={handleSaveRoom} className="overflow-y-auto flex-1 p-6 custom-scrollbar space-y-5">

              {/* Box 1: Compulsory details */}
              <div className="space-y-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">1. Thông tin bắt buộc</span>

                <div>
                  <label className="text-xs text-gray-700 font-bold block mb-1">Tiêu đề tin đăng phòng *</label>
                  <input
                    type="text"
                    required
                    maxLength={150}
                    placeholder="Ví dụ: Phòng trọ khép kín mới xây dựng CMT8 Quận 10..."
                    value={formFields.title}
                    onChange={(e) => setFormFields(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 outline-none bg-white focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-700 font-bold block mb-1">Giá thuê hàng tháng (VND) *</label>
                    <input
                      type="number"
                      required
                      min={500000}
                      step={50000}
                      placeholder="Ví dụ: 3000000"
                      value={formFields.price}
                      onChange={(e) => setFormFields(prev => ({ ...prev, price: Number(e.target.value) }))}
                      className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 outline-none bg-white focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-700 font-bold block mb-1">Diện tích phòng sử dụng (m²)</label>
                    <input
                      type="number"
                      min={5}
                      max={200}
                      placeholder="Ví dụ: 25"
                      value={formFields.area}
                      onChange={(e) => setFormFields(prev => ({ ...prev, area: Number(e.target.value) }))}
                      className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 outline-none bg-white focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Box 2: Address detailed elements */}
              <div className="space-y-4 pt-3 border-t border-gray-100">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">2. Địa chỉ trọ</span>

                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-gray-700 font-bold block mb-1">TP / Tỉnh *</label>
                    <select
                      value={selectedAdminProvCode}
                      onChange={(e) => {
                        const code = e.target.value;
                        setSelectedAdminProvCode(code);
                        setSelectedAdminDistCode("");
                        const prov = adminProvinces.find(p => String(p.code) === code);
                        setFormFields(prev => ({
                          ...prev,
                          city: prov ? prov.name : "",
                          district: "",
                          ward: ""
                        }));
                      }}
                      className="w-full text-xs border border-gray-200 rounded-xl px-2 py-2.5 outline-none bg-white focus:border-blue-500"
                    >
                      <option value="">-- Chọn Tỉnh/TP --</option>
                      {adminProvinces.map(p => (
                        <option key={p.code} value={p.code}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-700 font-bold block mb-1">Quận / Huyện *</label>
                    <select
                      value={selectedAdminDistCode}
                      disabled={!selectedAdminProvCode}
                      onChange={(e) => {
                        const code = e.target.value;
                        setSelectedAdminDistCode(code);
                        const dist = adminDistricts.find(d => String(d.code) === code);
                        setFormFields(prev => ({
                          ...prev,
                          district: dist ? dist.name : "",
                          ward: ""
                        }));
                      }}
                      className="w-full text-xs border border-gray-200 rounded-xl px-2 py-2.5 outline-none bg-white focus:border-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">-- Chọn Quận/Huyện --</option>
                      {adminDistricts.map(d => (
                        <option key={d.code} value={d.code}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-700 font-bold block mb-1">Phường / Xã *</label>
                    <select
                      value={formFields.ward ? (adminWards.find(w => w.name === formFields.ward)?.code || "") : ""}
                      disabled={!selectedAdminDistCode}
                      onChange={(e) => {
                        const code = e.target.value;
                        const wrd = adminWards.find(w => String(w.code) === code);
                        setFormFields(prev => ({
                          ...prev,
                          ward: wrd ? wrd.name : ""
                        }));
                      }}
                      className="w-full text-xs border border-gray-200 rounded-xl px-2 py-2.5 outline-none bg-white focus:border-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">-- Chọn Phường/Xã --</option>
                      {adminWards.map(w => (
                        <option key={w.code} value={w.code}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-700 font-bold block mb-1">Tên Đường *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Cách Mạng Tháng 8"
                      value={formFields.street}
                      onChange={(e) => setFormFields(prev => ({ ...prev, street: e.target.value }))}
                      className="w-full text-xs border border-gray-200 rounded-xl px-2 py-2.5 outline-none bg-white focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-700 font-bold block mb-1">Địa chỉ chi tiết đầy đủ hiển thị</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 402/12 Cách Mạng Tháng Tám, Phường 12, Quận 10, TP. HCM"
                    value={formFields.addressDetailed}
                    onChange={(e) => setFormFields(prev => ({ ...prev, addressDetailed: e.target.value }))}
                    className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 outline-none bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Box 3: Advanced Options requested filters */}
              <div className="space-y-4 pt-3 border-t border-gray-100">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">3. Tiện nghi & Quy chế phòng trọ</span>

                <div className="grid grid-cols-2 gap-4">
                  {/* Row wifi */}
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-xs text-gray-600 font-semibold">Kết nối Wifi miễn phí</span>
                    <input
                      type="checkbox"
                      checked={formFields.hasWifi}
                      onChange={(e) => setFormFields(prev => ({ ...prev, hasWifi: e.target.checked }))}
                      className="h-4 w-4 accent-blue-600"
                    />
                  </div>

                  {/* Row Shared owner */}
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-xs text-gray-600 font-semibold">Sống chung chủ nhà</span>
                    <input
                      type="checkbox"
                      checked={formFields.isSharedOwner}
                      onChange={(e) => setFormFields(prev => ({ ...prev, isSharedOwner: e.target.checked }))}
                      className="h-4 w-4 accent-blue-600"
                    />
                  </div>

                  {/* Row Water fee type */}
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-xs text-gray-600 font-semibold">Phí nước uống sinh hoạt</span>
                    <select
                      value={formFields.waterFeeType}
                      onChange={(e) => setFormFields(prev => ({ ...prev, waterFeeType: e.target.value as "miễn phí" | "có phí" }))}
                      className="text-xs border border-gray-200 rounded-lg bg-white px-1 py-0.5 outline-none"
                    >
                      <option value="miễn phí">Miễn phí</option>
                      <option value="có phí">Có phí</option>
                    </select>
                  </div>

                  {/* Row Status */}
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-xs text-gray-600 font-semibold">Trạng thái hiện tại</span>
                    <select
                      value={formFields.status}
                      onChange={(e) => setFormFields(prev => ({ ...prev, status: e.target.value as "còn phòng" | "hết phòng" }))}
                      className="text-xs border border-gray-200 rounded-lg bg-white px-1 py-0.5 outline-none"
                    >
                      <option value="còn phòng">Còn phòng</option>
                      <option value="hết phòng">Hết phòng</option>
                    </select>
                  </div>

                  {/* Row Hour restrictions */}
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-xs text-gray-600 font-semibold">Giờ giấc ra vào</span>
                    <select
                      value={formFields.hoursType}
                      onChange={(e) => setFormFields(prev => ({ ...prev, hoursType: e.target.value as "tự do" | "cố định" }))}
                      className="text-xs border border-gray-200 rounded-lg bg-white px-1 py-0.5 outline-none"
                    >
                      <option value="tự do">Tự do</option>
                      <option value="cố định">Cố định</option>
                    </select>
                  </div>

                  {/* Row Build year */}
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-xs text-gray-600 font-semibold">Năm xây dựng (Mới cũ)</span>
                    <input
                      type="number"
                      min={2000}
                      max={2026}
                      value={formFields.buildYear}
                      onChange={(e) => setFormFields(prev => ({ ...prev, buildYear: Number(e.target.value) }))}
                      className="w-16 text-center text-xs border border-gray-200 rounded-lg bg-white outline-none"
                    />
                  </div>

                  {/* Row Parking */}
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-xs text-gray-600 font-semibold">Khu vực để xe riêng</span>
                    <input
                      type="checkbox"
                      checked={formFields.hasParking}
                      onChange={(e) => setFormFields(prev => ({ ...prev, hasParking: e.target.checked }))}
                      className="h-4 w-4 accent-blue-600"
                    />
                  </div>

                  {/* Row Elevator */}
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-xs text-gray-600 font-semibold">Thang máy vận hành</span>
                    <input
                      type="checkbox"
                      checked={formFields.hasElevator}
                      onChange={(e) => setFormFields(prev => ({ ...prev, hasElevator: e.target.checked }))}
                      className="h-4 w-4 accent-blue-600"
                    />
                  </div>

                  {/* Row Balcony */}
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-xs text-gray-600 font-semibold">Có ban công thoáng</span>
                    <input
                      type="checkbox"
                      checked={formFields.hasBalcony}
                      onChange={(e) => setFormFields(prev => ({ ...prev, hasBalcony: e.target.checked }))}
                      className="h-4 w-4 accent-blue-600"
                    />
                  </div>

                  {/* Row Mezzanine */}
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-xs text-gray-600 font-semibold">Gác lửng</span>
                    <input
                      type="checkbox"
                      checked={formFields.hasMezzanine}
                      onChange={(e) => setFormFields(prev => ({ ...prev, hasMezzanine: e.target.checked }))}
                      className="h-4 w-4 accent-blue-600"
                    />
                  </div>

                  {/* Row Furniture */}
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-xs text-gray-600 font-semibold">Đầy đủ nội thất</span>
                    <input
                      type="checkbox"
                      checked={formFields.hasFurniture}
                      onChange={(e) => setFormFields(prev => ({ ...prev, hasFurniture: e.target.checked }))}
                      className="h-4 w-4 accent-blue-600"
                    />
                  </div>

                  {/* Row Electricity Price */}
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-xs text-gray-600 font-semibold">Giá điện (đ/kWh)</span>
                    <input
                      type="number"
                      min={0}
                      placeholder="Ví dụ: 3500"
                      value={formFields.electricityPrice || ""}
                      onChange={(e) => setFormFields(prev => ({ ...prev, electricityPrice: Number(e.target.value) }))}
                      className="w-20 text-center text-xs border border-gray-200 rounded-lg bg-white outline-none py-0.5"
                    />
                  </div>

                  {/* Row Contract */}
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-100 col-span-2">
                    <span className="text-xs text-gray-600 font-semibold">Hợp đồng thuê phòng thỏa thuận ràng buộc</span>
                    <input
                      type="checkbox"
                      checked={formFields.hasContract}
                      onChange={(e) => setFormFields(prev => ({ ...prev, hasContract: e.target.checked }))}
                      className="h-4 w-4 accent-blue-600"
                    />
                  </div>

                  {/* Row People Limit */}
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-100 col-span-2">
                    <span className="text-xs text-gray-600 font-semibold">Giới hạn số người được ở tối đa</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formFields.isPeopleLimited}
                        onChange={(e) => setFormFields(prev => ({ ...prev, isPeopleLimited: e.target.checked }))}
                        className="h-4 w-4 accent-blue-600"
                      />
                      {formFields.isPeopleLimited && (
                        <input
                          type="number"
                          min={1}
                          max={20}
                          placeholder="Người"
                          value={formFields.maxPeople || ""}
                          onChange={(e) => setFormFields(prev => ({ ...prev, maxPeople: Number(e.target.value) }))}
                          className="w-12 text-center text-xs border border-gray-200 rounded-lg bg-white outline-none py-0.5"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Box 4: Additional info & contact metadata */}
              <div className="space-y-4 pt-3 border-t border-gray-100">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">4. Ảnh đại diện & Liên hệ quản lý</span>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-700 font-bold block mb-1">Tên chủ nhà liên hệ</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Anh Hoàng Thư"
                      value={formFields.contactName}
                      onChange={(e) => setFormFields(prev => ({ ...prev, contactName: e.target.value }))}
                      className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 outline-none bg-white focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-700 font-bold block mb-1">Điện thoại liên hệ *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: 0988223344"
                      value={formFields.contactPhone}
                      onChange={(e) => setFormFields(prev => ({ ...prev, contactPhone: e.target.value }))}
                      className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 outline-none bg-white focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-700 font-bold block mb-1">Đường dẫn hình ảnh trực tuyến (URL)</label>
                  <input
                    type="text"
                    placeholder="Đường dẫn https://... (Để trống sẽ lấy ảnh mẫu tự động)"
                    value={formFields.image}
                    onChange={(e) => setFormFields(prev => ({ ...prev, image: e.target.value }))}
                    className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 outline-none bg-white focus:border-blue-500"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Hệ thống chấp nhận các link ảnh Unsplash hoặc CDN bất kỳ.</p>
                </div>

                {/* Section component for multiple secondary images */}
                <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-gray-800 font-bold block">
                      Danh sách nhiều ảnh phòng trọ ({formFields.images?.length || 0} ảnh phụ)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const currentImages = Array.isArray(formFields.images) ? [...formFields.images] : [];
                        setFormFields(prev => ({
                          ...prev,
                          images: [...currentImages, ""]
                        }));
                      }}
                      className="text-blue-600 hover:text-blue-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="h-3 w-3 shrink-0" />
                      <span>Thêm link ảnh mới</span>
                    </button>
                  </div>

                  {Array.isArray(formFields.images) && formFields.images.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                      {formFields.images.map((imgUrl, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          {/* Live preview */}
                          <div className="h-10 w-12 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                            {imgUrl ? (
                              <img src={imgUrl} className="h-full w-full object-cover animate-fade-in" alt="Preview" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-[10px] text-gray-400 font-mono">N/A</div>
                            )}
                          </div>

                          {/* Input field */}
                          <input
                            type="text"
                            placeholder="Nhập URL hình ảnh phụ..."
                            value={imgUrl || ""}
                            onChange={(e) => {
                              const updatedImages = [...formFields.images!];
                              updatedImages[i] = e.target.value;
                              setFormFields(prev => ({
                                ...prev,
                                images: updatedImages
                              }));
                            }}
                            className="flex-1 text-xs border border-gray-200 rounded-xl px-2.5 py-1.5 outline-none bg-white focus:border-blue-500"
                          />

                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => {
                              const updatedImages = formFields.images!.filter((_, idx) => idx !== i);
                              setFormFields(prev => ({
                                ...prev,
                                images: updatedImages
                              }));
                            }}
                            className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                            title="Xóa ảnh này"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-400 italic">
                      Chưa có ảnh phụ nào được thêm. Bạn có thể nhấn nút "Thêm link ảnh mới" bên trên để thêm tối đa hàng loạt ảnh chi tiết căn phòng.
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs text-gray-700 font-bold block mb-1">Mô tả chi tiết phòng trọ</label>
                  <textarea
                    rows={4}
                    placeholder="Mô tả đặc điểm xung quanh phòng, lối đi, bãi đỗ xe hay các tiện ích phụ như máy nước nóng, máy giặt chung..."
                    value={formFields.description}
                    onChange={(e) => setFormFields(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 outline-none bg-white focus:border-blue-500 resize-none"
                  ></textarea>
                </div>

                {/* Rating selection stars */}
                <div>
                  <label className="text-xs text-gray-700 font-bold block mb-1">Xếp hạng uy tín (Đánh giá Sao) - {formFields.rating} sao</label>
                  <div className="flex gap-1.5 items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormFields(prev => ({ ...prev, rating: star }))}
                        className="p-1 cursor-pointer"
                      >
                        <Star className={`h-6 w-6 ${star <= (formFields.rating || 5) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50 -mx-6 -mb-6 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setIsAdminModalOpen(false)}
                  className="bg-white border border-gray-200 text-gray-700 font-semibold text-xs px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors shadow-xs cursor-pointer"
                >
                  Bỏ qua
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Đồng ý lưu thông tin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: AUTHENTICATION MODAL (LOGIN, REGISTER, OTP OVERLAYS) */}
      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          initialMode={authModalMode}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
}
