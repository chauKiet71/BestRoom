"use client";

import { Heart, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import RoomCard from "@/components/RoomCard";
import { useApp } from "@/context/AppContext";

export default function FavoritesPage() {
  const router = useRouter();
  const {
    currentUser,
    favoriteRooms,
    viewRoomDetails,
    setAuthModalMode,
    setIsAuthModalOpen,
  } = useApp();

  const openLogin = () => {
    setAuthModalMode("login");
    setIsAuthModalOpen(true);
  };

  if (!currentUser) {
    return (
      <main className="min-h-[60vh] bg-slate-50 py-16">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <section className="mx-auto flex max-w-[520px] flex-col items-center rounded-xl border border-blue-100 bg-white px-6 py-12 text-center shadow-sm">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-blue-50 text-blue-600">
            <Heart className="h-8 w-8" />
          </span>
          <h1 className="mt-5 text-2xl font-black text-blue-950">Danh sách yêu thích</h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
            Vui lòng đăng nhập để xem và quản lý các phòng trọ bạn đã lưu.
          </p>
          <button
            type="button"
            onClick={openLogin}
            className="mt-7 h-11 rounded-lg bg-blue-600 px-6 text-sm font-black text-white shadow-sm hover:bg-blue-700"
          >
            Đăng nhập ngay
          </button>
        </section>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-slate-50 py-8">
      <section className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-700">
              <Heart className="h-4 w-4 fill-blue-600 text-blue-600" />
              Yêu thích
            </span>
            <h1 className="mt-3 text-3xl font-black text-blue-950">Phòng trọ đã lưu</h1>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Danh sách phòng trọ bạn đã thêm vào yêu thích.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/search")}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-5 text-sm font-black text-blue-700 shadow-sm hover:bg-blue-50"
          >
            <Search className="h-4 w-4" />
            Tìm thêm phòng
          </button>
        </div>

        {favoriteRooms.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {favoriteRooms.map((room) => (
              <RoomCard key={room.id} room={room} onViewDetails={viewRoomDetails} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-blue-100 bg-white px-6 py-14 text-center shadow-sm">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-blue-50 text-blue-600">
              <Heart className="h-8 w-8" />
            </div>
            <h2 className="mt-5 text-xl font-black text-blue-950">Bạn chưa lưu phòng nào</h2>
            <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-slate-500">
              Hãy bấm icon trái tim hoặc nút Lưu tin ở trang chi tiết để thêm phòng vào danh sách yêu thích.
            </p>
            <button
              type="button"
              onClick={() => router.push("/search")}
              className="mt-7 h-11 rounded-lg bg-blue-600 px-6 text-sm font-black text-white shadow-sm hover:bg-blue-700"
            >
              Khám phá phòng trọ
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
