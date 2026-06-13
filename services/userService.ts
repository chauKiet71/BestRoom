import { apiFetch } from "./api";
import { User } from "@/types";

export const userService = {
  async getUser(targetUserId: string): Promise<User> {
    return apiFetch(`/api/users/${targetUserId}`);
  },

  async getUsers(userRole: string, userId: string): Promise<User[]> {
    return apiFetch("/api/users", {
      headers: {
        "x-user-role": userRole,
        "x-user-id": userId,
      },
    });
  },

  async updateUserRole(
    targetUserId: string,
    role: "admin" | "user",
    userRole: string,
    userId: string
  ): Promise<{ success: boolean; user: User }> {
    return apiFetch(`/api/users/${targetUserId}`, {
      method: "PUT",
      headers: {
        "x-user-role": userRole,
        "x-user-id": userId,
      },
      body: JSON.stringify({ role }),
    });
  },

  async updatePostPermission(
    targetUserId: string,
    action: "request" | "approve" | "reject",
    userRole: string,
    userId: string
  ): Promise<{ success: boolean; user: User }> {
    return apiFetch(`/api/users/${targetUserId}/post-permission`, {
      method: "POST",
      headers: {
        "x-user-role": userRole,
        "x-user-id": userId,
      },
      body: JSON.stringify({ action }),
    });
  },

  async deleteUser(
    targetUserId: string,
    userRole: string,
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    return apiFetch(`/api/users/${targetUserId}`, {
      method: "DELETE",
      headers: {
        "x-user-role": userRole,
        "x-user-id": userId,
      },
    });
  },

  async updateProfile(
    targetUserId: string,
    data: { email: string; phone: string; avatar: string; fullname?: string; workingHours?: string },
    userRole: string,
    userId: string
  ): Promise<{ success: boolean; user: User }> {
    return apiFetch(`/api/users/${targetUserId}`, {
      method: "PUT",
      headers: {
        "x-user-role": userRole,
        "x-user-id": userId,
      },
      body: JSON.stringify(data),
    });
  },
};
