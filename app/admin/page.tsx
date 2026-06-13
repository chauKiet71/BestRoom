"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  Ban,
  BarChart3,
  Bell,
  Box,
  CheckCircle,
  Clock,
  Download,
  Edit3,
  Eye,
  FileText,
  Filter,
  Home,
  LayoutDashboard,
  Loader2,
  Menu,
  MoreVertical,
  Package,
  Plus,
  Search,
  Settings,
  Share2,
  ShieldCheck,
  Star,
  Trash2,
  UploadCloud,
  UserRound,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { BoardingRoom, ROOM_TYPE_OPTIONS } from "@/types";
import { roomService } from "@/services/roomService";
import { userService } from "@/services/userService";
import RoomCard from "@/components/RoomCard";
import PageLoader from "@/components/PageLoader";

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
    setCurrentUser,
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
  const [adminSearchQuery, setAdminSearchQuery] = useState("");
  const [adminStatusFilter, setAdminStatusFilter] = useState("all");
  const [adminTypeFilter, setAdminTypeFilter] = useState("all");
  const [deleteTargetRoom, setDeleteTargetRoom] = useState<BoardingRoom | null>(null);


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
    roomType: "Phòng trọ",
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
    parkingFeeType: "miễn phí",
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

  const handleUpdatePostPermission = async (targetUser: any, action: "approve" | "reject") => {
    try {
      const data = await userService.updatePostPermission(targetUser.id, action, currentUser?.role || "", currentUser?.id || "");
      if (data.success) {
        setUsersList((prev) => prev.map((u) => u.id === targetUser.id ? { ...u, ...data.user } : u));
      }
    } catch (err: any) {
      alert(err.message || "Không thể cập nhật quyền đăng tin.");
    }
  };

  const handleRequestPostPermission = async () => {
    if (!currentUser) return;
    try {
      const data = await userService.updatePostPermission(currentUser.id, "request", currentUser.role, currentUser.id);
      if (data.success) {
        const updatedUser = { ...currentUser, ...data.user };
        setCurrentUser(updatedUser);
        localStorage.setItem("bestroom_user", JSON.stringify(updatedUser));
      }
    } catch (err: any) {
      alert(err.message || "Không thể gửi yêu cầu đăng tin.");
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

  const handleRequestDeleteRoom = (id: string) => {
    const room = rooms.find((item) => item.id === id);
    if (room) {
      setDeleteTargetRoom(room);
    }
  };

  const handleConfirmDeleteRoom = async () => {
    if (!deleteTargetRoom) return;
    const roomId = deleteTargetRoom.id;
    setDeleteTargetRoom(null);
    await handleDeleteRoom(roomId);
  };

  const handleOpenAddModal = () => {
    setEditingRoom(null);
    setFormFields({
      title: "",
      roomType: "Phòng trọ",
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
      parkingFeeType: "miễn phí",
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
      roomType: room.roomType || "Phòng trọ",
      images: Array.isArray(room.images) ? [...room.images] : room.image ? [room.image] : [],
      hasBalcony: room.hasBalcony || false,
      hasMezzanine: room.hasMezzanine || false,
      hasFurniture: room.hasFurniture || false,
      hasAirConditioner: room.hasAirConditioner || false,
      electricityPrice: room.electricityPrice || 3500,
      parkingFeeType: room.parkingFeeType || "miễn phí",
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
    return <PageLoader text="Đang tải trang quản trị..." className="font-sans" />;
  }

  if (!currentUser) {
    return (
      <div id="admin-locked-view" className="max-w-md mx-auto px-4 py-16 text-center space-y-6 flex-1 flex flex-col justify-center font-sans">
        <div className="mx-auto h-16 w-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-200">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Yêu cầu đăng nhập</h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            Vui lòng đăng nhập bằng tài khoản admin để quản lí tin đăng, thành viên và duyệt nội dung trên hệ thống.
          </p>
        </div>

        <button
          onClick={() => {
            setAuthModalMode("login");
            setIsAuthModalOpen(true);
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3.5 rounded-xl transition-all shadow-md mt-2 flex items-center justify-center gap-1.5 cursor-pointer border-none"
        >
          <span>Đăng nhập tài khoản</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (currentUser.role !== "admin") {
    return (
      <div id="admin-forbidden-view" className="mx-auto flex min-h-[calc(100vh-60px)] max-w-md flex-col justify-center px-4 py-16 text-center font-sans">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-red-200 bg-red-50 text-red-600">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <h2 className="mt-6 text-2xl font-black text-blue-950">Chỉ admin mới được truy cập</h2>
        <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
          Trang quản trị hệ thống chỉ dành cho tài khoản có vai trò admin. Nếu bạn muốn đăng tin phòng trọ, hãy dùng mục Đăng tin phòng trọ trong trang cá nhân.
        </p>
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

  const ownerNameById = new Map(usersList.map((user) => [user.id, user.fullname || user.username]));
  const approvedRooms = rooms.filter((room) => room.approvalStatus === "approved" || !room.approvalStatus);
  const pendingRooms = rooms.filter((room) => room.approvalStatus === "pending");
  const rejectedRooms = rooms.filter((room) => room.approvalStatus === "rejected");
  const unavailableRooms = rooms.filter((room) => room.status === "hết phòng");
  const filteredAdminRooms = displayedRooms.filter((room) => {
    const query = adminSearchQuery.trim().toLowerCase();
    const matchSearch =
      !query ||
      room.title.toLowerCase().includes(query) ||
      room.district?.toLowerCase().includes(query) ||
      room.city?.toLowerCase().includes(query) ||
      (ownerNameById.get(room.ownerId || "") || room.contactName || "").toLowerCase().includes(query);
    const matchStatus =
      adminStatusFilter === "all" ||
      (adminStatusFilter === "approved" && (room.approvalStatus === "approved" || !room.approvalStatus)) ||
      room.approvalStatus === adminStatusFilter ||
      room.status === adminStatusFilter;
    const matchType =
      adminTypeFilter === "all" ||
      (room.roomType || "Phòng trọ") === adminTypeFilter;
    return matchSearch && matchStatus && matchType;
  });
  const needsReviewRooms = [...pendingRooms, ...rejectedRooms].slice(0, 5);
  const statusTotal = Math.max(rooms.length, 1);
  const approvedPercent = Math.round((approvedRooms.length / statusTotal) * 100);
  const pendingPercent = Math.round((pendingRooms.length / statusTotal) * 100);
  const rejectedPercent = Math.round((rejectedRooms.length / statusTotal) * 100);
  const unavailablePercent = Math.max(0, 100 - approvedPercent - pendingPercent - rejectedPercent);

  return (
    <div id="admin-view-container" className="animate-fade-in bg-[#f6f9fd]">
      <AdminListingsDashboard
        currentUser={currentUser}
        rooms={rooms}
        usersList={usersList}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedOwnerFilter={selectedOwnerFilter}
        setSelectedOwnerFilter={setSelectedOwnerFilter}
        adminSearchQuery={adminSearchQuery}
        setAdminSearchQuery={setAdminSearchQuery}
        adminStatusFilter={adminStatusFilter}
        setAdminStatusFilter={setAdminStatusFilter}
        adminTypeFilter={adminTypeFilter}
        setAdminTypeFilter={setAdminTypeFilter}
        displayedRooms={displayedRooms}
        filteredAdminRooms={filteredAdminRooms}
        approvedRooms={approvedRooms}
        pendingRooms={pendingRooms}
        rejectedRooms={rejectedRooms}
        unavailableRooms={unavailableRooms}
        needsReviewRooms={needsReviewRooms}
        approvedPercent={approvedPercent}
        pendingPercent={pendingPercent}
        rejectedPercent={rejectedPercent}
        unavailablePercent={unavailablePercent}
        ownerNameById={ownerNameById}
        isUsersLoading={isUsersLoading}
        onViewRoom={viewRoomDetails}
        onEditRoom={handleOpenEditModal}
        onDeleteRoom={handleRequestDeleteRoom}
        onApproveRoom={handleApproveRoom}
        onRejectRoom={handleRejectRoom}
        onAddRoom={handleOpenAddModal}
        onToggleUserRole={handleToggleUserRole}
        onDeleteUser={handleDeleteUser}
        onUpdatePostPermission={handleUpdatePostPermission}
      />
      {deleteTargetRoom && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-red-50 text-red-600">
              <Trash2 className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-xl font-black text-blue-950">Có chắc chắn muốn xóa không?</h2>
            <p className="mt-2 line-clamp-2 text-sm font-semibold text-slate-500">
              Tin đăng "{deleteTargetRoom.title}" sẽ bị xóa khỏi hệ thống.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeleteTargetRoom(null)}
                className="h-11 rounded-lg border border-slate-200 bg-white text-sm font-black text-slate-700 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteRoom}
                className="h-11 rounded-lg bg-red-600 text-sm font-black text-white shadow-sm hover:bg-red-700"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="hidden">
      {/* Header operations bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-5 mb-6 gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-gray-900 flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-blue-600" />
            {currentUser.role === "admin"
              ? "Trang QuÃ¡ÂºÂ£n TrÃ¡Â»â€¹ HÃ¡Â»â€¡ ThÃ¡Â»â€˜ng PhÃƒÂ²ng TrÃ¡Â»Â (Admin)"
              : "Ã„ÂÃ„Æ’ng & QuÃ¡ÂºÂ£n LÃƒÂ½ Danh SÃƒÂ¡ch PhÃƒÂ²ng TrÃ¡Â»Â"}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {currentUser.role === "admin"
              ? "ThÃ¡Â»Â±c hiÃ¡Â»â€¡n quÃ¡ÂºÂ£n trÃ¡Â»â€¹ hÃ¡Â»â€¡ thÃ¡Â»â€˜ng, quÃ¡ÂºÂ£n lÃƒÂ½ tÃƒÂ i khoÃ¡ÂºÂ£n thÃƒÂ nh viÃƒÂªn, xoÃƒÂ¡ bÃƒÂ i Ã„â€˜Ã„Æ’ng vi phÃ¡ÂºÂ¡m hoÃ¡ÂºÂ·c lÃ¡Â»Âc bÃƒÂ i viÃ¡ÂºÂ¿t theo tÃ¡Â»Â«ng chÃ¡Â»Â§ trÃ¡Â»Â."
              : "Ã„ÂÃ„Æ’ng phÃƒÂ²ng trÃ¡Â»Â mÃ¡Â»â€ºi cÃ¡Â»Â§a bÃ¡ÂºÂ¡n lÃƒÂªn hÃ¡Â»â€¡ thÃ¡Â»â€˜ng, quÃ¡ÂºÂ£n lÃƒÂ½ trÃ¡ÂºÂ¡ng thÃƒÂ¡i cÃƒÂ²n phÃƒÂ²ng/hÃ¡ÂºÂ¿t phÃƒÂ²ng, vÃƒÂ  chÃ¡Â»â€°nh sÃ¡Â»Â­a thÃƒÂ´ng tin chi tiÃ¡ÂºÂ¿t."}
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
                  .then(() => alert("Ã„ÂÃƒÂ£ sao chÃƒÂ©p liÃƒÂªn kÃ¡ÂºÂ¿t trang cÃƒÂ¡ nhÃƒÂ¢n cÃ¡Â»Â§a bÃ¡ÂºÂ¡n vÃƒÂ o bÃ¡Â»â„¢ nhÃ¡Â»â€º tÃ¡ÂºÂ¡m!"))
                  .catch(() => alert("KhÃƒÂ´ng thÃ¡Â»Æ’ sao chÃƒÂ©p liÃƒÂªn kÃ¡ÂºÂ¿t. URL cÃ¡Â»Â§a bÃ¡ÂºÂ¡n: " + profileUrl));
              }
            }}
            className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-750 font-bold text-xs py-3 px-4 rounded-xl transition-all duration-150 shadow-xs flex items-center justify-center gap-1.5 cursor-pointer border-solid"
          >
            <Share2 className="h-4 w-4 text-blue-600" />
            <span>Chia sÃ¡ÂºÂ» trang cÃƒÂ¡ nhÃƒÂ¢n</span>
          </button>

          <button
            id="admin-add-room-trigger"
            onClick={handleOpenAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 px-5 rounded-xl transition-all duration-150 shadow-md flex items-center justify-center gap-2 cursor-pointer border-none"
          >
            <Plus className="h-4 w-4" />
            Ã„ÂÃ„Æ’ng phÃƒÂ²ng trÃ¡Â»Â mÃ¡Â»â€ºi
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
            QuÃ¡ÂºÂ£n LÃƒÂ½ PhÃƒÂ²ng TrÃ¡Â»Â ({rooms.length})
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`pb-3 text-sm font-bold transition-all border-b-2 cursor-pointer bg-transparent border-none ${
              activeTab === "users"
                ? "border-blue-600 text-blue-600 font-extrabold"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            QuÃ¡ÂºÂ£n LÃƒÂ½ ThÃƒÂ nh ViÃƒÂªn ({usersList.length})
          </button>
        </div>
      )}

      {/* User filter drop zone if role is admin and active tab is rooms */}
      {currentUser.role === "admin" && activeTab === "rooms" && (
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 mb-6 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">LÃ¡Â»Âc theo ngÃ†Â°Ã¡Â»Âi Ã„â€˜Ã„Æ’ng:</span>
            <select
              value={selectedOwnerFilter}
              onChange={(e) => setSelectedOwnerFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg bg-white px-3 py-1.5 outline-none font-semibold text-slate-700 focus:border-blue-500"
            >
              <option value="all">-- TÃ¡ÂºÂ¥t cÃ¡ÂºÂ£ bÃƒÂ i Ã„â€˜Ã„Æ’ng ({rooms.length}) --</option>
              <option value="system">HÃ¡Â»â€¡ thÃ¡Â»â€˜ng / Admin ({rooms.filter((r) => !r.ownerId).length})</option>
              {usersList.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username} ({user.role === "admin" ? "Admin" : "ChÃ¡Â»Â§ trÃ¡Â»Â"}) - {rooms.filter((r) => r.ownerId === user.id).length} bÃƒÂ i Ã„â€˜Ã„Æ’ng
                </option>
              ))}
            </select>
          </div>
          <div className="text-xs text-slate-400 font-medium">
            HiÃ¡Â»Æ’n thÃ¡Â»â€¹ <span className="font-bold text-slate-750">{displayedRooms.length}</span> phÃƒÂ²ng trÃ¡Â»Â
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
                  onDelete={handleRequestDeleteRoom}
                  onApprove={handleApproveRoom}
                  onReject={handleRejectRoom}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <p className="text-gray-400 text-sm">
                {currentUser.role === "admin"
                  ? "KhÃƒÂ´ng tÃƒÂ¬m thÃ¡ÂºÂ¥y phÃƒÂ²ng trÃ¡Â»Â nÃƒÂ o cÃ¡Â»Â§a ngÃ†Â°Ã¡Â»Âi Ã„â€˜Ã„Æ’ng nÃƒÂ y."
                  : "BÃ¡ÂºÂ¡n chÃ†Â°a Ã„â€˜Ã„Æ’ng phÃƒÂ²ng trÃ¡Â»Â nÃƒÂ o trÃƒÂªn hÃ¡Â»â€¡ thÃ¡Â»â€˜ng."}
              </p>
              <button
                onClick={handleOpenAddModal}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-xl text-center border-none cursor-pointer"
              >
                Ã„ÂÃ„Æ’ng phÃƒÂ²ng Ã„â€˜Ã¡ÂºÂ§u tiÃƒÂªn
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
              <h3 className="text-sm sm:text-base font-black text-gray-900">Danh SÃƒÂ¡ch TÃƒÂ i KhoÃ¡ÂºÂ£n ThÃƒÂ nh ViÃƒÂªn</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">QuÃ¡ÂºÂ£n lÃƒÂ½ nÃƒÂ¢ng cÃ¡ÂºÂ¥p/hÃ¡ÂºÂ¡ cÃ¡ÂºÂ¥p vai trÃƒÂ² thÃƒÂ nh viÃƒÂªn hoÃ¡ÂºÂ·c xoÃƒÂ¡ vÃ„Â©nh viÃ¡Â»â€¦n tÃƒÂ i khoÃ¡ÂºÂ£n.</p>
            </div>
            <span className="text-xs text-gray-500 font-bold font-mono uppercase bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
              TÃ¡Â»â€¢ng sÃ¡Â»â€˜: {usersList.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            {isUsersLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                <span className="text-xs text-gray-400 font-medium">Ã„Âang tÃ¡ÂºÂ£i danh sÃƒÂ¡ch thÃƒÂ nh viÃƒÂªn...</span>
              </div>
            ) : usersList.length > 0 ? (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 font-bold uppercase border-b border-gray-100">
                    <th className="px-6 py-3.5">TÃƒÂªn Ã„â€˜Ã„Æ’ng nhÃ¡ÂºÂ­p</th>
                    <th className="px-6 py-3.5">Email</th>
                    <th className="px-6 py-3.5">SÃ¡Â»â€˜ Ã„â€˜iÃ¡Â»â€¡n thoÃ¡ÂºÂ¡i</th>
                    <th className="px-6 py-3.5">Vai trÃƒÂ²</th>
                    <th className="px-6 py-3.5 text-right">Thao tÃƒÂ¡c</th>
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
                          title={user.id === currentUser?.id ? "KhÃƒÂ´ng thÃ¡Â»Æ’ tÃ¡Â»Â± thay Ã„â€˜Ã¡Â»â€¢i vai trÃƒÂ² bÃ¡ÂºÂ£n thÃƒÂ¢n" : "NhÃ¡ÂºÂ¥p Ã„â€˜Ã¡Â»Æ’ thay Ã„â€˜Ã¡Â»â€¢i vai trÃƒÂ²"}
                        >
                          {user.role}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={user.id === currentUser?.id}
                          className="text-red-500 hover:text-white hover:bg-red-600 p-1.5 rounded-xl transition-all border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          title={user.id === currentUser?.id ? "KhÃƒÂ´ng thÃ¡Â»Æ’ tÃ¡Â»Â± xoÃƒÂ¡ tÃƒÂ i khoÃ¡ÂºÂ£n bÃ¡ÂºÂ£n thÃƒÂ¢n" : "XoÃƒÂ¡ tÃƒÂ i khoÃ¡ÂºÂ£n & toÃƒÂ n bÃ¡Â»â„¢ bÃƒÂ i Ã„â€˜Ã„Æ’ng"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12 text-gray-400 italic">ChÃ†Â°a cÃƒÂ³ ngÃ†Â°Ã¡Â»Âi dÃƒÂ¹ng nÃƒÂ o Ã„â€˜Ã„Æ’ng kÃƒÂ½ trong hÃ¡Â»â€¡ thÃ¡Â»â€˜ng.</div>
            )}
          </div>
        </div>
      )}

      </div>

      {/* ADMIN ADD/EDIT MODAL */}
      {isAdminModalOpen && (
        <div id="admin-form-modal" className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative animate-scale-up max-h-[95vh] flex flex-col justify-between">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-black text-gray-900">
                  {editingRoom ? "Chỉnh sửa Thông Tin Phòng Trọ" : "Thêm Phòng Trọ Mới Vào Hệ Thống"}
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

                <div>
                  <label className="text-xs text-gray-700 font-bold block mb-1">Loại phòng *</label>
                  <select
                    required
                    value={formFields.roomType || "Phòng trọ"}
                    onChange={(e) => setFormFields((prev) => ({ ...prev, roomType: e.target.value as BoardingRoom["roomType"] }))}
                    className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 outline-none bg-white focus:border-blue-500"
                  >
                    {ROOM_TYPE_OPTIONS.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-700 font-bold block mb-1">Giá thuê / tháng (VND) *</label>
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
                    <label className="text-xs text-gray-700 font-bold block mb-1">Tên đường *</label>
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
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">3. Tiện nghi & quy chế phòng trọ</span>
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
                    <select
                      value={formFields.parkingFeeType || "miễn phí"}
                      onChange={(e) => setFormFields((prev) => ({ ...prev, hasParking: true, parkingFeeType: e.target.value as any }))}
                      className="text-xs border border-gray-200 rounded-lg bg-white px-1 py-0.5 outline-none"
                    >
                      <option value="miễn phí">Miễn phí</option>
                      <option value="có phí">Có phí</option>
                    </select>
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
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">4. Ảnh đại diện & liên hệ quản lý</span>
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
                      {uploadMainError}
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
                      {uploadSubError}
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

function AdminListingsDashboard({
  currentUser,
  rooms,
  usersList,
  activeTab,
  setActiveTab,
  selectedOwnerFilter,
  setSelectedOwnerFilter,
  adminSearchQuery,
  setAdminSearchQuery,
  adminStatusFilter,
  setAdminStatusFilter,
  adminTypeFilter,
  setAdminTypeFilter,
  filteredAdminRooms,
  approvedRooms,
  pendingRooms,
  rejectedRooms,
  unavailableRooms,
  needsReviewRooms,
  approvedPercent,
  pendingPercent,
  rejectedPercent,
  unavailablePercent,
  ownerNameById,
  isUsersLoading,
  onViewRoom,
  onEditRoom,
  onDeleteRoom,
  onApproveRoom,
  onRejectRoom,
  onAddRoom,
  onToggleUserRole,
  onDeleteUser,
  onUpdatePostPermission,
}: any) {
  const navItems = [
    { icon: LayoutDashboard, label: "Tổng quan", tab: "rooms" },
    { icon: Users, label: "Quản lí người dùng", tab: "users" },
    { icon: FileText, label: "Quản lí tin đăng", tab: "rooms", active: true },
    { icon: ShieldCheck, label: "Duyệt tin", tab: "rooms" },
    { icon: Package, label: "Gói dịch vụ", tab: "rooms" },
    { icon: BarChart3, label: "Báo cáo", tab: "rooms" },
    { icon: Settings, label: "Cài đặt", tab: "rooms" },
  ];

  return (
    <div className="grid min-h-[calc(100vh-60px)] font-sans lg:grid-cols-[220px_1fr]">
      <aside className="hidden bg-gradient-to-b from-[#052f66] to-[#001f4d] text-white lg:flex lg:flex-col">
        <div className="flex h-[74px] items-center gap-3 px-7">
          <Home className="h-8 w-8 text-[#ffc400]" />
          <span className="text-2xl font-black">Best<span className="text-[#ffc400]">Room</span></span>
        </div>
        <nav className="mt-10 space-y-2 px-4">
          {navItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => currentUser.role === "admin" && setActiveTab(item.tab)}
              className={`flex h-12 w-full items-center gap-4 rounded-lg px-4 text-sm font-bold transition ${
                (item.active && activeTab === "rooms") || (item.tab === "users" && activeTab === "users")
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-950/20"
                  : "text-blue-50/90 hover:bg-white/10"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          ))}
        </nav>
        <button className="mx-5 mb-7 mt-auto flex h-12 items-center justify-between rounded-lg border border-white/25 px-4 text-sm font-bold text-white/95">
          Trung tâm hỗ trợ
          <ArrowRight className="h-4 w-4" />
        </button>
      </aside>

      <section className="min-w-0">
        <div className="flex h-[74px] items-center justify-between border-b border-slate-200 bg-white px-5 lg:px-8">
          <div className="flex items-center gap-5">
            <Menu className="h-6 w-6 text-blue-950" />
            <div className="relative hidden w-[380px] md:block">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={adminSearchQuery}
                onChange={(event) => setAdminSearchQuery(event.target.value)}
                placeholder="Tìm kiếm nhanh..."
                className="h-12 w-full rounded-lg border border-slate-200 bg-white pl-12 pr-14 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 rounded bg-slate-100 px-2 py-1 text-xs font-black text-slate-500">Ctrl K</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Bell className="h-6 w-6 text-blue-950" />
              <span className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-red-500 text-[10px] font-black text-white">12</span>
            </div>
            <div className="hidden items-center gap-3 sm:flex">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-blue-100 text-sm font-black text-blue-700">
                {currentUser.username.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-black text-blue-950">{currentUser.username}</p>
                <p className="text-xs font-semibold text-slate-500">Quản trị viên</p>
              </div>
            </div>
          </div>
        </div>

        {activeTab === "rooms" ? (
          <div className="p-5 lg:p-8">
            <div className="mb-6">
              <h1 className="text-3xl font-black text-blue-950">Quản lí tin đăng</h1>
              <p className="mt-2 text-sm font-semibold text-slate-500">Theo dõi, kiểm duyệt và quản lí toàn bộ tin đăng trên hệ thống</p>
            </div>

            <div className="grid gap-5 xl:grid-cols-4">
              <AdminStatCard icon={FileText} label="Tổng tin đăng" value={rooms.length} tone="blue" delta="12.6%" />
              <AdminStatCard icon={Eye} label="Đang hiển thị" value={approvedRooms.length} tone="green" delta="9.3%" />
              <AdminStatCard icon={Clock} label="Chờ duyệt" value={pendingRooms.length} tone="amber" delta="8.7%" />
              <AdminStatCard icon={XCircle} label="Đã từ chối" value={rejectedRooms.length} tone="red" delta="-5.4%" />
            </div>

            <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_260px]">
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
                  <div className="relative min-w-[240px] flex-1">
                    <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      value={adminSearchQuery}
                      onChange={(event) => setAdminSearchQuery(event.target.value)}
                      placeholder="Tìm kiếm tin đăng..."
                      className="h-11 w-full rounded-lg border border-slate-200 pl-11 pr-3 text-sm font-semibold outline-none focus:border-blue-500"
                    />
                  </div>
                  <select value={adminTypeFilter} onChange={(e) => setAdminTypeFilter(e.target.value)} className="h-11 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-blue-950">
                    <option value="all">Loại phòng</option>
                    {ROOM_TYPE_OPTIONS.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <select value={adminStatusFilter} onChange={(e) => setAdminStatusFilter(e.target.value)} className="h-11 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-blue-950">
                    <option value="all">Trạng thái</option>
                    <option value="approved">Đang hiển thị</option>
                    <option value="pending">Chờ duyệt</option>
                    <option value="rejected">Bị từ chối</option>
                    <option value="hết phòng">Hết hạn</option>
                  </select>
                  <button className="flex h-11 items-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-black text-white hover:bg-blue-700">
                    <Filter className="h-5 w-5" />
                    Lọc
                  </button>
                  <button className="ml-auto flex h-11 items-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-black text-blue-950 hover:bg-slate-50">
                    <Download className="h-4 w-4" />
                    Xuất dữ liệu
                  </button>
                  <button onClick={onAddRoom} className="flex h-11 items-center gap-2 rounded-lg bg-[#ffbd00] px-4 text-sm font-black text-blue-950 hover:bg-[#f2b200]">
                    <Plus className="h-5 w-5" />
                    Thêm tin đăng
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-left">
                    <thead className="bg-slate-50 text-xs font-black text-slate-500">
                      <tr>
                        <th className="px-4 py-4">Ảnh</th>
                        <th className="px-4 py-4">Tiêu đề tin</th>
                        <th className="px-4 py-4">Người đăng</th>
                        <th className="px-4 py-4">Giá</th>
                        <th className="px-4 py-4">Khu vực</th>
                        <th className="px-4 py-4">Ngày đăng</th>
                        <th className="px-4 py-4">Trạng thái</th>
                        <th className="px-4 py-4">Lượt xem</th>
                        <th className="px-4 py-4 text-right">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredAdminRooms.slice(0, 10).map((room: BoardingRoom) => (
                        <tr key={room.id} className="hover:bg-slate-50/70">
                          <td className="px-4 py-4">
                            <img src={room.image || room.images?.[0] || "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=300&q=80"} alt={room.title} className="h-16 w-16 rounded-lg object-cover" referrerPolicy="no-referrer" />
                          </td>
                          <td className="max-w-[230px] px-4 py-4 text-sm font-black leading-6 text-blue-950">{room.title}</td>
                          <td className="px-4 py-4 text-sm font-semibold text-slate-600">{ownerNameById.get(room.ownerId || "") || room.contactName || currentUser.username}</td>
                          <td className="px-4 py-4 text-sm font-black text-blue-950">{room.price.toLocaleString("vi-VN")} đ</td>
                          <td className="px-4 py-4 text-sm font-semibold text-slate-600">{room.district || room.city}</td>
                          <td className="px-4 py-4 text-sm font-semibold text-slate-600">{new Date(room.createdAt).toLocaleDateString("vi-VN")}</td>
                          <td className="px-4 py-4"><AdminStatusBadge room={room} /></td>
                          <td className="px-4 py-4 text-sm font-black text-slate-700">{room.interestedCount || 0}</td>
                          <td className="px-4 py-4">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => onEditRoom(room)} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-blue-950 hover:bg-blue-50"><Eye className="h-4 w-4" /></button>
                              {currentUser.role === "admin" && room.approvalStatus === "pending" && (
                                <button onClick={() => onApproveRoom(room)} className="grid h-9 w-9 place-items-center rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-50"><CheckCircle className="h-4 w-4" /></button>
                              )}
                              {currentUser.role === "admin" && room.approvalStatus !== "rejected" && (
                                <button onClick={() => onRejectRoom(room)} className="grid h-9 w-9 place-items-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50"><Ban className="h-4 w-4" /></button>
                              )}
                              <button onClick={() => onDeleteRoom(room.id)} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600"><MoreVertical className="h-4 w-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 text-sm font-semibold text-slate-500">
                  <span>Hiển thị 1 - {Math.min(filteredAdminRooms.length, 10)} trên {filteredAdminRooms.length} tin đăng</span>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((page) => (
                      <button key={page} className={`grid h-9 w-9 place-items-center rounded-lg border text-sm font-black ${page === 1 ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 text-blue-950"}`}>{page}</button>
                    ))}
                  </div>
                </div>
              </div>

              <aside className="space-y-5">
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="mb-4 text-lg font-black text-blue-950">Phân bổ trạng thái tin đăng</h2>
                  <div className="mx-auto grid h-40 w-40 place-items-center rounded-full" style={{ background: `conic-gradient(#22c55e 0 ${approvedPercent}%, #f59e0b ${approvedPercent}% ${approvedPercent + pendingPercent}%, #ef4444 ${approvedPercent + pendingPercent}% ${approvedPercent + pendingPercent + rejectedPercent}%, #cbd5e1 ${approvedPercent + pendingPercent + rejectedPercent}% 100%)` }}>
                    <div className="grid h-24 w-24 place-items-center rounded-full bg-white text-center">
                      <strong className="block text-xl font-black text-blue-950">{rooms.length}</strong>
                      <span className="text-xs font-semibold text-slate-500">Tổng</span>
                    </div>
                  </div>
                  <div className="mt-5 space-y-3 text-sm font-semibold text-slate-600">
                    <Legend color="bg-emerald-500" label="Đang hiển thị" value={`${approvedRooms.length} (${approvedPercent}%)`} />
                    <Legend color="bg-amber-500" label="Chờ duyệt" value={`${pendingRooms.length} (${pendingPercent}%)`} />
                    <Legend color="bg-red-500" label="Bị từ chối" value={`${rejectedRooms.length} (${rejectedPercent}%)`} />
                    <Legend color="bg-slate-300" label="Hết hạn" value={`${unavailableRooms.length} (${unavailablePercent}%)`} />
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-black text-blue-950">Tin cần xử lý</h2>
                    <button className="text-sm font-black text-blue-600">Xem tất cả</button>
                  </div>
                  <div className="space-y-3">
                    {(needsReviewRooms.length ? needsReviewRooms : filteredAdminRooms.slice(0, 5)).map((room: BoardingRoom, index: number) => (
                      <div key={room.id} className="flex gap-3 border-b border-slate-100 pb-3 last:border-b-0">
                        <img src={room.image || room.images?.[0] || "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=200&q=80"} alt={room.title} className="h-12 w-12 rounded-lg object-cover" referrerPolicy="no-referrer" />
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-xs font-black text-blue-950">{room.title}</p>
                          <span className={`mt-1 inline-block rounded px-2 py-0.5 text-[10px] font-black ${room.approvalStatus === "rejected" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"}`}>
                            {room.approvalStatus === "rejected" ? "Bị từ chối" : "Chờ duyệt"}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-slate-400">{index + 2} giờ trước</span>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        ) : (
          <AdminUsersPanel currentUser={currentUser} usersList={usersList} isUsersLoading={isUsersLoading} onToggleUserRole={onToggleUserRole} onDeleteUser={onDeleteUser} onUpdatePostPermission={onUpdatePostPermission} />
        )}
      </section>
    </div>
  );
}

function AdminStatCard({ icon: Icon, label, value, tone, delta }: { icon: React.ElementType; label: string; value: number; tone: "blue" | "green" | "amber" | "red"; delta: string }) {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-500",
  };

  return (
    <div className="flex items-center gap-5 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <span className={`grid h-14 w-14 place-items-center rounded-lg ${tones[tone]}`}>
        <Icon className="h-7 w-7" />
      </span>
      <div>
        <p className="text-sm font-black text-blue-950">{label}</p>
        <p className="mt-2 text-3xl font-black text-slate-950">{value.toLocaleString("vi-VN")}</p>
        <p className={`mt-2 text-xs font-bold ${delta.startsWith("-") ? "text-red-500" : "text-emerald-600"}`}>
          {delta.startsWith("-") ? "↓" : "↑"} {delta} so với tháng trước
        </p>
      </div>
    </div>
  );
}

function AdminStatusBadge({ room }: { room: BoardingRoom }) {
  if (room.approvalStatus === "pending") {
    return <span className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-black text-amber-600">Chờ duyệt</span>;
  }
  if (room.approvalStatus === "rejected") {
    return <span className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-500">Bị từ chối</span>;
  }
  if (room.status === "hết phòng") {
    return <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-500">Hết hạn</span>;
  }
  return <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-600">Đang hiển thị</span>;
}

function Legend({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
        {label}
      </span>
      <strong className="text-right text-slate-500">{value}</strong>
    </div>
  );
}

function AdminUsersPanel({ currentUser, usersList, isUsersLoading, onToggleUserRole, onDeleteUser, onUpdatePostPermission }: any) {
  const permissionBadge = (status?: string) => {
    if (status === "approved") return "border-emerald-200 bg-emerald-50 text-emerald-600";
    if (status === "pending") return "border-amber-200 bg-amber-50 text-amber-600";
    if (status === "rejected") return "border-red-200 bg-red-50 text-red-600";
    return "border-slate-200 bg-slate-50 text-slate-500";
  };
  const permissionLabel = (status?: string) => {
    if (status === "approved") return "Đã duyệt";
    if (status === "pending") return "Chờ duyệt";
    if (status === "rejected") return "Từ chối";
    return "Chưa yêu cầu";
  };

  return (
    <div className="p-5 lg:p-8">
      <div className="rounded-lg border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-50 bg-gray-50/50 px-6 py-4">
          <h3 className="text-base font-black text-gray-900">Danh sách tài khoản thành viên</h3>
          <p className="mt-0.5 text-xs text-gray-400">Quản lí nâng cấp/hạ cấp vai trò thành viên hoặc xoá vĩnh viễn tài khoản.</p>
        </div>
        <div className="overflow-x-auto">
          {isUsersLoading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="text-xs font-medium text-gray-400">Đang tải danh sách thành viên...</span>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 font-bold uppercase text-gray-500">
                  <th className="px-6 py-3.5">Tên đăng nhập</th>
                  <th className="px-6 py-3.5">Email</th>
                  <th className="px-6 py-3.5">Số điện thoại</th>
                  <th className="px-6 py-3.5">Vai trò</th>
                  <th className="px-6 py-3.5">Quyền đăng tin</th>
                  <th className="px-6 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usersList.map((user: any) => (
                  <tr key={user.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-bold text-gray-900">{user.username}</td>
                    <td className="px-6 py-4 font-medium text-gray-600">{user.email}</td>
                    <td className="px-6 py-4 font-mono font-bold text-gray-600">{user.phone}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => onToggleUserRole(user)} disabled={user.id === currentUser?.id} className={`rounded px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide ${user.role === "admin" ? "bg-amber-100 text-amber-800" : "bg-blue-50 text-blue-600"} disabled:opacity-50`}>
                        {user.role}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-lg border px-2.5 py-1 text-[10px] font-black ${permissionBadge(user.postPermissionStatus)}`}>
                          {permissionLabel(user.postPermissionStatus)}
                        </span>
                        {user.postPermissionStatus === "pending" && (
                          <>
                            <button onClick={() => onUpdatePostPermission(user, "approve")} className="rounded-lg bg-emerald-600 px-3 py-1 text-[10px] font-black text-white hover:bg-emerald-700">
                              Duyệt
                            </button>
                            <button onClick={() => onUpdatePostPermission(user, "reject")} className="rounded-lg border border-red-200 px-3 py-1 text-[10px] font-black text-red-600 hover:bg-red-50">
                              Từ chối
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => onDeleteUser(user.id)} disabled={user.id === currentUser?.id} className="rounded-lg p-1.5 text-red-500 hover:bg-red-600 hover:text-white disabled:opacity-50">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
