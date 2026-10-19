"use client";

// Wrap a page with this to protect it:
//   <RequireRole roles={["admin"]}> ...page content... </RequireRole>
// Logged-out visitors go to /login, wrong-role users go to their own home page.
// (The backend checks the role again on every API call, this is only for the UI.)

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { HOME_BY_ROLE } from "@/lib/roles";
import type { Role } from "@/types";

export default function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { profile, loading } = useAuth();
  const router = useRouter();

  const allowed = !!profile && roles.includes(profile.role);

  useEffect(() => {
    if (loading) return;
    if (!profile) router.replace("/login");
    else if (!allowed) router.replace(HOME_BY_ROLE[profile.role]);
  }, [loading, profile, allowed, router]);

  if (loading || !allowed) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border" role="status" aria-label="Loading" />
      </div>
    );
  }
  return <>{children}</>;
}
