"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bath, Briefcase, CheckCircle, Heart, Home, MapPin, ShieldCheck, Snowflake, Trash2, Wifi, XCircle } from "lucide-react";
import { BoardingRoom } from "@/types";
import { useApp } from "@/context/AppContext";
import { roomDetailPath } from "@/lib/routes";

interface RoomCardProps {
  room: BoardingRoom;
  onViewDetails?: (room: BoardingRoom) => void;
  onEdit?: (room: BoardingRoom) => void;
  onDelete?: (id: string) => void;
  onApprove?: (room: BoardingRoom) => void;
  onReject?: (room: BoardingRoom) => void;
  isAdminMode?: boolean;
  currentRole?: string;
  titleLines?: 1 | 2;
  variant?: "card" | "searchList";
}

export function formatVND(amount: number): string {
  return `${amount.toLocaleString("vi-VN")} đ/tháng`;
}

function formatRelativeTime(value?: string): string {
  if (!value) return "Vừa đăng";
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "Vừa đăng";

  const diffMinutes = Math.max(1, Math.floor((Date.now() - timestamp) / 60000));
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} ngày trước`;

  return new Date(value).toLocaleDateString("vi-VN");
}

export default function RoomCard({
  room,
  onViewDetails,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  isAdminMode = false,
  currentRole = "user",
  titleLines = 1,
  variant = "card",
}: RoomCardProps) {
  const { isFavoriteRoom, toggleFavoriteRoom } = useApp();
  const router = useRouter();
  const isSaved = isFavoriteRoom(room.id);
  const location = [room.district, room.city].filter(Boolean).join(", ");
  const detailHref = roomDetailPath(room.id);
  const titleClassName = `${titleLines === 2 ? "min-h-12" : ""} text-base font-black text-slate-950 transition hover:text-blue-700`;
  const titleClampStyle = {
    display: "-webkit-box",
    WebkitBoxOrient: "vertical" as const,
    WebkitLineClamp: titleLines,
    overflow: "hidden",
  };

  if (variant === "searchList" && !isAdminMode) {
    return (
      <article
        id={`room-card-${room.id}`}
        role="link"
        tabIndex={0}
        onClick={() => router.push(detailHref)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            router.push(detailHref);
          }
        }}
        className="group relative grid cursor-pointer gap-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg sm:grid-cols-[220px_minmax(0,1fr)_56px]"
      >
        <Link href={detailHref} className="relative h-44 overflow-hidden rounded-lg bg-slate-100 sm:h-40">
          <img
            src={room.image || room.images?.[0] || "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80"}
            alt={room.title}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <span className={`absolute right-3 top-3 z-10 rounded-full px-3 py-1 text-xs font-black text-white shadow-md ${room.status === "hết phòng" ? "bg-gray-500" : "bg-emerald-500"}`}>
            {room.status === "hết phòng" ? "Hết phòng" : "Còn phòng"}
          </span>
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/75 via-black/35 to-transparent px-3 pb-2 pt-8 text-xs text-white">
            <span>{formatRelativeTime(room.createdAt)}</span>
            <span>{room.interestedCount || 0} lượt xem</span>
          </div>
        </Link>

        <div className="min-w-0 py-1">
          <div className="flex flex-wrap items-start gap-2">
            <Link
              href={detailHref}
              className="min-w-0 flex-1 text-lg leading-snug text-slate-950 transition hover:text-blue-700"
              style={titleClampStyle}
            >
              {room.title}
            </Link>
          </div>

          <p className="mt-2 text-sm font-semibold text-slate-500">{room.roomType || "Phòng trọ"}</p>

          <div className="mt-2 flex flex-wrap items-baseline gap-x-5 gap-y-1">
            <p className="text-xl font-black font-semibold text-rose-500">{formatVND(room.price)}</p>
            <p className="text-lg  text-slate-950">{room.area} m²</p>
          </div>

          <p className="mt-3 flex items-center gap-2 text-sm  text-slate-500">
            <MapPin className="h-4 w-4 shrink-0 fill-slate-300 text-slate-300" />
            <span className="line-clamp-1">{location || room.street || "Đang cập nhật"}</span>
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span className="grid h-7 w-7 place-items-center overflow-hidden rounded-full bg-blue-50 text-xs text-blue-700">
              {(room.ownerFullname || room.contactName || "BR").slice(0, 2).toUpperCase()}
            </span>
            <span className="text-slate-800">{room.ownerFullname || room.contactName || "BestRoom"}</span>
            <Briefcase className="h-4 w-4 text-slate-400" />
            <span>{Math.max(1, Math.round((room.interestedCount || 0) / 10))} tin đăng</span>
          </div>
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleFavoriteRoom(room);
          }}
          className={`absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white shadow-md transition sm:static sm:self-end sm:justify-self-center sm:bg-transparent sm:shadow-none ${
            isSaved ? "text-blue-600" : "text-slate-950 hover:text-blue-600"
          }`}
          aria-label={isSaved ? "Bỏ lưu tin" : "Lưu tin"}
        >
          <Heart className={`h-7 w-7 ${isSaved ? "fill-blue-600" : ""}`} />
        </button>
      </article>
    );
  }

  return (
    <article
      id={`room-card-${room.id}`}
      className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative h-40 overflow-hidden bg-slate-100">
        <img
          src={room.image || room.images?.[0] || "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80"}
          alt={room.title}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <span className={`absolute left-3 top-3 z-10 rounded-full px-3 py-1 text-xs font-black text-white shadow-md ${room.status === "hết phòng" ? "bg-gray-500" : "bg-emerald-500"}`}>
          {room.status === "hết phòng" ? "Hết phòng" : "Còn phòng"}
        </span>
        {!isAdminMode && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              toggleFavoriteRoom(room);
            }}
            className={`absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white/95 shadow-md backdrop-blur transition ${
              isSaved ? "text-blue-600" : "text-slate-500 hover:text-blue-600"
            }`}
            aria-label={isSaved ? "Bỏ lưu tin" : "Lưu tin"}
          >
            <Heart className={`h-6 w-6 ${isSaved ? "fill-blue-600" : ""}`} />
          </button>
        )}
      </div>

      <div className="p-4">
        {isAdminMode ? (
          <h3
            onClick={() => onViewDetails?.(room)}
            className={`${titleClassName} cursor-pointer`}
            style={titleClampStyle}
          >
            {room.title}
          </h3>
        ) : (
          <Link href={detailHref} className={`block ${titleClassName}`} style={titleClampStyle}>
            {room.title}
          </Link>
        )}
        <p className="mt-2 text-xl font-black text-blue-700">{formatVND(room.price)}</p>
        <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-slate-600">
          <MapPin className="h-4 w-4 shrink-0 text-slate-700" />
          <span className="line-clamp-1">{location || room.street || "Đang cập nhật"}</span>
        </p>

        <div className="mt-4 grid grid-cols-3 gap-x-3 gap-y-3 text-sm font-black text-slate-700">
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <Home className="h-4 w-4 text-slate-600" />
            {room.area} m²
          </span>
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <Bath className="h-4 w-4 text-slate-600" />
            WC riêng
          </span>
          {room.hasAirConditioner && (
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <Snowflake className="h-4 w-4 text-slate-600" />
              Máy lạnh
            </span>
          )}
          {room.hasWifi && (
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <Wifi className="h-4 w-4 text-slate-600" />
              Wi-Fi
            </span>
          )}
        </div>

        {isAdminMode ? (
          <button
            id={`btn-view-room-${room.id}`}
            type="button"
            onClick={() => onViewDetails?.(room)}
            className="mt-5 flex h-10 w-full items-center justify-center rounded-lg border border-blue-600 text-sm font-black text-blue-700 transition hover:bg-blue-600 hover:text-white"
          >
            Xem chi tiết
          </button>
        ) : (
          <Link
            id={`btn-view-room-${room.id}`}
            href={detailHref}
            className="mt-5 flex h-10 w-full items-center justify-center rounded-lg border border-blue-600 text-sm font-black text-blue-700 transition hover:bg-blue-600 hover:text-white"
          >
            Xem chi tiết
          </Link>
        )}

        {isAdminMode && (
          <div className="mt-4 grid gap-2 border-t border-slate-100 pt-4">
            {currentRole === "admin" && room.approvalStatus === "pending" && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onApprove?.(room)}
                  className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-xs font-black text-emerald-700 hover:bg-emerald-100"
                >
                  <CheckCircle className="h-4 w-4" />
                  Duyệt tin
                </button>
                <button
                  type="button"
                  onClick={() => onReject?.(room)}
                  className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 text-xs font-black text-red-600 hover:bg-red-100"
                >
                  <XCircle className="h-4 w-4" />
                  Từ chối
                </button>
              </div>
            )}
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <button
                type="button"
                onClick={() => onEdit?.(room)}
                className="h-9 rounded-lg border border-amber-200 bg-amber-50 text-xs font-black text-amber-700 hover:bg-amber-100"
              >
                Sửa phòng
              </button>
              <button
                type="button"
                onClick={() => onDelete?.(room.id)}
                className="grid h-9 w-10 place-items-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                aria-label="Xoá phòng"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
