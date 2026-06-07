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
}

const INITIAL_FILTERS: FilterOptions = {
  searchQuery: "",
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
      const roomsData = await roomService.getRooms(currentUser?.role, currentUser?.id);
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
