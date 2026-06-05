import { apiFetch } from "./api";
import { BoardingRoom } from "@/types";

export const roomService = {
  async getRooms(): Promise<BoardingRoom[]> {
    return apiFetch("/api/rooms");
  },

  async getRoom(id: string): Promise<BoardingRoom> {
    return apiFetch(`/api/rooms/${id}`);
  },

  async createRoom(data: Partial<BoardingRoom>, userRole: string): Promise<BoardingRoom> {
    return apiFetch("/api/rooms", {
      method: "POST",
      headers: {
        "x-user-role": userRole,
      },
      body: JSON.stringify(data),
    });
  },

  async updateRoom(
    id: string,
    data: Partial<BoardingRoom>,
    userRole: string
  ): Promise<BoardingRoom> {
    return apiFetch(`/api/rooms/${id}`, {
      method: "PUT",
      headers: {
        "x-user-role": userRole,
      },
      body: JSON.stringify(data),
    });
  },

  async deleteRoom(id: string, userRole: string): Promise<{ success: boolean; message: string }> {
    return apiFetch(`/api/rooms/${id}`, {
      method: "DELETE",
      headers: {
        "x-user-role": userRole,
      },
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
