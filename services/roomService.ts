import { apiFetch } from "./api";
import { BoardingRoom, FilterOptions } from "@/types";

export const roomService = {
  async getRooms(
    userRole?: string,
    userId?: string,
    options?: {
      paginated?: boolean;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: string;
      filters?: Partial<FilterOptions>;
    }
  ): Promise<any> {
    const headers: Record<string, string> = {};
    if (userRole) headers["x-user-role"] = userRole;
    if (userId) headers["x-user-id"] = userId;

    let url = "/api/rooms";
    const queryParams: string[] = [];

    if (options) {
      if (options.paginated) queryParams.push("paginated=true");
      if (options.page) queryParams.push(`page=${options.page}`);
      if (options.limit) queryParams.push(`limit=${options.limit}`);
      if (options.sortBy) queryParams.push(`sortBy=${options.sortBy}`);
      if (options.sortOrder) queryParams.push(`sortOrder=${options.sortOrder}`);

      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== "") {
            queryParams.push(`${key}=${encodeURIComponent(String(value))}`);
          }
        });
      }
    }

    if (queryParams.length > 0) {
      url += "?" + queryParams.join("&");
    }

    return apiFetch(url, { headers });
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
