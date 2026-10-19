"use client";

// Keeps track of who is logged in.
//   profile = the answer of GET /api/me (role, name, organization) or null if logged out.
// Use it in any client component:  const { profile, login, logout } = useAuth();

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { apiFetch, errorMessage } from "@/lib/api";
import type { Profile } from "@/types";

interface AuthState {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

const WRONG_CREDENTIAL_CODES = [
  "auth/invalid-credential",
  "auth/wrong-password",
  "auth/user-not-found",
  "auth/invalid-email",
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        // Backend verifies the JWT and tells us the role.
        const me = await apiFetch<Profile>("/api/me");
        setProfile(me);
        setError(null);
      } catch (err) {
        setProfile(null);
        setError(errorMessage(err));
        await signOut(auth);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      if (code === "auth/user-disabled") {
        throw new Error("This account has been deactivated. Please contact your administrator.");
      }
      throw new Error(
        WRONG_CREDENTIAL_CODES.includes(code) ? "Wrong email or password" : "Login failed. Please try again."
      );
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut(getFirebaseAuth());
  }, []);

  const value = useMemo(
    () => ({ profile, loading, error, login, logout }),
    [profile, loading, error, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
