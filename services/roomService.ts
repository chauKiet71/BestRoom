import { apiFetch } from "./api";
import { BoardingRoom } from "@/types";

export const roomService = {
  async getRooms(userRole?: string, userId?: string): Promise<BoardingRoom[]> {
    const headers: Record<string, string> = {};
    if (userRole) headers["x-user-role"] = userRole;
    if (userId) headers["x-user-id"] = userId;
    return apiFetch("/api/rooms", { headers });
  },

  async getRoom(id: string): Promise<BoardingRoom> {
    return apiFetch(`/api/rooms/${id}`);
  },

  async createRoom(data: Partial<BoardingRoom>, userRole: string, userId: string): Promise<BoardingRoom> {
    return apiFetch("/api/rooms", {
      method: "POST",
      headers: {
        "x-user-role": userRole,
        "x-user-id": userId,
      },
      body: JSON.stringify(data),
    });
  },

  async updateRoom(
    id: string,
    data: Partial<BoardingRoom>,
    userRole: string,
    userId: string
  ): Promise<BoardingRoom> {
    return apiFetch(`/api/rooms/${id}`, {
      method: "PUT",
      headers: {
        "x-user-role": userRole,
        "x-user-id": userId,
      },
      body: JSON.stringify(data),
    });
  },

  async deleteRoom(id: string, userRole: string, userId: string): Promise<{ success: boolean; message: string }> {
    return apiFetch(`/api/rooms/${id}`, {
      method: "DELETE",
      headers: {
        "x-user-role": userRole,
        "x-user-id": userId,
      },
    });
  },

  async approveRoom(
    id: string,
    action: "approve" | "reject",
    reason: string | undefined,
    userRole: string,
    userId: string
  ): Promise<{ success: boolean; room: BoardingRoom }> {
    return apiFetch(`/api/rooms/${id}/approve`, {
      method: "POST",
      headers: {
        "x-user-role": userRole,
        "x-user-id": userId,
      },
      body: JSON.stringify({ action, reason }),
    });
  },

  async submitReview(
    roomId: string,
    reviewData: { userId: string; username: string; rating: number; comment: string }
  ): Promise<{ success: boolean; newReview: any; updatedRating: number; reviews: any[] }> {
    return apiFetch(`/api/rooms/${roomId}/reviews`, {
      method: "POST",
      body: JSON.stringify(reviewData),
    });
  },
};
