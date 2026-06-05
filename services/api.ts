export async function apiFetch(url: string, options: RequestInit = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  } as Record<string, string>;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Parse JSON or return empty object if response is not JSON
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Đã xảy ra lỗi hệ thống.");
  }

  return data;
}
