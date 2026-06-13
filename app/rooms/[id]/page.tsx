"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { roomService } from "@/services/roomService";
import PageLoader from "@/components/PageLoader";

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { setSelectedRoom } = useApp();
  const roomId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadRoom = async () => {
      if (!roomId) return;

      try {
        setError(null);
        const room = await roomService.getRoom(roomId);
        if (mounted) {
          setSelectedRoom(room);
        }
      } catch (err: any) {
        if (mounted) {
          setSelectedRoom(null);
          setError(err.message || "Không thể tải thông tin phòng trọ.");
        }
      }
    };

    loadRoom();

    return () => {
      mounted = false;
    };
  }, [roomId, setSelectedRoom]);

  if (error) {
    return (
      <div className="mx-auto flex min-h-[420px] max-w-[1200px] flex-col items-center justify-center px-4 py-16 text-center">
        <h1 className="text-2xl font-black text-blue-950">Không tìm thấy phòng trọ</h1>
        <p className="mt-3 max-w-md text-sm font-semibold leading-6 text-slate-500">{error}</p>
        <button
          type="button"
          onClick={() => router.push("/search")}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-black text-white hover:bg-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại tìm phòng
        </button>
      </div>
    );
  }

  return <PageLoader text="Đang tải thông tin phòng trọ..." className="min-h-[420px] py-16" />;
}
