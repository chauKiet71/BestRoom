import { apiFetch } from "./api";

export const metaService = {
  async getMeta(): Promise<{
    cities: string[];
    wards: string[];
    streets: string[];
    years: number[];
  }> {
    return apiFetch("/api/meta");
  },
};
