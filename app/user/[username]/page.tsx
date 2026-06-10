"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Phone, Mail, Share2, ArrowLeft, Loader2, Sparkles, Check, Edit, X, Camera, Trash2, UploadCloud } from "lucide-react";
import { useApp } from "@/context/AppContext";
import RoomCard from "@/components/RoomCard";
import { User, BoardingRoom } from "@/types";

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { viewRoomDetails, currentUser, setCurrentUser } = useApp();
  const usernameParam = params.username as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [rooms, setRooms] = useState<BoardingRoom[]>([]);
  const [copied, setCopied] = useState(false);

  // Profile editing states
  const [isEditing, setIsEditing] = useState(false);
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [editFullname, setEditFullname] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    if (profileUser) {
      setEditEmail(profileUser.email);
      setEditPhone(profileUser.phone);
      setEditAvatar(profileUser.avatar || "");
      setEditFullname(profileUser.fullname || "");
    }
  }, [profileUser]);

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploadingAvatar(true);
    setSaveError(null);
    
    try {
      const formData = new FormData();
      formData.append("file", files[0]);
      
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Lỗi tải ảnh lên.");
      }
      
      setEditAvatar(data.url);
    } catch (err: any) {
      console.error(err);
      setSaveError(err.message || "Không thể tải ảnh đại diện.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileUser || !currentUser) return;
    
    setIsSaving(true);
    setSaveError(null);
    
    try {
      const response = await fetch(`/api/users/${profileUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": currentUser.role,
          "x-user-id": currentUser.id,
        },
        body: JSON.stringify({
          email: editEmail,
          phone: editPhone,
          avatar: editAvatar,
          fullname: editFullname,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Không thể cập nhật thông tin cá nhân.");
      }
      
      if (data.success && data.user) {
        setProfileUser((prev) => prev ? { 
          ...prev, 
          email: data.user.email, 
          phone: data.user.phone, 
          avatar: data.user.avatar,
          fullname: data.user.fullname 
        } : null);
        
        const updatedUser = {
          ...currentUser,
          email: data.user.email,
          phone: data.user.phone,
          avatar: data.user.avatar,
          fullname: data.user.fullname,
        };
        setCurrentUser(updatedUser);
        localStorage.setItem("bestroom_user", JSON.stringify(updatedUser));
        setIsEditing(false);
      }
    } catch (err: any) {
      console.error(err);
      setSaveError(err.message || "Lỗi khi lưu thông tin.");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!usernameParam) return;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const res = await fetch(`/api/users/profile/${encodeURIComponent(usernameParam)}`);
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Không thể tải thông tin cá nhân.");
        }
        
        setProfileUser(data.user);
        setRooms(data.rooms);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Đã xảy ra lỗi.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [usernameParam]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      const shareUrl = window.location.href;
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch((err) => {
          console.error("Failed to copy link:", err);
          alert("Không thể sao chép liên kết. Bạn có thể tự sao chép URL trên thanh địa chỉ.");
        });
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium animate-pulse text-sm">Đang tải hồ sơ chủ trọ...</p>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-6">
        <div className="mx-auto h-16 w-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 border border-red-100">
          <Phone className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-gray-900">Không Tìm Thấy Hồ Sơ</h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            {error || "Tài khoản người dùng này không tồn tại hoặc đã bị gỡ bỏ."}
          </p>
        </div>
        <button
          onClick={() => router.push("/")}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer border-none"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại Trang Chủ
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-8">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors bg-transparent border-none cursor-pointer p-0"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại trang trước
      </button>

      {/* Profile Header Card */}
      <div className="relative bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-xs overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Subtle decorative glow */}
        <div className="absolute right-0 top-0 h-40 w-40 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center gap-4 sm:gap-6">
          {/* Avatar badge */}
          {profileUser.avatar ? (
            <img
              src={profileUser.avatar}
              alt={profileUser.username}
              className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-cover shadow-md shrink-0 border border-gray-100"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xl sm:text-2xl flex items-center justify-center shadow-md select-none shrink-0 font-mono">
              {profileUser.username.substring(0, 2).toUpperCase()}
            </div>
          )}
          
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex flex-col">
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-none">
                  {profileUser.fullname || profileUser.username}
                </h2>
                {profileUser.fullname && (
                  <span className="text-[11px] text-gray-400 font-semibold mt-1">@{profileUser.username}</span>
                )}
              </div>
              <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide rounded-md shadow-2xs ${
                profileUser.role === "admin" 
                  ? "bg-amber-100 text-amber-850" 
                  : "bg-blue-50 text-blue-600"
              }`}>
                {profileUser.role === "admin" ? "Quản trị viên" : "Chủ trọ / Thành viên"}
              </span>
            </div>
            
            <p className="text-xs text-gray-400">
              Thành viên BestRoom đã đăng tải các bài đăng phòng trọ của họ.
            </p>

            {/* Public contacts */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-xs font-semibold">
              <a 
                href={`tel:${profileUser.phone}`}
                className="flex items-center gap-1.5 text-gray-650 hover:text-blue-600 transition-colors"
                title="Gọi điện liên hệ"
              >
                <Phone className="h-4 w-4 text-emerald-500" />
                <span className="font-mono text-sm">{profileUser.phone}</span>
              </a>
              <a 
                href={`mailto:${profileUser.email}`}
                className="flex items-center gap-1.5 text-gray-650 hover:text-blue-600 transition-colors"
                title="Gửi email"
              >
                <Mail className="h-4 w-4 text-blue-500" />
                <span>{profileUser.email}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Actions Button Group */}
        <div className="flex flex-wrap items-center gap-3 self-start md:self-center">
          {currentUser && currentUser.username === profileUser.username && (
            <button
              onClick={() => {
                setEditEmail(profileUser.email);
                setEditPhone(profileUser.phone);
                setEditAvatar(profileUser.avatar || "");
                setEditFullname(profileUser.fullname || "");
                setSaveError(null);
                setIsEditing(true);
              }}
              className="font-extrabold text-xs px-5 py-3 rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:shadow-2xs"
            >
              <Edit className="h-4 w-4 text-blue-600" />
              <span>Chỉnh sửa thông tin</span>
            </button>
          )}

          <button
            onClick={handleCopyLink}
            className={`font-extrabold text-xs px-5 py-3 rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer border ${
              copied 
                ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                : "bg-blue-600 border-transparent text-white hover:bg-blue-700 hover:shadow-md"
            }`}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                <span>Đã sao chép liên kết!</span>
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4" />
                <span>Chia sẻ hồ sơ</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditing && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative animate-scale-up flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-black text-gray-900">
                  Chỉnh Sửa Thông Tin Cá Nhân
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Cập nhật ảnh đại diện, email và số điện thoại liên hệ.</p>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer bg-transparent border-none"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              {/* Avatar Upload Selection */}
              <div className="flex flex-col items-center gap-3 pb-3 border-b border-gray-100">
                <div className="relative group h-20 w-20 rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50 flex items-center justify-center">
                  {isUploadingAvatar ? (
                    <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                  ) : editAvatar ? (
                    <>
                      <img
                        src={editAvatar}
                        alt="Avatar preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity duration-150">
                        <label className="bg-white hover:bg-gray-100 text-gray-800 p-1.5 rounded-lg cursor-pointer shadow-md transition-all flex items-center justify-center">
                          <UploadCloud className="h-4 w-4 text-blue-600" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleUploadAvatar}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setEditAvatar("")}
                          className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all border-none cursor-pointer shadow-md"
                          title="Xoá ảnh"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer select-none">
                      <Camera className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                      <span className="text-[10px] text-gray-400 mt-0.5 group-hover:text-blue-600 transition-colors">Tải ảnh</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadAvatar}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                {editAvatar && (
                  <span className="text-[10px] text-gray-400 font-medium">Đã chọn ảnh đại diện</span>
                )}
              </div>

              {/* Fullname Input */}
              <div>
                <label className="text-xs text-gray-700 font-bold block mb-1">Họ và tên</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={editFullname}
                  onChange={(e) => setEditFullname(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 outline-none bg-white focus:border-blue-500"
                />
              </div>

              {/* Email Input */}
              <div>
                <label className="text-xs text-gray-700 font-bold block mb-1">Địa chỉ Email *</label>
                <input
                  type="email"
                  required
                  placeholder="Ví dụ: name@example.com"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 outline-none bg-white focus:border-blue-500"
                />
              </div>

              {/* Phone Input */}
              <div>
                <label className="text-xs text-gray-700 font-bold block mb-1">Số điện thoại liên hệ *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 0327142982"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 outline-none bg-white focus:border-blue-500 font-mono"
                />
              </div>

              {saveError && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-[10px] font-medium leading-relaxed">
                  ⚠️ {saveError}
                </div>
              )}

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="bg-white border border-gray-200 text-gray-700 font-semibold text-xs px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Huỷ bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isUploadingAvatar}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-5 rounded-xl transition-all shadow-md cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{isSaving ? "Đang lưu..." : "Lưu thay đổi"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Posted rooms segment */}
      <div className="space-y-6">
        <div className="border-b border-gray-150 pb-4">
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Danh Sách Phòng Trọ Đã Đăng ({rooms.length})
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Danh sách tất cả các tin bài đăng cho thuê phòng của thành viên này đang hiển thị.
          </p>
        </div>

        {rooms.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onViewDetails={viewRoomDetails}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center">
            <p className="text-gray-400 text-sm">Chủ trọ này chưa đăng bài phòng trọ nào lên hệ thống hoặc đã cho thuê hết.</p>
          </div>
        )}
      </div>
    </div>
  );
}
