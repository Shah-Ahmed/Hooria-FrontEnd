// Calls the backend API and automatically attaches the user's JWT:
//   Authorization: Bearer <Firebase ID token>
// Firebase refreshes the token by itself when it expires.

import { getFirebaseAuth } from "./firebase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface Options {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
}

export async function apiFetch<T = unknown>(path: string, { method = "GET", body }: Options = {}): Promise<T> {
  const user = getFirebaseAuth().currentUser;
  const token = user ? await user.getIdToken() : null;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Cannot reach the server. Is the backend running?");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  }
  return data as T;
}

// Turns anything thrown into a message we can show on screen.
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}
