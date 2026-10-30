import { getAdminToken } from "@/lib/admin-session";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAdminToken();
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  const body = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) {
    throw new ApiError(body.error || `Erreur ${response.status}`, response.status);
  }
  return body;
}

export function apiPut(path: string, data: unknown) {
  return api(path, { method: "PUT", body: JSON.stringify(data) });
}
