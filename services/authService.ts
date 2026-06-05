import { apiFetch } from "./api";
import { User } from "@/types";

export const authService = {
  async login(credential: string, password: string): Promise<{ success: boolean; user: User }> {
    return apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ credential, password }),
    });
  },

  async register(data: Record<string, string>): Promise<{ success: boolean; user: User }> {
    return apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string; code?: string }> {
    return apiFetch("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(data: Record<string, string>): Promise<{ success: boolean; message: string }> {
    return apiFetch("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};
