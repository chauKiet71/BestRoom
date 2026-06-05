"use client";

import { MapPin, Maximize2, Star, Eye, Calendar } from "lucide-react";
import { BoardingRoom } from "@/types";

interface RoomCardProps {
  room: BoardingRoom;
  onViewDetails?: (room: BoardingRoom) => void;
  onEdit?: (room: BoardingRoom) => void;
  onDelete?: (id: string) => void;
  isAdminMode?: boolean;
}

export function formatVND(amount: number): string {
  if (amount >= 1000000) {
    return (amount / 1000000).toFixed(1).replace(/\.0$/, "") + " triệu/tháng";
  }
  return amount.toLocaleString("vi-VN") + " đ/tháng";
}

export default function RoomCard({
  room,
  onViewDetails,
  onEdit,
  onDelete,
  isAdminMode = false,
}: RoomCardProps) {
  const statusColor = room.status === "còn phòng" 
    ? "bg-emerald-500 text-white" 
    : "bg-gray-400 text-white";

  return (
    <div 
      id={`room-card-${room.id}`}
      className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs hover:shadow-lg hover:border-gray-200 transition-all duration-300 flex flex-col justify-between"
    >
      {/* Visual Header & Room Status Banner */}
      <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
        <img
          src={room.image || "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80"}
          alt={room.title}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Availability Badge */}
        <span 
          className={`absolute top-3 left-3 px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wider ${statusColor} shadow-md`}
        >
          {room.status}
        </span>

        {/* View Interested Counter overlay */}
        <span className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-md flex items-center gap-1 font-medium select-none">
          <Eye className="h-3 w-3" />
          <span>{room.interestedCount} quan tâm</span>
        </span>
      </div>

      {/* Main Metadata Content Area */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Header Subtitle Row: City Location & Date Category */}
          <div className="flex items-center justify-between text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider font-mono">
            <span>{room.city}</span>
            <span>{new Date(room.createdAt).toLocaleDateString("vi-VN")}</span>
          </div>

          {/* Room Title */}
          <h3 
            className="text-[15px] font-semibold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors cursor-pointer"
            onClick={() => onViewDetails?.(room)}
          >
            {room.title}
          </h3>

          {/* Location Detailed Row */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2 mb-3">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-red-400" />
            <span className="line-clamp-1">
              {room.street}, {room.ward}{room.district ? `, ${room.district}` : ""}{room.city ? `, ${room.city}` : ""}
            </span>
          </div>

          {/* Pricing and Area Indicator Grid */}
          <div className="flex items-end justify-between border-b border-gray-100 pb-3 mb-3">
            <div>
              <span className="text-xs text-gray-400 block font-medium">Giá Thuê</span>
              <span className="text-[17px] font-bold text-red-600">{formatVND(room.price)}</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-400 block font-medium">Diện Tích</span>
              <span className="text-sm font-semibold text-gray-700 flex items-center justify-end gap-1">
                <Maximize2 className="h-3.5 w-3.5 text-gray-500" />
                {room.area} m²
              </span>
            </div>
          </div>

          {/* Crucial Amenities Filters Display (Wifi, Owner, Water) */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            <span className={`text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-md ${room.hasWifi ? "bg-blue-50 text-blue-600 border border-blue-100" : "bg-gray-50 text-gray-400 border border-gray-100"}`}>
              {room.hasWifi ? "Có Wifi" : "Không Wifi"}
            </span>
            <span className={`text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-md ${room.isSharedOwner ? "bg-amber-50 text-amber-700 border border-amber-100" : "bg-indigo-50 text-indigo-700 border border-indigo-100"}`}>
              {room.isSharedOwner ? "Chung chủ" : "Không chung chủ"}
            </span>
            <span className="text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
              Nước {room.waterFeeType}
            </span>
            {room.hasBalcony && (
              <span className="text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-100">
                Có ban công
              </span>
            )}
            {room.hasMezzanine && (
              <span className="text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-100">
                Có gác
              </span>
            )}
            {room.hasFurniture && (
              <span className="text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-100">
                Có nội thất
              </span>
            )}
            <span className="text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-md bg-gray-50 text-gray-600 border border-gray-200 flex items-center gap-0.5 font-mono">
              <Calendar className="h-2.5 w-2.5" />
              Năm: {room.buildYear}
            </span>
          </div>
        </div>

        {/* Footer Rating and Clicks Row */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-50">
          <div className="flex items-center gap-1 text-amber-400">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3.5 w-3.5 ${
                  i < room.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"
                }`}
              />
            ))}
            <span className="text-xs text-gray-500 font-semibold ml-1">{room.rating}.0</span>
          </div>

          <button
            id={`btn-view-room-${room.id}`}
            onClick={() => onViewDetails?.(room)}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors py-1 cursor-pointer"
          >
            Xem Chi Tiết &rarr;
          </button>
        </div>

        {/* Admin Operational Actions Overlay */}
        {isAdminMode && (
          <div className="mt-4 pt-3 border-t border-red-50 flex gap-2 w-full">
            <button
              id={`admin-edit-btn-${room.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(room);
              }}
              className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs py-2 px-3 rounded-xl border border-amber-200 transition-colors cursor-pointer text-center"
            >
              Sửa phòng
            </button>
            <button
              id={`admin-delete-btn-${room.id}`}
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Bạn có chắc chắn muốn xoá phòng trọ này?")) {
                  onDelete?.(room.id);
                }
              }}
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs py-2 px-3 rounded-xl border border-rose-200 transition-colors cursor-pointer text-center"
            >
              Xoá
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
