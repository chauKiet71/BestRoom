"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, Plus, Trash2, X, ArrowRight, Star, UploadCloud, Loader2, Share2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { BoardingRoom } from "@/types";
import { roomService } from "@/services/roomService";
import { userService } from "@/services/userService";
import RoomCard from "@/components/RoomCard";

const cleanName = (name: string): string => {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/^(thành phố|tỉnh|quận|huyện|phường|xã|đường|thành phố hồ chí minh|tp\.? hcm|tp\.? hồ chí minh)\s+/g, "")
    .replace(/\s+/g, "")
    .trim();
};

export default function AdminPage() {
  const {
    currentUser,
    setAuthModalMode,
    setIsAuthModalOpen,
    rooms,
    setRooms,
    loading,
    viewRoomDetails,
  } = useApp();

  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<BoardingRoom | null>(null);

  // States for Cloudinary image uploading
  const [isUploadingMain, setIsUploadingMain] = useState(false);
  const [uploadMainError, setUploadMainError] = useState("");
  const [isUploadingSub, setIsUploadingSub] = useState(false);
  const [uploadSubError, setUploadSubError] = useState("");
  const [showManualUrlInput, setShowManualUrlInput] = useState(false);
  const [showManualUrlsInput, setShowManualUrlsInput] = useState(false);

  // States for user management dashboard
  const [activeTab, setActiveTab] = useState<"rooms" | "users">("rooms");
  const [usersList, setUsersList] = useState<any[]>([]);
  const [selectedOwnerFilter, setSelectedOwnerFilter] = useState<string>("all");
  const [isUsersLoading, setIsUsersLoading] = useState(false);


  // Admin form address dropdowns API states
  const [adminProvinces, setAdminProvinces] = useState<any[]>([]);
  const [adminDistricts, setAdminDistricts] = useState<any[]>([]);
  const [adminWards, setAdminWards] = useState<any[]>([]);
  const [selectedAdminProvCode, setSelectedAdminProvCode] = useState<string>("");
  const [selectedAdminDistCode, setSelectedAdminDistCode] = useState<string>("");

  useEffect(() => {
    if (isAdminModalOpen) {
      fetch("https://provinces.open-api.vn/api/p/")
        .then((res) => res.json())
        .then((data) => {
          setAdminProvinces(data);
          if (editingRoom) {
            const foundProv = data.find(
              (p: any) =>
                cleanName(p.name).includes(cleanName(editingRoom.city)) ||
                cleanName(editingRoom.city).includes(cleanName(p.name))
            );
            if (foundProv) {
              setSelectedAdminProvCode(String(foundProv.code));
            }
          }
        })
        .catch((err) => console.error("Error admin fetching provinces:", err));
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
      .then((res) => res.json())
      .then((data) => {
        const dists = data.districts || [];
        setAdminDistricts(dists);
        if (editingRoom) {
          const foundDist = dists.find(
            (d: any) =>
              cleanName(d.name).includes(cleanName(editingRoom.district)) ||
              cleanName(editingRoom.district).includes(cleanName(d.name))
          );
          if (foundDist) {
            setSelectedAdminDistCode(String(foundDist.code));
          }
        }
      })
      .catch((err) => console.error("Error admin fetching districts:", err));
  }, [selectedAdminProvCode, editingRoom]);

  useEffect(() => {
    if (!selectedAdminDistCode) {
      setAdminWards([]);
      return;
    }
    fetch(`https://provinces.open-api.vn/api/d/${selectedAdminDistCode}?depth=2`)
      .then((res) => res.json())
      .then((data) => {
        setAdminWards(data.wards || []);
      })
      .catch((err) => console.error("Error admin fetching wards:", err));
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
    rating: 0,
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
    hasAirConditioner: false,
    electricityPrice: 3500,
  });

  // Handlers for Cloudinary image uploading
  const handleUploadMainImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingMain(true);
    setUploadMainError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.code === "MISSING_CONFIG") {
          throw new Error("Cloudinary chưa được cấu hình ở tệp .env. Vui lòng bật ô nhập URL trực tiếp.");
        }
        throw new Error(data.error || "Lỗi tải ảnh lên.");
      }

      setFormFields((prev) => ({ ...prev, image: data.url }));
    } catch (err: any) {
      console.error(err);
      setUploadMainError(err.message || "Tải ảnh thất bại.");
    } finally {
      setIsUploadingMain(false);
    }
  };

  const handleUploadSubImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingSub(true);
    setUploadSubError("");

    try {
      const promises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          if (data.code === "MISSING_CONFIG") {
            throw new Error("Cloudinary chưa được cấu hình ở tệp .env. Vui lòng bật ô nhập URL trực tiếp.");
          }
          throw new Error(data.error || `Lỗi tải ảnh ${file.name}`);
        }
        return data.url;
      });

      const urls = await Promise.all(promises);
      
      setFormFields((prev) => {
        const current = prev.images || [];
        return {
          ...prev,
          images: [...current, ...urls]
        };
      });
    } catch (err: any) {
      console.error(err);
      setUploadSubError(err.message || "Tải danh sách ảnh thất bại.");
    } finally {
      setIsUploadingSub(false);
    }
  };

  // Admin effects for user management loading
  useEffect(() => {
    if (currentUser?.role === "admin" && isAdminModalOpen === false) {
      setIsUsersLoading(true);
      userService.getUsers(currentUser.role, currentUser.id)
        .then((data) => {
          setUsersList(data);
        })
        .catch((err) => {
          console.error("Error fetching users:", err);
        })
        .finally(() => {
          setIsUsersLoading(false);
        });
    }
  }, [currentUser, isAdminModalOpen]);

  const handleToggleUserRole = async (targetUser: any) => {
    const newRole = targetUser.role === "admin" ? "user" : "admin";
    if (confirm(`Bạn có chắc chắn muốn đổi vai trò của tài khoản "${targetUser.username}" thành ${newRole.toUpperCase()} không?`)) {
      try {
        const data = await userService.updateUserRole(targetUser.id, newRole, currentUser?.role || "", currentUser?.id || "");
        if (data.success) {
          setUsersList((prev) => prev.map((u) => u.id === targetUser.id ? { ...u, role: newRole } : u));
        }
      } catch (err: any) {
        alert(err.message || "Không thể thay đổi vai trò thành viên.");
      }
    }
  };

  const handleDeleteUser = async (targetUserId: string) => {
    if (confirm("CẢNH BÁO: Xoá người dùng này sẽ đồng thời xoá TOÀN BỘ bài đăng phòng trọ của họ. Bạn có chắc chắn muốn tiếp tục?")) {
      try {
        const data = await userService.deleteUser(targetUserId, currentUser?.role || "", currentUser?.id || "");
        if (data.success) {
          setUsersList((prev) => prev.filter((u) => u.id !== targetUserId));
          // Refresh room list since cascading delete occurred on db
          const roomsData = await roomService.getRooms(currentUser?.role, currentUser?.id);
          setRooms(roomsData);
        }
      } catch (err: any) {
        alert(err.message || "Xoá người dùng thất bại.");
      }
    }
  };

  const handleDeleteRoom = async (id: string) => {
    try {
      const data = await roomService.deleteRoom(id, currentUser?.role || "", currentUser?.id || "");
      if (data.success) {
        setRooms((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err: any) {
      alert(err.message || "Xoá phòng thất bại.");
    }
  };

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
      contactName: currentUser?.username || "Chủ Nhà Trọ",
      contactPhone: currentUser?.phone || "0909000111",
      image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
      images: [
        "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
      ],
      isSharedOwner: false,
      rating: 0,
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
      hasAirConditioner: false,
      electricityPrice: 3500,
    });
    setIsAdminModalOpen(true);
  };

  const handleOpenEditModal = (room: BoardingRoom) => {
    setEditingRoom(room);
    setFormFields({
      ...room,
      images: Array.isArray(room.images) ? [...room.images] : room.image ? [room.image] : [],
      hasBalcony: room.hasBalcony || false,
      hasMezzanine: room.hasMezzanine || false,
      hasFurniture: room.hasFurniture || false,
      hasAirConditioner: room.hasAirConditioner || false,
      electricityPrice: room.electricityPrice || 3500,
      district: room.district || "",
    });
    setIsAdminModalOpen(true);
  };

  const handleApproveRoom = async (room: BoardingRoom) => {
    if (confirm(`Bạn có chắc chắn muốn PHÊ DUYỆT phòng trọ "${room.title}" không?`)) {
      try {
        const res = await roomService.approveRoom(
          room.id,
          "approve",
          undefined,
          currentUser?.role || "",
          currentUser?.id || ""
        );
        if (res.success) {
          setRooms((prev) =>
            prev.map((r) => (r.id === room.id ? { ...r, approvalStatus: "approved", rejectionReason: null } : r))
          );
          alert("Đã phê duyệt phòng trọ và gửi email thông báo thành công!");
        }
      } catch (err: any) {
        alert(err.message || "Duyệt phòng trọ thất bại.");
      }
    }
  };

  const handleRejectRoom = async (room: BoardingRoom) => {
    const reason = prompt(`Nhập lý do TỪ CHỐI duyệt phòng trọ "${room.title}":`);
    if (reason === null) return;
    if (!reason.trim()) {
      alert("Bạn phải nhập lý do từ chối!");
      return;
    }

    try {
      const res = await roomService.approveRoom(
        room.id,
        "reject",
        reason.trim(),
        currentUser?.role || "",
        currentUser?.id || ""
      );
      if (res.success) {
        setRooms((prev) =>
          prev.map((r) => (r.id === room.id ? { ...r, approvalStatus: "rejected", rejectionReason: reason.trim() } : r))
        );
        alert("Đã từ chối duyệt phòng trọ và gửi email thông báo cho chủ trọ!");
      }
    } catch (err: any) {
      alert(err.message || "Từ chối phòng trọ thất bại.");
    }
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFields.title || !formFields.price || !formFields.city) {
      alert("Vui lòng nhập các thông tin bắt buộc: Tiêu đề, Giá phòng, Tỉnh/Thành phố.");
      return;
    }

    try {
      const userRole = currentUser?.role || "";
      const userId = currentUser?.id || "";
      if (editingRoom) {
        const saved = await roomService.updateRoom(editingRoom.id, formFields, userRole, userId);
        setRooms((prev) => prev.map((r) => (r.id === saved.id ? saved : r)));
      } else {
        const saved = await roomService.createRoom(formFields, userRole, userId);
        setRooms((prev) => [saved, ...prev]);
      }
      setIsAdminModalOpen(false);
      setEditingRoom(null);
    } catch (err: any) {
      alert(err.message || "Gửi phòng trọ thất bại.");
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center h-16 w-16 mb-4">
          <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-20"></div>
          <div className="rounded-full h-10 w-10 bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md">Trọ</div>
        </div>
        <p className="text-gray-500 font-medium animate-pulse text-sm">Đang tải trang quản trị...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div id="admin-locked-view" className="max-w-md mx-auto px-4 py-16 text-center space-y-6 flex-1 flex flex-col justify-center">
        <div className="mx-auto h-16 w-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-200">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-gray-900 font-sans tracking-tight">Yêu Cầu Đăng Nhập</h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            Để thực hiện đăng tin, sửa đổi nội dung và kiểm soát các hoạt động chi tiết phòng trọ của bạn, vui lòng đăng nhập hoặc tạo tài khoản mới.
          </p>
        </div>

        <button
          onClick={() => {
            setAuthModalMode("login");
            setIsAuthModalOpen(true);
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3.5 rounded-xl transition-all shadow-md mt-2 flex items-center justify-center gap-1.5 cursor-pointer border-none"
        >
          <span>Đăng Nhập Tài Khoản</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  const displayedRooms = rooms.filter((room) => {
    if (currentUser?.role === "admin") {
      if (selectedOwnerFilter === "all") return true;
      if (selectedOwnerFilter === "system") return !room.ownerId;
      return room.ownerId === selectedOwnerFilter;
    }
    return room.ownerId === currentUser?.id;
  });

  return (
    <div id="admin-view-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header operations bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-5 mb-6 gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-gray-900 flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-blue-600" />
            {currentUser.role === "admin"
              ? "Trang Quản Trị Hệ Thống Phòng Trọ (Admin)"
              : "Đăng & Quản Lý Danh Sách Phòng Trọ"}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {currentUser.role === "admin"
              ? "Thực hiện quản trị hệ thống, quản lý tài khoản thành viên, xoá bài đăng vi phạm hoặc lọc bài viết theo từng chủ trọ."
              : "Đăng phòng trọ mới của bạn lên hệ thống, quản lý trạng thái còn phòng/hết phòng, và chỉnh sửa thông tin chi tiết."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 self-start sm:self-center">
          {/* Share profile button */}
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                const profileUrl = `${window.location.origin}/user/${encodeURIComponent(currentUser.username)}`;
                navigator.clipboard.writeText(profileUrl)
                  .then(() => alert("Đã sao chép liên kết trang cá nhân của bạn vào bộ nhớ tạm!"))
                  .catch(() => alert("Không thể sao chép liên kết. URL của bạn: " + profileUrl));
              }
            }}
            className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-750 font-bold text-xs py-3 px-4 rounded-xl transition-all duration-150 shadow-xs flex items-center justify-center gap-1.5 cursor-pointer border-solid"
          >
            <Share2 className="h-4 w-4 text-blue-600" />
            <span>Chia sẻ trang cá nhân</span>
          </button>

          <button
            id="admin-add-room-trigger"
            onClick={handleOpenAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 px-5 rounded-xl transition-all duration-150 shadow-md flex items-center justify-center gap-2 cursor-pointer border-none"
          >
            <Plus className="h-4 w-4" />
            Đăng phòng trọ mới
          </button>
        </div>
      </div>

      {/* Admin tabs if role is admin */}
      {currentUser.role === "admin" && (
        <div className="flex gap-4 border-b border-gray-150 pb-px mb-6">
          <button
            onClick={() => setActiveTab("rooms")}
            className={`pb-3 text-sm font-bold transition-all border-b-2 cursor-pointer bg-transparent border-none ${
              activeTab === "rooms"
                ? "border-blue-600 text-blue-600 font-extrabold"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            Quản Lý Phòng Trọ ({rooms.length})
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`pb-3 text-sm font-bold transition-all border-b-2 cursor-pointer bg-transparent border-none ${
              activeTab === "users"
                ? "border-blue-600 text-blue-600 font-extrabold"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            Quản Lý Thành Viên ({usersList.length})
          </button>
        </div>
      )}

      {/* User filter drop zone if role is admin and active tab is rooms */}
      {currentUser.role === "admin" && activeTab === "rooms" && (
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 mb-6 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Lọc theo người đăng:</span>
            <select
              value={selectedOwnerFilter}
              onChange={(e) => setSelectedOwnerFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg bg-white px-3 py-1.5 outline-none font-semibold text-slate-700 focus:border-blue-500"
            >
              <option value="all">-- Tất cả bài đăng ({rooms.length}) --</option>
              <option value="system">Hệ thống / Admin ({rooms.filter((r) => !r.ownerId).length})</option>
              {usersList.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username} ({user.role === "admin" ? "Admin" : "Chủ trọ"}) - {rooms.filter((r) => r.ownerId === user.id).length} bài đăng
                </option>
              ))}
            </select>
          </div>
          <div className="text-xs text-slate-400 font-medium">
            Hiển thị <span className="font-bold text-slate-750">{displayedRooms.length}</span> phòng trọ
          </div>
        </div>
      )}

      {/* Main Rooms List Tab */}
      {activeTab === "rooms" && (
        <div className="space-y-6">
          {displayedRooms.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-scale-up">
              {displayedRooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  isAdminMode={true}
                  currentRole={currentUser.role}
                  onViewDetails={viewRoomDetails}
                  onEdit={handleOpenEditModal}
                  onDelete={handleDeleteRoom}
                  onApprove={handleApproveRoom}
                  onReject={handleRejectRoom}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <p className="text-gray-400 text-sm">
                {currentUser.role === "admin"
                  ? "Không tìm thấy phòng trọ nào của người đăng này."
                  : "Bạn chưa đăng phòng trọ nào trên hệ thống."}
              </p>
              <button
                onClick={handleOpenAddModal}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-xl text-center border-none cursor-pointer"
              >
                Đăng phòng đầu tiên
              </button>
            </div>
          )}
        </div>
      )}

      {/* User Management Tab (Admin Only) */}
      {currentUser.role === "admin" && activeTab === "users" && (
        <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xs animate-scale-up">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
            <div>
              <h3 className="text-sm sm:text-base font-black text-gray-900">Danh Sách Tài Khoản Thành Viên</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Quản lý nâng cấp/hạ cấp vai trò thành viên hoặc xoá vĩnh viễn tài khoản.</p>
            </div>
            <span className="text-xs text-gray-500 font-bold font-mono uppercase bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
              Tổng số: {usersList.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            {isUsersLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                <span className="text-xs text-gray-400 font-medium">Đang tải danh sách thành viên...</span>
              </div>
            ) : usersList.length > 0 ? (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 font-bold uppercase border-b border-gray-100">
                    <th className="px-6 py-3.5">Tên đăng nhập</th>
                    <th className="px-6 py-3.5">Email</th>
                    <th className="px-6 py-3.5">Số điện thoại</th>
                    <th className="px-6 py-3.5">Vai trò</th>
                    <th className="px-6 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {usersList.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">{user.username}</td>
                      <td className="px-6 py-4 text-gray-600 font-medium">{user.email}</td>
                      <td className="px-6 py-4 text-gray-600 font-mono font-bold">{user.phone}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleUserRole(user)}
                          disabled={user.id === currentUser?.id}
                          className={`px-2 py-1 rounded text-[10px] font-extrabold uppercase tracking-wide cursor-pointer transition-colors ${
                            user.role === "admin"
                              ? "bg-amber-100 text-amber-850 hover:bg-amber-200 border-none"
                              : "bg-blue-50 text-blue-600 hover:bg-blue-150 border-none"
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                          title={user.id === currentUser?.id ? "Không thể tự thay đổi vai trò bản thân" : "Nhấp để thay đổi vai trò"}
                        >
                          {user.role}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={user.id === currentUser?.id}
                          className="text-red-500 hover:text-white hover:bg-red-600 p-1.5 rounded-xl transition-all border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          title={user.id === currentUser?.id ? "Không thể tự xoá tài khoản bản thân" : "Xoá tài khoản & toàn bộ bài đăng"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12 text-gray-400 italic">Chưa có người dùng nào đăng ký trong hệ thống.</div>
            )}
          </div>
        </div>
      )}

      {/* ADMIN ADD/EDIT MODAL */}
      {isAdminModalOpen && (
        <div id="admin-form-modal" className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative animate-scale-up max-h-[95vh] flex flex-col justify-between">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-black text-gray-900">
                  {editingRoom ? "Chỉnh Sửa Thông Tin Phòng Trọ" : "Thêm Phòng Trọ Mới Vào Hệ Thống"}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Nhập đầy đủ thông tin bên dưới để đồng bộ cơ sở dữ liệu.</p>
              </div>
              <button
                onClick={() => setIsAdminModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer bg-transparent border-none"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

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
                    onChange={(e) => setFormFields((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 outline-none bg-white focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-700 font-bold block mb-1">Giá Thuê / Tháng (VND) *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      placeholder="Ví dụ: 3200000"
                      value={formFields.price || ""}
                      onChange={(e) => setFormFields((prev) => ({ ...prev, price: Number(e.target.value) }))}
                      className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 outline-none bg-white focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-700 font-bold block mb-1">Diện tích sử dụng (m²) *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      placeholder="Ví dụ: 22"
                      value={formFields.area || ""}
                      onChange={(e) => setFormFields((prev) => ({ ...prev, area: Number(e.target.value) }))}
                      className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 outline-none bg-white focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Box 2: Address */}
              <div className="space-y-4 pt-3 border-t border-gray-100">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">2. Địa chỉ chi tiết</span>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Tỉnh / Thành phố *</label>
                    <select
                      value={selectedAdminProvCode}
                      required
                      onChange={(e) => {
                        const code = e.target.value;
                        setSelectedAdminProvCode(code);
                        setSelectedAdminDistCode("");
                        const prov = adminProvinces.find((p) => String(p.code) === code);
                        setFormFields((prev) => ({
                          ...prev,
                          city: prov ? prov.name : "",
                          district: "",
                          ward: "",
                        }));
                      }}
                      className="w-full text-xs border border-gray-200 rounded-lg px-2 py-2 outline-none bg-white focus:border-blue-500"
                    >
                      <option value="">-- Chọn Tỉnh/Thành --</option>
                      {adminProvinces.map((p) => (
                        <option key={p.code} value={p.code}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Quận / Huyện *</label>
                    <select
                      value={selectedAdminDistCode}
                      required
                      disabled={!selectedAdminProvCode}
                      onChange={(e) => {
                        const code = e.target.value;
                        setSelectedAdminDistCode(code);
                        const dist = adminDistricts.find((d) => String(d.code) === code);
                        setFormFields((prev) => ({
                          ...prev,
                          district: dist ? dist.name : "",
                          ward: "",
                        }));
                      }}
                      className="w-full text-xs border border-gray-200 rounded-lg px-2 py-2 outline-none bg-white focus:border-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">-- Chọn Quận/Huyện --</option>
                      {adminDistricts.map((d) => (
                        <option key={d.code} value={d.code}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Phường / Xã *</label>
                    <select
                      value={formFields.ward ? (adminWards.find((w) => w.name === formFields.ward)?.code || "") : ""}
                      required
                      disabled={!selectedAdminDistCode}
                      onChange={(e) => {
                        const code = e.target.value;
                        const wrd = adminWards.find((w) => String(w.code) === code);
                        setFormFields((prev) => ({
                          ...prev,
                          ward: wrd ? wrd.name : "",
                        }));
                      }}
                      className="w-full text-xs border border-gray-200 rounded-lg px-2 py-2 outline-none bg-white focus:border-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">-- Chọn Phường/Xã --</option>
                      {adminWards.map((w) => (
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
                      onChange={(e) => setFormFields((prev) => ({ ...prev, street: e.target.value }))}
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
                    onChange={(e) => setFormFields((prev) => ({ ...prev, addressDetailed: e.target.value }))}
                    className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 outline-none bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Box 3: Amenities options */}
              <div className="space-y-4 pt-3 border-t border-gray-100">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">3. Tiện nghi & Quy chế phòng trọ</span>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-xs text-gray-600 font-semibold">Kết nối Wifi miễn phí</span>
                    <input
                      type="checkbox"
                      checked={formFields.hasWifi}
                      onChange={(e) => setFormFields((prev) => ({ ...prev, hasWifi: e.target.checked }))}
                      className="h-4 w-4 accent-blue-600"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-xs text-gray-600 font-semibold">Sống chung chủ nhà</span>
                    <input
                      type="checkbox"
                      checked={formFields.isSharedOwner}
                      onChange={(e) => setFormFields((prev) => ({ ...prev, isSharedOwner: e.target.checked }))}
                      className="h-4 w-4 accent-blue-600"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-xs text-gray-600 font-semibold">Phí nước sinh hoạt</span>
                    <select
                      value={formFields.waterFeeType}
                      onChange={(e) => setFormFields((prev) => ({ ...prev, waterFeeType: e.target.value as any }))}
                      className="text-xs border border-gray-200 rounded-lg bg-white px-1 py-0.5 outline-none"
                    >
                      <option value="miễn phí">Miễn phí</option>
                      <option value="có phí">Có phí</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-xs text-gray-600 font-semibold">Trạng thái phòng</span>
                    <select
                      value={formFields.status}
                      onChange={(e) => setFormFields((prev) => ({ ...prev, status: e.target.value as any }))}
                      className="text-xs border border-gray-200 rounded-lg bg-white px-1 py-0.5 outline-none"
                    >
                      <option value="còn phòng">Còn phòng</option>
                      <option value="hết phòng">Hết phòng</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-xs text-gray-600 font-semibold">Giờ giấc ra vào</span>
                    <select
                      value={formFields.hoursType}
                      onChange={(e) => setFormFields((prev) => ({ ...prev, hoursType: e.target.value as any }))}
                      className="text-xs border border-gray-200 rounded-lg bg-white px-1 py-0.5 outline-none"
                    >
                      <option value="tự do">Tự do</option>
                      <option value="cố định">Cố định</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-xs text-gray-600 font-semibold">Năm xây dựng</span>
                    <input
                      type="number"
                      min={2000}
                      max={2026}
                      value={formFields.buildYear}
                      onChange={(e) => setFormFields((prev) => ({ ...prev, buildYear: Number(e.target.value) }))}
                      className="w-16 text-center text-xs border border-gray-200 rounded-lg bg-white outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-xs text-gray-600 font-semibold">Bãi đỗ xe máy</span>
                    <input
                      type="checkbox"
                      checked={formFields.hasParking}
                      onChange={(e) => setFormFields((prev) => ({ ...prev, hasParking: e.target.checked }))}
                      className="h-4 w-4 accent-blue-600"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-xs text-gray-600 font-semibold">Thang máy nội khu</span>
                    <input
                      type="checkbox"
                      checked={formFields.hasElevator}
                      onChange={(e) => setFormFields((prev) => ({ ...prev, hasElevator: e.target.checked }))}
                      className="h-4 w-4 accent-blue-600"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-xs text-gray-600 font-semibold">Có ban công rộng</span>
                    <input
                      type="checkbox"
                      checked={formFields.hasBalcony}
                      onChange={(e) => setFormFields((prev) => ({ ...prev, hasBalcony: e.target.checked }))}
                      className="h-4 w-4 accent-blue-600"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-xs text-gray-600 font-semibold">Có gác lửng</span>
                    <input
                      type="checkbox"
                      checked={formFields.hasMezzanine}
                      onChange={(e) => setFormFields((prev) => ({ ...prev, hasMezzanine: e.target.checked }))}
                      className="h-4 w-4 accent-blue-600"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-xs text-gray-600 font-semibold">Đầy đủ nội thất</span>
                    <input
                      type="checkbox"
                      checked={formFields.hasFurniture}
                      onChange={(e) => setFormFields((prev) => ({ ...prev, hasFurniture: e.target.checked }))}
                      className="h-4 w-4 accent-blue-600"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-xs text-gray-600 font-semibold">Có máy lạnh</span>
                    <input
                      type="checkbox"
                      checked={formFields.hasAirConditioner}
                      onChange={(e) => setFormFields((prev) => ({ ...prev, hasAirConditioner: e.target.checked }))}
                      className="h-4 w-4 accent-blue-600"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-xs text-gray-600 font-semibold">Giá điện (đ/kWh)</span>
                    <input
                      type="number"
                      min={0}
                      placeholder="Ví dụ: 3500"
                      value={formFields.electricityPrice || ""}
                      onChange={(e) => setFormFields((prev) => ({ ...prev, electricityPrice: Number(e.target.value) }))}
                      className="w-20 text-center text-xs border border-gray-200 rounded-lg bg-white outline-none py-0.5"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-100 col-span-2">
                    <span className="text-xs text-gray-600 font-semibold">Hợp đồng thuê ràng buộc</span>
                    <input
                      type="checkbox"
                      checked={formFields.hasContract}
                      onChange={(e) => setFormFields((prev) => ({ ...prev, hasContract: e.target.checked }))}
                      className="h-4 w-4 accent-blue-600"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-100 col-span-2">
                    <span className="text-xs text-gray-600 font-semibold">Giới hạn số người ở tối đa</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formFields.isPeopleLimited}
                        onChange={(e) => setFormFields((prev) => ({ ...prev, isPeopleLimited: e.target.checked }))}
                        className="h-4 w-4 accent-blue-600"
                      />
                      {formFields.isPeopleLimited && (
                        <input
                          type="number"
                          min={1}
                          max={20}
                          placeholder="Người"
                          value={formFields.maxPeople || ""}
                          onChange={(e) => setFormFields((prev) => ({ ...prev, maxPeople: Number(e.target.value) }))}
                          className="w-12 text-center text-xs border border-gray-200 rounded-lg bg-white outline-none py-0.5"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Box 4: Images & contact */}
              <div className="space-y-4 pt-3 border-t border-gray-100">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">4. Ảnh đại diện & Liên hệ quản lý</span>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-700 font-bold block mb-1">Tên chủ nhà liên hệ</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Anh Hoàng Thư"
                      value={formFields.contactName}
                      onChange={(e) => setFormFields((prev) => ({ ...prev, contactName: e.target.value }))}
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
                      onChange={(e) => setFormFields((prev) => ({ ...prev, contactPhone: e.target.value }))}
                      className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 outline-none bg-white focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* 1. Main Image Upload */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-gray-800 font-extrabold block">Ảnh đại diện phòng trọ (Ảnh chính) *</label>
                    <button
                      type="button"
                      onClick={() => setShowManualUrlInput(!showManualUrlInput)}
                      className="text-blue-600 hover:text-blue-800 text-[10px] font-bold transition-colors cursor-pointer bg-transparent border-none"
                    >
                      {showManualUrlInput ? "Ẩn nhập URL thủ công" : "Nhập URL thủ công"}
                    </button>
                  </div>

                  {/* Drag and drop / Show upload area */}
                  <div className="relative group rounded-2xl border-2 border-dashed border-gray-200 hover:border-blue-500 bg-gray-50 transition-all duration-200 overflow-hidden min-h-[140px] flex flex-col items-center justify-center p-4">
                    {isUploadingMain ? (
                      <div className="flex flex-col items-center justify-center gap-2 py-4">
                        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                        <span className="text-[11px] text-gray-500 font-semibold animate-pulse">Đang tải ảnh lên Cloudinary...</span>
                      </div>
                    ) : formFields.image ? (
                      <div className="relative w-full h-[160px] rounded-xl overflow-hidden shadow-sm">
                        <img
                          src={formFields.image}
                          alt="Main preview"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        {/* Hover Overlay controls */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity duration-200">
                          <label className="bg-white hover:bg-gray-100 text-gray-800 font-bold text-xs py-2 px-4 rounded-xl cursor-pointer shadow-md transition-all flex items-center gap-1.5">
                            <UploadCloud className="h-4 w-4 text-blue-600" />
                            <span>Thay đổi ảnh</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleUploadMainImage}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setFormFields((prev) => ({ ...prev, image: "" }))}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-md transition-all flex items-center gap-1.5 border-none cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Xoá ảnh</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="w-full h-full flex flex-col items-center justify-center py-4 cursor-pointer gap-2 select-none">
                        <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                          <UploadCloud className="h-5 w-5" />
                        </div>
                        <div className="text-center">
                          <span className="text-xs font-bold text-gray-700 block">Tải ảnh đại diện</span>
                          <span className="text-[10px] text-gray-400 block mt-0.5">Nhấp hoặc kéo thả tệp hình ảnh vào đây</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUploadMainImage}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {uploadMainError && (
                    <div className="p-2.5 bg-red-50 border border-red-100 text-red-600 rounded-xl text-[10px] font-medium leading-relaxed">
                      ⚠️ {uploadMainError}
                    </div>
                  )}

                  {/* Manual URL input fallback */}
                  {showManualUrlInput && (
                    <div className="mt-2 animate-slide-down">
                      <input
                        type="text"
                        placeholder="Đường dẫn hình ảnh trực tuyến (https://...)"
                        value={formFields.image || ""}
                        onChange={(e) => setFormFields((prev) => ({ ...prev, image: e.target.value }))}
                        className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 outline-none bg-white focus:border-blue-500"
                      />
                    </div>
                  )}
                </div>

                {/* 2. Sub Images Upload Grid */}
                <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs text-gray-850 font-extrabold block">Danh sách ảnh phụ ({formFields.images?.length || 0} ảnh)</label>
                      <span className="text-[10px] text-gray-400 block">Các góc chụp chi tiết khác của phòng</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowManualUrlsInput(!showManualUrlsInput)}
                      className="text-blue-600 hover:text-blue-800 text-[10px] font-bold transition-colors cursor-pointer bg-transparent border-none"
                    >
                      {showManualUrlsInput ? "Ẩn nhập URL thủ công" : "Nhập URL thủ công"}
                    </button>
                  </div>

                  {/* Thumbnail Grid & Upload trigger */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {/* Render existing sub images */}
                    {Array.isArray(formFields.images) &&
                      formFields.images.map((imgUrl, i) => (
                        <div key={i} className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 group border border-gray-200 shadow-xs">
                          {imgUrl ? (
                            <>
                              <img
                                src={imgUrl}
                                alt={`Sub preview ${i}`}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-150">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = formFields.images!.filter((_, idx) => idx !== i);
                                    setFormFields((prev) => ({ ...prev, images: updated }));
                                  }}
                                  className="h-7 w-7 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition-all border-none cursor-pointer shadow-md"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-[10px] text-gray-400 font-mono">Trống</div>
                          )}
                        </div>
                      ))}

                    {/* Loading state card */}
                    {isUploadingSub && (
                      <div className="relative aspect-[4/3] rounded-xl bg-blue-50/50 border border-dashed border-blue-200 flex flex-col items-center justify-center gap-1">
                        <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                        <span className="text-[9px] text-blue-500 font-semibold animate-pulse">Đang tải...</span>
                      </div>
                    )}

                    {/* Plus Trigger Button Card */}
                    <label className="relative aspect-[4/3] rounded-xl border border-dashed border-gray-300 hover:border-blue-500 bg-white hover:bg-gray-50 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors shadow-xs select-none">
                      <Plus className="h-4 w-4 text-gray-500" />
                      <span className="text-[10px] font-bold text-gray-600">Thêm ảnh</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleUploadSubImages}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {uploadSubError && (
                    <div className="p-2.5 bg-red-50 border border-red-100 text-red-600 rounded-xl text-[10px] font-medium leading-relaxed">
                      ⚠️ {uploadSubError}
                    </div>
                  )}

                  {/* Backward Compatibility manual text inputs */}
                  {showManualUrlsInput && (
                    <div className="space-y-2 pt-3 border-t border-gray-200/60 animate-slide-down">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Danh sách liên kết phụ</span>
                        <button
                          type="button"
                          onClick={() => {
                            const current = formFields.images || [];
                            setFormFields((prev) => ({ ...prev, images: [...current, ""] }));
                          }}
                          className="text-blue-600 hover:text-blue-800 text-[10px] font-bold flex items-center gap-1 bg-transparent border-none cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Thêm ô URL</span>
                        </button>
                      </div>

                      {Array.isArray(formFields.images) && formFields.images.length > 0 ? (
                        <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                          {formFields.images.map((imgUrl, i) => (
                            <div key={i} className="flex gap-2 items-center">
                              <input
                                type="text"
                                placeholder="URL hình ảnh phụ..."
                                value={imgUrl || ""}
                                onChange={(e) => {
                                  const updated = [...formFields.images!];
                                  updated[i] = e.target.value;
                                  setFormFields((prev) => ({ ...prev, images: updated }));
                                }}
                                className="flex-1 text-[11px] border border-gray-200 rounded-xl px-2.5 py-1.5 outline-none bg-white focus:border-blue-500"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = formFields.images!.filter((_, idx) => idx !== i);
                                  setFormFields((prev) => ({ ...prev, images: updated }));
                                }}
                                className="text-red-500 hover:text-red-700 p-1 cursor-pointer bg-transparent border-none"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-gray-400 italic">Chưa có ảnh nào.</p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs text-gray-700 font-bold block mb-1">Mô tả chi tiết phòng trọ</label>
                  <textarea
                    rows={4}
                    placeholder="Mô tả đặc điểm xung quanh phòng..."
                    value={formFields.description}
                    onChange={(e) => setFormFields((prev) => ({ ...prev, description: e.target.value }))}
                    className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 outline-none bg-white focus:border-blue-500 resize-none"
                  ></textarea>
                </div>
              </div>

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
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md cursor-pointer border-none"
                >
                  Đồng ý lưu thông tin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
