"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, Plus, Trash2, X, ArrowRight, Star } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { BoardingRoom } from "@/types";
import { roomService } from "@/services/roomService";
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
    electricityPrice: 3500,
  });

  const handleDeleteRoom = async (id: string) => {
    try {
      const data = await roomService.deleteRoom(id, currentUser?.role || "");
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
      contactName: "Quản Lý Nhà Trọ",
      contactPhone: "0909000111",
      image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
      images: [
        "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
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
      electricityPrice: room.electricityPrice || 3500,
      district: room.district || "",
    });
    setIsAdminModalOpen(true);
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFields.title || !formFields.price || !formFields.city) {
      alert("Vui lòng nhập các thông tin bắt buộc: Tiêu đề, Giá phòng, Tỉnh/Thành phố.");
      return;
    }

    try {
      const userRole = currentUser?.role || "";
      if (editingRoom) {
        const saved = await roomService.updateRoom(editingRoom.id, formFields, userRole);
        setRooms((prev) => prev.map((r) => (r.id === saved.id ? saved : r)));
      } else {
        const saved = await roomService.createRoom(formFields, userRole);
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

  if (currentUser?.role !== "admin") {
    return (
      <div id="admin-locked-view" className="max-w-md mx-auto px-4 py-16 text-center space-y-6 flex-1 flex flex-col justify-center">
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
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3.5 rounded-xl transition-all shadow-md mt-2 flex items-center justify-center gap-1.5 cursor-pointer border-none"
        >
          <span>Đăng Nhập Admin Thử Nghiệm</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
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
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 px-5 rounded-xl transition-all duration-150 shadow-md flex items-center justify-center gap-2 cursor-pointer self-start sm:self-center border-none"
        >
          <Plus className="h-4 w-4" />
          Thêm phòng trọ mới
        </button>
      </div>

      {/* CRUD Rooms List */}
      <div className="space-y-6">
        {rooms.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                isAdminMode={true}
                onViewDetails={viewRoomDetails}
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
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-xl text-center border-none cursor-pointer"
            >
              Thêm phòng trọ đầu tiên
            </button>
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

                <div>
                  <label className="text-xs text-gray-700 font-bold block mb-1">Đường dẫn hình ảnh trực tuyến (URL)</label>
                  <input
                    type="text"
                    placeholder="Đường dẫn https://... (Để trống sẽ lấy ảnh mẫu tự động)"
                    value={formFields.image}
                    onChange={(e) => setFormFields((prev) => ({ ...prev, image: e.target.value }))}
                    className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 outline-none bg-white focus:border-blue-500"
                  />
                </div>

                <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-gray-850 font-bold block">Danh sách nhiều ảnh phụ ({formFields.images?.length || 0} ảnh)</label>
                    <button
                      type="button"
                      onClick={() => {
                        const current = formFields.images || [];
                        setFormFields((prev) => ({ ...prev, images: [...current, ""] }));
                      }}
                      className="text-blue-600 hover:text-blue-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer bg-transparent border-none"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Thêm link ảnh</span>
                    </button>
                  </div>

                  {Array.isArray(formFields.images) && formFields.images.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                      {formFields.images.map((imgUrl, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <div className="h-10 w-12 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                            {imgUrl ? (
                              <img src={imgUrl} className="h-full w-full object-cover" alt="Preview" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-[10px] text-gray-400 font-mono">N/A</div>
                            )}
                          </div>
                          <input
                            type="text"
                            placeholder="URL hình ảnh phụ..."
                            value={imgUrl || ""}
                            onChange={(e) => {
                              const updated = [...formFields.images!];
                              updated[i] = e.target.value;
                              setFormFields((prev) => ({ ...prev, images: updated }));
                            }}
                            className="flex-1 text-xs border border-gray-200 rounded-xl px-2.5 py-1.5 outline-none bg-white focus:border-blue-500"
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
                    <p className="text-[10px] text-gray-400 italic">Chưa có ảnh phụ nào được thêm.</p>
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

                <div>
                  <label className="text-xs text-gray-700 font-bold block mb-1">Xếp hạng uy tín - {formFields.rating} sao</label>
                  <div className="flex gap-1.5 items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormFields((prev) => ({ ...prev, rating: star }))}
                        className="p-1 cursor-pointer bg-transparent border-none"
                      >
                        <Star className={`h-6 w-6 ${star <= (formFields.rating || 5) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                      </button>
                    ))}
                  </div>
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
