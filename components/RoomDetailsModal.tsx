"use client";

import React, { useState } from "react";
import { Eye, X, ChevronLeft, ChevronRight, MapPin, Star, User, Phone, Check } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { formatVND } from "./RoomCard";
import { roomService } from "@/services/roomService";

export default function RoomDetailsModal() {
  const {
    selectedRoom,
    setSelectedRoom,
    currentUser,
    setRooms,
    setAuthModalMode,
    setIsAuthModalOpen,
  } = useApp();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [submitReviewError, setSubmitReviewError] = useState<string | null>(null);
  const [submitReviewSuccess, setSubmitReviewSuccess] = useState(false);

  if (!selectedRoom) return null;

  const roomImages = Array.isArray(selectedRoom.images) && selectedRoom.images.length > 0
    ? selectedRoom.images
    : [selectedRoom.image || "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80"];

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

      setSubmitReviewSuccess(true);
      setNewReviewComment("");
      setNewReviewRating(5);

      // Reload room details dynamically to sync reviews array
      const updatedRoom = await roomService.getRoom(selectedRoom.id);
      
      // Update both list array and also modal view selection
      setRooms((prev) =>
        prev.map((r) =>
          r.id === selectedRoom.id ? { ...r, rating: updatedRoom.rating, interestedCount: updatedRoom.interestedCount } : r
        )
      );
      setSelectedRoom(updatedRoom);

      setTimeout(() => {
        setSubmitReviewSuccess(false);
      }, 3000);
    } catch (err: any) {
      setSubmitReviewError(err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
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
            className="bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-colors cursor-pointer border-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {/* Feature Image Banner with Dynamic Slide Gallery support */}
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
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-all cursor-pointer shadow-md select-none hover:scale-105 active:scale-95 z-20 border-none"
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
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-all cursor-pointer shadow-md select-none hover:scale-105 active:scale-95 z-20 border-none"
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
                  className={`relative h-14 w-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer bg-transparent p-0 ${idx === activeImageIndex
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

            {/* Facilities List */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 uppercase tracking-wide">Chi Tiết Tiện Nghi & Quy Định Phòng</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div className="flex items-center justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Chung chủ nhà:</span>
                  <span className={`font-semibold ${selectedRoom.isSharedOwner ? "text-amber-700 bg-amber-50" : "text-emerald-700 bg-emerald-50"} text-xs px-2.5 py-0.5 rounded-md`}>
                    {selectedRoom.isSharedOwner ? "Có chung chủ" : "Không chung chủ"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Kết nối Wifi:</span>
                  <span className={`font-semibold ${selectedRoom.hasWifi ? "text-blue-700 bg-blue-50" : "text-gray-400 bg-gray-50"} text-xs px-2.5 py-0.5 rounded-md`}>
                    {selectedRoom.hasWifi ? "Có sẳn Wifi" : "Không cung cấp"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Khoản thu phí nước:</span>
                  <span className="font-bold text-gray-800 text-xs capitalize bg-gray-100 px-2.5 py-0.5 rounded-md">
                    Nước {selectedRoom.waterFeeType}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Giờ giấc ra vào:</span>
                  <span className="font-bold text-indigo-700 bg-indigo-50 text-xs px-2.5 py-0.5 rounded-md capitalize">
                    Giờ {selectedRoom.hoursType}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Chỗ để xe:</span>
                  <span className={`font-semibold ${selectedRoom.hasParking ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"} text-xs px-2.5 py-0.5 rounded-md`}>
                    {selectedRoom.hasParking ? "Có bãi đỗ xe" : "Không có bãi"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Giới hạn số người ở:</span>
                  <span className="font-bold text-gray-800 text-xs">
                    {selectedRoom.isPeopleLimited ? `Tối đa ${selectedRoom.maxPeople || 3} người` : "Không giới hạn"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Thang máy nội khu:</span>
                  <span className={`font-semibold ${selectedRoom.hasElevator ? "text-emerald-700 bg-emerald-50" : "text-gray-400 bg-gray-50"} text-xs px-2.5 py-0.5 rounded-md`}>
                    {selectedRoom.hasElevator ? "Có thang máy" : "Thang bộ"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Cam kết hợp đồng thuê:</span>
                  <span className={`font-semibold ${selectedRoom.hasContract ? "text-emerald-700 bg-emerald-50" : "text-amber-700 bg-amber-50"} text-xs px-2.5 py-0.5 rounded-md`}>
                    {selectedRoom.hasContract ? "Có ký hợp đồng" : "Không bắt buộc"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Ban công:</span>
                  <span className={`font-semibold ${selectedRoom.hasBalcony ? "text-sky-700 bg-sky-50" : "text-gray-400 bg-gray-50"} text-xs px-2.5 py-0.5 rounded-md`}>
                    {selectedRoom.hasBalcony ? "Có ban công" : "Không có ban công"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Gác lửng:</span>
                  <span className={`font-semibold ${selectedRoom.hasMezzanine ? "text-amber-700 bg-amber-50" : "text-gray-400 bg-gray-50"} text-xs px-2.5 py-0.5 rounded-md`}>
                    {selectedRoom.hasMezzanine ? "Có gác" : "Không có gác"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Nội thất:</span>
                  <span className={`font-semibold ${selectedRoom.hasFurniture ? "text-teal-700 bg-teal-50" : "text-gray-400 bg-gray-50"} text-xs px-2.5 py-0.5 rounded-md`}>
                    {selectedRoom.hasFurniture ? "Đầy đủ nội thất" : "Chưa có nội thất"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Giá điện tiêu thụ:</span>
                  <span className="font-bold text-blue-700 bg-blue-50 text-xs px-2.5 py-0.5 rounded-md">
                    {selectedRoom.electricityPrice ? `${selectedRoom.electricityPrice.toLocaleString("vi-VN")} đ/kWh` : "Theo giá nhà nước"}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 uppercase tracking-wide">Mô tả thông tin chi tiết</h4>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{selectedRoom.description}</p>
            </div>

            {/* Contact Box */}
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
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm px-6 py-3 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center border-none"
                >
                  <Phone className="h-4 w-4" />
                  <span>Liên hệ</span>
                </button>
              )}
            </div>

            {/* Reviews Section */}
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

              {/* Reviews List */}
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
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
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

              {/* Add review form */}
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 sm:p-5 mt-4 space-y-3">
                <h5 className="text-xs font-bold text-gray-800 tracking-wide uppercase">Gửi Phản Hồi & Đánh Giá Của Bạn</h5>
                {currentUser ? (
                  <form onSubmit={handleSubmitReview} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-medium">Bình chọn:</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setNewReviewRating(star)}
                            className="p-0.5 cursor-pointer hover:scale-110 active:scale-95 transition-transform bg-transparent border-none"
                            title={`${star} sao`}
                          >
                            <Star className={`h-5 w-5 ${star <= newReviewRating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                          </button>
                        ))}
                      </div>
                      <span className="text-xs font-extrabold text-amber-600 font-mono">({newReviewRating} / 5)</span>
                    </div>

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

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl h-9 flex items-center justify-center transition-all shadow-md disabled:bg-gray-300 disabled:shadow-none cursor-pointer border-none"
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
                        className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-4 py-1.5 rounded-lg transition-all shadow-xs cursor-pointer border-none"
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

        {/* Footer controls */}
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
  );
}
