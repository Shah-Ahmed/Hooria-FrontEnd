"use client";

// Home: send everyone to the right place.
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { HOME_BY_ROLE } from "@/lib/roles";

export default function Home() {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(profile ? HOME_BY_ROLE[profile.role] : "/login");
  }, [loading, profile, router]);

  return (
    <div className="text-center my-5">
      <div className="spinner-border" role="status" aria-label="Loading" />
    </div>
  );
}
