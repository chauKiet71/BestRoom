"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, BoardingRoom, FilterOptions } from "@/types";
import { roomService } from "@/services/roomService";
import { metaService } from "@/services/metaService";

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  rooms: BoardingRoom[];
  setRooms: React.Dispatch<React.SetStateAction<BoardingRoom[]>>;
  loading: boolean;
  error: string | null;
  setError: (err: string | null) => void;
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  metadata: {
    cities: string[];
    wards: string[];
    streets: string[];
    years: number[];
  };
  refreshData: () => Promise<void>;
  logout: () => void;
  resetFilters: () => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalMode: "login" | "register" | "forgot" | "reset";
  setAuthModalMode: (mode: "login" | "register" | "forgot" | "reset") => void;
  selectedRoom: BoardingRoom | null;
  setSelectedRoom: (room: BoardingRoom | null) => void;
  viewRoomDetails: (room: BoardingRoom) => Promise<void>;
  favoriteRoomIds: string[];
  favoriteRooms: BoardingRoom[];
  isFavoriteRoom: (roomId: string) => boolean;
  toggleFavoriteRoom: (room: BoardingRoom) => void;
}

const INITIAL_FILTERS: FilterOptions = {
  searchQuery: "",
  roomType: "all",
  priceRange: "all",
  areaRange: "all",
  city: "",
  district: "",
  ward: "",
  street: "",
  isSharedOwner: "all",
  rating: null,
  hasWifi: "all",
  waterFeeType: "all",
  status: "all",
  hoursType: "all",
  buildYear: "all",
  hasParking: "all",
  parkingFeeType: "all",
  isPeopleLimited: "all",
  hasElevator: "all",
  hasContract: "all",
  hasBalcony: "all",
  hasMezzanine: "all",
  hasFurniture: "all",
  hasAirConditioner: "all",
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppContextProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [rooms, setRooms] = useState<BoardingRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>(INITIAL_FILTERS);
  const [metadata, setMetadata] = useState({
    cities: [] as string[],
    wards: [] as string[],
    streets: [] as string[],
    years: [] as number[],
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register" | "forgot" | "reset">("login");
  const [selectedRoom, setSelectedRoom] = useState<BoardingRoom | null>(null);
  const [favoriteRoomIds, setFavoriteRoomIds] = useState<string[]>([]);

  const favoriteStorageKey = currentUser?.id ? `bestroom_favorites_${currentUser.id}` : "";

  // Load user from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("bestroom_user");
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to read user from localStorage", e);
    }
  }, []);

  const refreshData = async () => {
    try {
      setLoading(true);
      setError(null);
      const roomsData = await roomService.getRooms(
        currentUser?.role,
        currentUser?.id,
        currentUser?.role === "admin" ? undefined : { limit: 20 }
      );
      setRooms(roomsData);

      const metaData = await metaService.getMeta();
      setMetadata(metaData);
    } catch (err: any) {
      console.error("Error refreshing application data:", err);
      setError(err.message || "Không thể đồng bộ dữ liệu với máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [currentUser]);

  useEffect(() => {
    if (!favoriteStorageKey) {
      setFavoriteRoomIds([]);
      return;
    }

    try {
      const stored = localStorage.getItem(favoriteStorageKey);
      const parsed = stored ? JSON.parse(stored) : [];
      setFavoriteRoomIds(Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : []);
    } catch (e) {
      console.error("Failed to read favorites from localStorage", e);
      setFavoriteRoomIds([]);
    }
  }, [favoriteStorageKey]);

  const logout = () => {
    localStorage.removeItem("bestroom_user");
    setCurrentUser(null);
  };

  const resetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  const viewRoomDetails = async (room: BoardingRoom) => {
    setSelectedRoom(room);
    try {
      const updatedRoom = await roomService.getRoom(room.id);
      setRooms((prev) =>
        prev.map((r) =>
          r.id === room.id ? { ...r, interestedCount: updatedRoom.interestedCount } : r
        )
      );
      setSelectedRoom(updatedRoom);
    } catch (e) {
      console.error("Lỗi cập nhật số lượt quan tâm", e);
    }
  };

  const isFavoriteRoom = (roomId: string) => favoriteRoomIds.includes(roomId);

  const toggleFavoriteRoom = (room: BoardingRoom) => {
    if (!currentUser) {
      setAuthModalMode("login");
      setIsAuthModalOpen(true);
      return;
    }

    setFavoriteRoomIds((prev) => {
      const next = prev.includes(room.id) ? prev.filter((id) => id !== room.id) : [room.id, ...prev];
      localStorage.setItem(`bestroom_favorites_${currentUser.id}`, JSON.stringify(next));
      return next;
    });
  };

  const favoriteRooms = favoriteRoomIds
    .map((roomId) => rooms.find((room) => room.id === roomId))
    .filter((room): room is BoardingRoom => Boolean(room));

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        rooms,
        setRooms,
        loading,
        error,
        setError,
        filters,
        setFilters,
        metadata,
        refreshData,
        logout,
        resetFilters,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        selectedRoom,
        setSelectedRoom,
        viewRoomDetails,
        favoriteRoomIds,
        favoriteRooms,
        isFavoriteRoom,
        toggleFavoriteRoom,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppContextProvider");
  }
  return context;
}
export { INITIAL_FILTERS };
