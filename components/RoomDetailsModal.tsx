"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Bath,
  CalendarDays,
  Camera,
  Car,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Clock,
  Copy,
  Eye,
  Heart,
  Home,
  MapPin,
  MessageCircle,
  Phone,
  Refrigerator,
  Ruler,
  Send,
  Share2,
  ShieldCheck,
  Snowflake,
  Sofa,
  Star,
  User,
  Wifi,
  X,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { roomService } from "@/services/roomService";
import { userService } from "@/services/userService";
import { formatVND } from "./RoomCard";
import { User as AppUser } from "@/types";
import Header from "./Header";
import Footer from "./Footer";
import Breadcrumbs from "./Breadcrumbs";

const fallbackImage = "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=900&q=80";

function phoneHref(phone: string) {
  const normalized = phone.replace(/[^\d+]/g, "");
  return normalized ? `tel:${normalized}` : "#";
}

export default function RoomDetailsModal() {
  const {
    rooms,
    selectedRoom,
    setSelectedRoom,
    currentUser,
    setRooms,
    setAuthModalMode,
    setIsAuthModalOpen,
    isFavoriteRoom,
    toggleFavoriteRoom,
  } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const previousPathname = useRef(pathname);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [submitReviewError, setSubmitReviewError] = useState<string | null>(null);
  const [submitReviewSuccess, setSubmitReviewSuccess] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleMethod, setScheduleMethod] = useState<"phone" | "zalo" | "message">("phone");
  const [scheduleAgreed, setScheduleAgreed] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false);
  const [ownerUser, setOwnerUser] = useState<AppUser | null>(null);
  const [ownerLoading, setOwnerLoading] = useState(false);

  const openAuthModal = (mode: "login" | "register") => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeDetails = () => {
    setSelectedRoom(null);
    if (pathname.startsWith("/rooms/")) {
      router.push("/search");
    }
  };

  useEffect(() => {
    if (previousPathname.current !== pathname) {
      setSelectedRoom(null);
      previousPathname.current = pathname;
    }
  }, [pathname, setSelectedRoom]);

  useEffect(() => {
    let ignore = false;

    const loadOwner = async () => {
      if (!selectedRoom?.ownerId) {
        setOwnerUser(null);
        setOwnerLoading(false);
        return;
      }

      if (!ignore) {
        setOwnerLoading(true);
        setOwnerUser(null);
      }

      try {
        const user = await userService.getUser(selectedRoom.ownerId);
        if (!ignore) {
          setOwnerUser(user);
          setOwnerLoading(false);
        }
      } catch {
        if (!ignore) {
          setOwnerUser(null);
          setOwnerLoading(false);
        }
      }
    };

    loadOwner();
    return () => {
      ignore = true;
    };
  }, [selectedRoom?.ownerId]);

  if (!selectedRoom) return null;

  const roomImages =
    Array.isArray(selectedRoom.images) && selectedRoom.images.length > 0
      ? selectedRoom.images
      : [selectedRoom.image || fallbackImage];

  const address = selectedRoom.addressDetailed || `${selectedRoom.street}, ${selectedRoom.ward}, ${selectedRoom.district}, ${selectedRoom.city}`;
  const districtLabel = [selectedRoom.district, selectedRoom.city].filter(Boolean).join(", ");
  const reviewsCount = Array.isArray(selectedRoom.reviews) ? selectedRoom.reviews.length : 0;
  const ownerName = ownerUser?.fullname || ownerUser?.username || selectedRoom.contactName || "Chủ trọ BestRoom";
  const ownerPhone = ownerUser?.phone || selectedRoom.contactPhone || "";
  const isSaved = isFavoriteRoom(selectedRoom.id);
  const ownerAvatar = ownerUser?.avatar || "";
  const ownerProfileHref = ownerUser?.username ? `/user/${ownerUser.username}` : "#";

  const nextImage = () => setActiveImageIndex((prev) => (prev === roomImages.length - 1 ? 0 : prev + 1));
  const previousImage = () => setActiveImageIndex((prev) => (prev === 0 ? roomImages.length - 1 : prev - 1));

  const openLogin = (mode: "login" | "register" = "login") => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleSubmitReview = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentUser) {
      openLogin("login");
      return;
    }
    if (!newReviewComment.trim()) {
      setSubmitReviewError("Vui lòng điền nội dung đánh giá trước khi đăng.");
      return;
    }

    setSubmittingReview(true);
    setSubmitReviewError(null);
    setSubmitReviewSuccess(false);

    try {
      await roomService.submitReview(selectedRoom.id, {
        userId: currentUser.id,
        username: currentUser.username,
        rating: newReviewRating,
        comment: newReviewComment,
      });

      const updatedRoom = await roomService.getRoom(selectedRoom.id);
      setRooms((prev) =>
        prev.map((room) =>
          room.id === selectedRoom.id
            ? { ...room, rating: updatedRoom.rating, interestedCount: updatedRoom.interestedCount }
            : room
        )
      );
      setSelectedRoom(updatedRoom);
      setNewReviewComment("");
      setNewReviewRating(5);
      setSubmitReviewSuccess(true);
      setTimeout(() => setSubmitReviewSuccess(false), 3000);
    } catch (err: any) {
      setSubmitReviewError(err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleScheduleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!scheduleAgreed) return;

    const formData = new FormData(event.currentTarget);
    setIsSubmittingSchedule(true);
    setScheduleError(null);
    setScheduleSuccess(false);

    try {
      const response = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: selectedRoom.id,
          visitorName: String(formData.get("visitorName") || "").trim(),
          visitorPhone: String(formData.get("visitorPhone") || "").trim(),
          viewingDate: String(formData.get("viewingDate") || ""),
          timeSlot: String(formData.get("timeSlot") || ""),
          contactMethod: scheduleMethod,
          visitorsCount: String(formData.get("visitorsCount") || "1"),
          note: String(formData.get("note") || "").trim(),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Không thể gửi thông tin đặt lịch.");
      }

      setScheduleSuccess(true);
      setTimeout(() => {
        setIsScheduleOpen(false);
        setScheduleSuccess(false);
        setScheduleAgreed(false);
      }, 1800);
    } catch (err: any) {
      setScheduleError(err.message || "Không thể gửi thông tin đặt lịch.");
    } finally {
      setIsSubmittingSchedule(false);
    }
  };

  const overviewItems = [
    ["Diện tích", `${selectedRoom.area} m²`],
    ["Loại hình", selectedRoom.roomType || (selectedRoom.hasMezzanine ? "Có gác lửng" : "Căn hộ mini")],
    ["Tình trạng", selectedRoom.status === "còn phòng" ? "Phòng trống" : "Đã cho thuê"],
    ["Giá điện", selectedRoom.electricityPrice ? `${selectedRoom.electricityPrice.toLocaleString("vi-VN")} đ/kWh` : "Theo giá nhà nước"],
    ["Giá nước", selectedRoom.waterFeeType === "miễn phí" ? "Miễn phí" : "Có phí"],
    ["Tiền cọc", "1 tháng"],
    ["Giới hạn người ở", selectedRoom.isPeopleLimited ? `Tối đa ${selectedRoom.maxPeople || 2} người` : "Không giới hạn"],
    ["Giờ giấc", selectedRoom.hoursType === "tự do" ? "Tự do" : "Cố định"],
    ["Chung chủ nhà", selectedRoom.isSharedOwner ? "Có chung chủ" : "Không chung chủ"],
    ["Kết nối Wifi", selectedRoom.hasWifi ? "Có sẵn Wifi" : "Không cung cấp"],
    ["Chỗ để xe", selectedRoom.hasParking ? `Có (${selectedRoom.parkingFeeType})` : "Không có"],
    ["Thang máy", selectedRoom.hasElevator ? "Có thang máy" : "Thang bộ"],
    ["Hợp đồng thuê", selectedRoom.hasContract ? "Có ký hợp đồng" : "Không bắt buộc"],
    ["Nội thất", selectedRoom.hasFurniture ? "Đầy đủ nội thất" : "Nội thất cơ bản/Chưa có"],
    ["Máy lạnh", selectedRoom.hasAirConditioner ? "Có máy lạnh" : "Không có"],
    ["Ban công", selectedRoom.hasBalcony ? "Có ban công" : "Không có"],
    ["Gác lửng", selectedRoom.hasMezzanine ? "Có gác lửng" : "Không có"],
  ];

  const amenities = [
    { icon: Snowflake, label: "Máy lạnh", enabled: selectedRoom.hasAirConditioner },
    { icon: CircleDot, label: "Nóng lạnh", enabled: true },
    { icon: Refrigerator, label: "Tủ lạnh", enabled: selectedRoom.hasFurniture },
    { icon: Copy, label: "Máy giặt chung", enabled: true },
    { icon: Sofa, label: "Bàn làm việc", enabled: selectedRoom.hasFurniture },
    { icon: Home, label: "Ban công", enabled: selectedRoom.hasBalcony },
    { icon: Home, label: "Thang máy", enabled: selectedRoom.hasElevator },
    { icon: ShieldCheck, label: "Hệ thống PCCC", enabled: true },
    { icon: CircleDot, label: "Khóa vân tay", enabled: true },
  ];

  const relatedRooms = rooms.filter((room) => room.id !== selectedRoom.id).slice(0, 6);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white">
      <Header
        onLoginClick={() => openAuthModal("login")}
        onRegisterClick={() => openAuthModal("register")}
      />

      <div className="min-h-screen bg-[#f8fbff] text-blue-950">
        <Breadcrumbs
          items={[
            { label: "Trang chủ", href: "/" },
            { label: "Tìm phòng", href: "/search" },
            { label: "Chi tiết phòng" },
          ]}
        />

        {/* <div className="sticky top-0 z-30 border-b border-blue-100 bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 text-sm font-bold text-blue-600">
              <button type="button" onClick={closeDetails} className="hover:text-blue-800">
                Trang chủ
              </button>
              <ChevronRight className="h-4 w-4 text-slate-400" />
              <span>Tìm phòng</span>
              <ChevronRight className="h-4 w-4 text-slate-400" />
              <span className="text-slate-700">Chi tiết phòng</span>
            </div>
            <button
              id="close-details-modal"
              type="button"
              onClick={closeDetails}
              className="grid h-10 w-10 place-items-center rounded-full border border-blue-100 bg-white text-blue-950 shadow-sm transition hover:bg-blue-50"
              aria-label="Đóng chi tiết phòng"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div> */}

        <div className="mx-auto grid max-w-[1200px] gap-8 px-4 pb-8 sm:px-6 lg:grid-cols-[1fr_320px] lg:px-8">
          <main className="min-w-0">
            <section>
              <div>
                <div className="relative overflow-hidden rounded-lg bg-slate-100 shadow-sm">
                  <img
                    src={roomImages[activeImageIndex] || fallbackImage}
                    alt={`${selectedRoom.title} - ảnh ${activeImageIndex + 1}`}
                    className="h-[360px] w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute right-4 top-4 flex gap-2">
                    <IconButton
                      icon={Heart}
                      label={isSaved ? "Bỏ lưu tin" : "Lưu tin"}
                      active={isSaved}
                      onClick={() => toggleFavoriteRoom(selectedRoom)}
                    />
                    {/* <IconButton icon={Share2} label="Chia sẻ" /> */}
                  </div>
                  {roomImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={previousImage}
                        className="absolute left-4 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white text-blue-950 shadow-md transition hover:bg-blue-50"
                        aria-label="Ảnh trước"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white text-blue-950 shadow-md transition hover:bg-blue-50"
                        aria-label="Ảnh sau"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>

                <div className="mt-3 grid grid-cols-6 gap-2">
                  {roomImages.slice(0, 6).map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() => setActiveImageIndex(index)}
                      className={`relative h-16 overflow-hidden rounded-md border-2 bg-white p-0 transition ${
                        activeImageIndex === index ? "border-blue-600" : "border-transparent hover:border-blue-200"
                      }`}
                    >
                      <img src={image} alt={`Ảnh phòng ${index + 1}`} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      {index === 5 && roomImages.length > 6 && (
                        <span className="absolute inset-0 grid place-items-center bg-slate-950/55 text-xs font-black text-white">
                          <Camera className="mr-1 inline h-4 w-4" />
                          +{roomImages.length - 5}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="mt-5 w-full text-left">
                  <span className="inline-flex rounded bg-blue-600 px-3 py-1 text-xs font-black uppercase text-white">
                    Cho thuê
                  </span>
                  <h1 className="mt-4 text-3xl font-black leading-tight text-blue-950">
                    {selectedRoom.title}
                  </h1>
                  <p className="mt-4 text-3xl font-black text-blue-600">{formatVND(selectedRoom.price)}</p>
                  <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-600">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    {districtLabel || selectedRoom.city}
                  </div>
                </div>
              </div>
            </section>

            <nav className="mt-5 flex gap-2 overflow-x-auto border-b border-blue-100">
              {[
                ["overview", Home, "Tổng quan"],
                ["description", Copy, "Mô tả"],
                // ["amenities", Share2, "Tiện ích"],
                ["location", MapPin, "Đánh giá"],
                ["related", Camera, "Tin liên quan"],
              ].map(([id, Icon, label]) => (
                <button
                  key={id as string}
                  type="button"
                  onClick={() => setActiveTab(id as string)}
                  className={`flex min-w-max items-center gap-2 border-b-2 px-4 py-3 text-sm font-black transition ${
                    activeTab === id
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-600 hover:text-blue-600"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label as string}
                </button>
              ))}
            </nav>

            <div className="mt-3">
              {activeTab === "overview" && (
                <Panel title="Tiện nghi & Quy định">
                  <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                    {overviewItems.map(([label, value]) => (
                      <InfoBullet key={label} label={label} value={value} />
                    ))}
                  </div>
                </Panel>
              )}

              {activeTab === "amenities" && (
                <Panel title="Tiện ích">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {amenities.map((item) => (
                      <div key={item.label} className={`flex items-center gap-2 text-sm font-bold ${item.enabled ? "text-blue-950" : "text-slate-400"}`}>
                        <item.icon className={`h-5 w-5 ${item.enabled ? "text-blue-600" : "text-slate-300"}`} />
                        {item.label}
                      </div>
                    ))}
                  </div>
                </Panel>
              )}

              {activeTab === "description" && (
                <Panel title="Mô tả chi tiết">
                  <p className="whitespace-pre-line text-sm font-semibold leading-7 text-slate-700">
                    {selectedRoom.description ||
                      "Căn hộ mini mới xây, thiết kế hiện đại, đầy đủ nội thất cơ bản. Khu vực an ninh, yên tĩnh, thuận tiện di chuyển đến trung tâm."}
                  </p>
                </Panel>
              )}

              {/* {activeTab === "location" && (
                <Panel title="Vị trí">
                  <div className="grid gap-5 md:grid-cols-[0.55fr_1fr]">
                    <div className="relative h-28 overflow-hidden rounded-lg bg-blue-50">
                      <img
                        src="https://images.unsplash.com/photo-1569336415962-a4bd9f69c07b?auto=format&fit=crop&w=500&q=80"
                        alt="Bản đồ khu vực phòng"
                        className="h-full w-full object-cover opacity-85"
                        referrerPolicy="no-referrer"
                      />
                      <MapPin className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 fill-blue-600 text-blue-600 drop-shadow" />
                    </div>
                    <div className="flex flex-col justify-center gap-2 text-sm font-semibold text-slate-700">
                      <p><strong className="text-blue-950">Địa chỉ:</strong> {address}</p>
                      <p>Cách cầu Sài Gòn: 1 km</p>
                      <p>Cách Landmark 81: 1.5 km</p>
                      <p>Cách chợ Bà Chiểu: 700 m</p>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex w-fit items-center rounded-md border border-blue-500 px-5 py-2 text-xs font-black text-blue-600 hover:bg-blue-50"
                      >
                        Xem trên Google Maps
                      </a>
                    </div>
                  </div>
                </Panel>
              )} */}

              {activeTab === "related" && (
                <section>
                  <h2 className="mb-3 text-lg font-black text-blue-950">Tin đăng liên quan</h2>
                  <div className="grid gap-3 md:grid-cols-3">
                    {relatedRooms.map((room) => (
                      <article key={room.id} className="overflow-hidden rounded-lg border border-blue-100 bg-white shadow-sm">
                        <div className="flex gap-3 p-2">
                          <img src={room.image || room.images?.[0] || fallbackImage} alt={room.title} className="h-20 w-24 shrink-0 rounded-md object-cover" referrerPolicy="no-referrer" />
                          <div className="min-w-0 flex-1">
                            <h3 className="line-clamp-2 text-xs font-black text-blue-950">{room.title}</h3>
                            <p className="mt-1 text-sm font-black text-blue-600">{formatVND(room.price)}</p>
                            <p className="mt-1 text-[11px] font-semibold text-slate-500">{room.area} m² · {districtLabel || selectedRoom.city}</p>
                          </div>
                          <Heart className="h-4 w-4 shrink-0 text-slate-400" />
                        </div>
                      </article>
                    ))}
                  </div>
                  <button className="mx-auto mt-3 flex h-8 items-center justify-center gap-2 rounded-md border border-blue-500 px-8 text-xs font-black text-blue-600 hover:bg-blue-50">
                    Xem thêm tin đăng tương tự
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </section>
              )}
            </div>

            <section className="mt-5 rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-black text-blue-950">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                  Đánh giá & nhận xét ({reviewsCount})
                </h2>
                <span className="rounded-md bg-amber-50 px-3 py-1 text-xs font-black text-amber-600">
                  {selectedRoom.rating?.toFixed(1) || "0.0"}
                </span>
              </div>

              <div className="max-h-60 space-y-3 overflow-y-auto pr-1">
                {Array.isArray(selectedRoom.reviews) && selectedRoom.reviews.length > 0 ? (
                  selectedRoom.reviews.map((review) => (
                    <div key={review.id} className="rounded-lg bg-slate-50 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 place-items-center rounded-full bg-blue-100 text-xs font-black text-blue-700">
                            {review.username?.slice(0, 2).toUpperCase() || "TV"}
                          </div>
                          <div>
                            <p className="text-sm font-black text-blue-950">{review.username || "Thành viên"}</p>
                            <p className="text-xs font-medium text-slate-400">{new Date(review.createdAt).toLocaleDateString("vi-VN")}</p>
                          </div>
                        </div>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className={`h-4 w-4 ${star <= review.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                          ))}
                        </div>
                      </div>
                      <p className="mt-3 text-sm font-medium leading-6 text-slate-600">{review.comment}</p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-lg bg-slate-50 p-4 text-center text-sm font-semibold text-slate-400">
                    Phòng này chưa có đánh giá. Hãy là người đầu tiên chia sẻ trải nghiệm.
                  </p>
                )}
              </div>

              {currentUser ? (
                <form onSubmit={handleSubmitReview} className="mt-4 rounded-lg bg-slate-50 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-sm font-black text-blue-950">Bình chọn:</span>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" onClick={() => setNewReviewRating(star)} className="p-0.5">
                        <Star className={`h-5 w-5 ${star <= newReviewRating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={3}
                    value={newReviewComment}
                    onChange={(event) => setNewReviewComment(event.target.value)}
                    placeholder="Chia sẻ trải nghiệm thực tế của bạn..."
                    className="w-full resize-none rounded-lg border border-blue-100 bg-white p-3 text-sm font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                  {submitReviewError && <p className="mt-2 text-sm font-bold text-red-600">{submitReviewError}</p>}
                  {submitReviewSuccess && <p className="mt-2 text-sm font-bold text-emerald-600">Đăng đánh giá thành công.</p>}
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="mt-3 inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-black text-white hover:bg-blue-700 disabled:bg-slate-300"
                  >
                    {submittingReview ? "Đang gửi..." : "Đăng đánh giá"}
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              ) : (
                <div className="mt-4 rounded-lg bg-blue-50 p-4 text-center">
                  <p className="text-sm font-semibold text-blue-950">Đăng nhập để gửi đánh giá và lưu tin phòng này.</p>
                  <button onClick={() => openLogin("login")} className="mt-3 rounded-lg bg-blue-600 px-5 py-2 text-sm font-black text-white hover:bg-blue-700">
                    Đăng nhập
                  </button>
                </div>
              )}
            </section>
          </main>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <SidebarCard>
              <h2 className="text-lg font-black text-blue-950">Thông tin liên hệ</h2>
              {ownerLoading ? (
                <div className="mt-5 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-blue-100/70" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 w-36 rounded-full bg-slate-200" />
                      <div className="h-3 w-24 rounded-full bg-slate-100" />
                    </div>
                  </div>
                  <div className="mt-5 space-y-3">
                    <div className="h-11 rounded-lg bg-blue-100/70" />
                    <div className="mx-auto h-4 w-32 rounded-full bg-slate-100" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="mt-5 flex items-center gap-4">
                    <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-blue-100">
                      {ownerAvatar ? (
                        <img src={ownerAvatar} alt={ownerName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <User className="h-8 w-8 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="flex items-center gap-2 text-sm font-black text-blue-950">
                        {ownerName}
                        <ShieldCheck className="h-4 w-4 fill-blue-600 text-blue-600" />
                      </p>
                      <p className="mt-2 text-xs font-semibold text-slate-500">Đã tham gia 2 năm</p>
                    </div>
                  </div>
                  <div className="mt-5 space-y-3">
                    {currentUser ? (
                      <a href={phoneHref(ownerPhone)} className="flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-black text-white hover:bg-blue-700">
                        <Phone className="h-4 w-4" />
                        Gọi ngay
                      </a>
                    ) : (
                      <button onClick={() => openLogin("login")} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-black text-white hover:bg-blue-700">
                        <Phone className="h-4 w-4" />
                        Gọi ngay
                      </button>
                    )}
                    <a href={ownerProfileHref} className="mx-auto flex w-fit items-center gap-2 text-sm font-black text-blue-600 hover:text-blue-800">
                      Xem trang cá nhân
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  </div>
                </>
              )}
            </SidebarCard>

            <SidebarCard>
              <h2 className="text-base font-black text-blue-950">{selectedRoom.title}</h2>
              <p className="mt-2 text-2xl font-black text-blue-600">{formatVND(selectedRoom.price)}</p>
              <div className="mt-5 space-y-3 text-sm font-semibold text-slate-600">
                <SummaryRow label="Diện tích" value={`${selectedRoom.area} m²`} />
                <SummaryRow label="Phòng tắm" value="1 WC riêng" />
                <SummaryRow label="Nội thất" value={selectedRoom.hasFurniture ? "Đầy đủ" : "Cơ bản"} />
                <SummaryRow label="Vị trí" value={districtLabel || selectedRoom.city} />
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleOpen(true)}
                className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#ffbd00] text-sm font-black text-blue-950 shadow-sm hover:bg-[#f2b200]"
              >
                <CalendarDays className="h-4 w-4" />
                Đặt lịch xem phòng
              </button>
              <button
                type="button"
                onClick={() => toggleFavoriteRoom(selectedRoom)}
                className={`mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-lg border text-sm font-black transition ${
                  isSaved
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-blue-500 text-blue-600 hover:bg-blue-50"
                }`}
              >
                <Heart className={`h-4 w-4 ${isSaved ? "fill-blue-600 text-blue-600" : ""}`} />
                {isSaved ? "Đã lưu tin" : "Lưu tin"}
              </button>
            </SidebarCard>

            <SidebarCard>
              <h2 className="flex items-center gap-2 text-base font-black text-blue-950">
                <ShieldCheck className="h-5 w-5 fill-blue-600 text-blue-600" />
                An toàn khi thuê trọ với BestRoom
              </h2>
              <ul className="mt-4 space-y-3 text-sm font-semibold text-slate-600">
                <li className="flex gap-2"><Check className="h-4 w-4 text-emerald-600" />Xác minh thông tin chủ trọ</li>
                <li className="flex gap-2"><Check className="h-4 w-4 text-emerald-600" />Kiểm duyệt tin đăng chặt chẽ</li>
                <li className="flex gap-2"><Check className="h-4 w-4 text-emerald-600" />Bảo mật thông tin người dùng</li>
              </ul>
              <button className="mt-4 flex items-center gap-2 text-sm font-black text-blue-600">
                Tìm hiểu thêm
                <ArrowRight className="h-4 w-4" />
              </button>
            </SidebarCard>

            {/* <SidebarCard>
              <h2 className="flex items-center gap-2 text-base font-black text-blue-950">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Báo cáo tin đăng
              </h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                Nếu bạn thấy tin đăng có nội dung không chính xác hoặc vi phạm, vui lòng báo cáo để chúng tôi kiểm tra và xử lý.
              </p>
              <button className="mt-4 flex items-center gap-2 text-sm font-black text-blue-600">
                Báo cáo ngay
                <ArrowRight className="h-4 w-4" />
              </button>
            </SidebarCard> */}
          </aside>
        </div>
      </div>

      <Footer />

      {isScheduleOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm">
          <div className="relative grid w-full max-w-3xl overflow-hidden rounded-xl border border-blue-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)] md:grid-cols-[1.1fr_0.7fr]">
            <button
              type="button"
              onClick={() => setIsScheduleOpen(false)}
              className="absolute right-4 top-4 z-10 text-slate-400 transition hover:text-blue-950"
              aria-label="Đóng form đặt lịch"
            >
              <X className="h-4 w-4" />
            </button>

            <form onSubmit={handleScheduleSubmit} className="p-5">
              <div className="mb-4 flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-100">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-blue-950">Đặt lịch xem phòng</h2>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    Kết nối với môi giới để hẹn lịch xem phòng phù hợp với bạn
                  </p>
                </div>
              </div>

              <div className="grid gap-3">
                <ScheduleField
                  icon={User}
                  name="visitorName"
                  label="Họ và tên"
                  required
                  placeholder="Nhập họ và tên của bạn"
                  defaultValue={currentUser?.fullname || currentUser?.username || ""}
                />
                <ScheduleField
                  icon={Phone}
                  name="visitorPhone"
                  label="Số điện thoại"
                  required
                  type="tel"
                  placeholder="Nhập số điện thoại của bạn"
                  defaultValue={currentUser?.phone || ""}
                />

                <div className="grid gap-3 sm:grid-cols-2">
                  <ScheduleField icon={CalendarDays} name="viewingDate" label="Ngày xem phòng" required type="date" placeholder="Chọn ngày xem phòng" />
                  <label>
                    <span className="mb-1.5 block text-xs font-black text-blue-950">
                      Khung giờ mong muốn <span className="text-red-500">*</span>
                    </span>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <select
                        name="timeSlot"
                        required
                        defaultValue=""
                        className="h-9 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs font-semibold text-slate-600 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      >
                        <option value="" disabled>Chọn khung giờ</option>
                        <option value="morning">08:00 - 10:00</option>
                        <option value="noon">10:00 - 12:00</option>
                        <option value="afternoon">14:00 - 16:00</option>
                        <option value="evening">18:00 - 20:00</option>
                      </select>
                    </div>
                  </label>
                </div>

                <div>
                  <span className="mb-1.5 block text-xs font-black text-blue-950">
                    Hình thức liên hệ <span className="text-red-500">*</span>
                  </span>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      ["phone", Phone, "Gọi điện"],
                      ["zalo", MessageCircle, "Zalo"],
                      ["message", MessageCircle, "Nhắn tin"],
                    ].map(([id, Icon, label]) => (
                      <button
                        key={id as string}
                        type="button"
                        onClick={() => setScheduleMethod(id as "phone" | "zalo" | "message")}
                        className={`flex h-9 items-center justify-center gap-1.5 rounded-lg border text-xs font-black transition ${
                          scheduleMethod === id
                            ? "border-blue-600 bg-blue-50 text-blue-600"
                            : "border-slate-200 bg-white text-slate-600 hover:border-blue-200"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {label as string}
                      </button>
                    ))}
                  </div>
                </div>

                <label>
                  <span className="mb-1.5 block text-xs font-black text-blue-950">
                    Số người đi xem <span className="text-red-500">*</span>
                  </span>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <select
                      name="visitorsCount"
                      required
                      defaultValue="1"
                      className="h-9 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs font-semibold text-slate-600 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    >
                      <option value="1">1 người</option>
                      <option value="2">2 người</option>
                      <option value="3">3 người</option>
                      <option value="4">4 người</option>
                    </select>
                  </div>
                </label>

                <label>
                  <span className="mb-1.5 block text-xs font-black text-blue-950">Ghi chú</span>
                  <div className="relative">
                    <Copy className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                    <textarea
                      name="note"
                      maxLength={200}
                      rows={3}
                      placeholder="Ví dụ: Tôi muốn xem phòng sau giờ làm..."
                      className="w-full resize-none rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs font-semibold text-slate-600 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                    <span className="absolute bottom-2 right-3 text-[11px] font-semibold text-slate-400">0/200</span>
                  </div>
                </label>

                <label className="flex cursor-pointer items-start gap-2.5 text-xs font-semibold text-slate-600">
                  <input
                    type="checkbox"
                    required
                    checked={scheduleAgreed}
                    onChange={(event) => setScheduleAgreed(event.target.checked)}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-blue-600"
                  />
                  <span>
                    Tôi đồng ý để môi giới liên hệ xác nhận lịch hẹn <span className="text-red-500">*</span>
                  </span>
                </label>

                {scheduleSuccess && (
                  <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-2.5 text-xs font-black text-emerald-700">
                    Đặt lịch thành công. Thông tin đã được gửi đến email người đăng tin.
                  </div>
                )}
                {scheduleError && (
                  <div className="rounded-lg border border-red-100 bg-red-50 p-2.5 text-xs font-black text-red-600">
                    {scheduleError}
                  </div>
                )}
              </div>

              <div className="mt-5 flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsScheduleOpen(false)}
                  className="h-9 rounded-lg border border-slate-300 px-8 text-xs font-black text-blue-950 transition hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSchedule}
                  className="flex h-9 items-center justify-center gap-2 rounded-lg border-2 border-blue-950 bg-[#ffbd00] px-7 text-xs font-black text-blue-950 transition hover:bg-[#f2b200] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  {isSubmittingSchedule ? "Đang gửi..." : "Đặt lịch xem phòng"}
                </button>
              </div>
            </form>

            <aside className="hidden border-l border-blue-100 bg-white p-5 md:block">
              <div className="rounded-xl border border-blue-100 p-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-full bg-blue-100">
                    {ownerAvatar ? (
                      <img src={ownerAvatar} alt={ownerName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User className="h-6 w-6 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-black text-blue-950">{ownerName}</p>
                    <span className="mt-1 inline-flex rounded bg-amber-100 px-2 py-1 text-[11px] font-black text-amber-700">
                      Môi giới uy tín
                    </span>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 divide-x divide-blue-100 border-y border-blue-100 py-2.5 text-center">
                  <div>
                    <p className="text-xs font-black text-blue-950">98%</p>
                    <p className="text-[11px] font-semibold text-slate-500">Phản hồi</p>
                  </div>
                  <div>
                    <p className="text-xs font-black text-blue-950">Trong vài phút</p>
                    <p className="text-[11px] font-semibold text-slate-500">Thời gian phản hồi</p>
                  </div>
                </div>

                <img
                  src={roomImages[0] || fallbackImage}
                  alt={selectedRoom.title}
                  className="mt-3 h-32 w-full rounded-lg object-cover"
                  referrerPolicy="no-referrer"
                />
                <h3 className="mt-3 line-clamp-2 text-sm font-black text-blue-950">{selectedRoom.title}</h3>
                <p className="mt-1.5 text-lg font-black text-blue-600">{formatVND(selectedRoom.price)}</p>
                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  {districtLabel || selectedRoom.city}
                </p>
                <div className="mt-3 grid grid-cols-3 gap-1.5 text-[10px] font-semibold text-slate-600">
                  <span className="flex items-center gap-1"><Ruler className="h-4 w-4 text-blue-600" />{selectedRoom.area} m²</span>
                  <span className="flex items-center gap-1"><Bath className="h-4 w-4 text-blue-600" />WC riêng</span>
                  <span className="flex items-center gap-1"><Snowflake className="h-4 w-4 text-blue-600" />Máy lạnh</span>
                </div>
                <div className="mt-4 rounded-lg bg-blue-50 p-3 text-xs font-semibold leading-5 text-blue-800">
                  Lịch hẹn sẽ được xác nhận qua điện thoại hoặc Zalo trong vòng <strong>15 phút</strong>.
                </div>
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}

function ScheduleField({
  icon: Icon,
  name,
  label,
  required,
  placeholder,
  type = "text",
  defaultValue = "",
}: {
  icon: React.ElementType;
  name: string;
  label: string;
  required?: boolean;
  placeholder: string;
  type?: string;
  defaultValue?: string;
}) {
  return (
    <label>
      <span className="mb-1.5 block text-xs font-black text-blue-950">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          name={name}
          type={type}
          required={required}
          placeholder={placeholder}
          defaultValue={defaultValue}
          className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs font-semibold text-slate-600 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />
      </div>
    </label>
  );
}

function IconButton({
  icon: Icon,
  label,
  active = false,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`grid h-10 w-10 place-items-center rounded-lg bg-white shadow-md transition hover:bg-blue-50 ${
        active ? "text-blue-600" : "text-blue-950"
      }`}
    >
      <Icon className={`h-5 w-5 ${active ? "fill-blue-600" : ""}`} />
    </button>
  );
}

function Panel({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-blue-100 bg-white p-5 shadow-sm ${className}`}>
      <h2 className="mb-4 text-lg font-black text-blue-950">{title}</h2>
      {children}
    </section>
  );
}

function SidebarCard({ children }: { children: React.ReactNode }) {
  return <section className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">{children}</section>;
}

function InfoBullet({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 text-sm font-semibold text-slate-700">
      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600 shadow-[0_0_0_3px_rgba(37,99,235,0.12)]" />
      <span>
        {label}: <strong className="font-black text-blue-950">{value}</strong>
      </span>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span>{label}</span>
      <strong className="text-right font-black text-blue-950">{value}</strong>
    </div>
  );
}
