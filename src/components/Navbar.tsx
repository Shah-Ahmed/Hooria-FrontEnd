"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import { useAuth } from "@/context/AuthContext";
import { HOME_BY_ROLE, ROLE_LABEL } from "@/lib/roles";

export default function Navbar() {
  const { profile, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <nav className="navbar app-navbar">
      <div className="container">
        <Link className="navbar-brand" href={profile ? HOME_BY_ROLE[profile.role] : "/login"}>
          TechProject
        </Link>
        {profile && (
          <div className="d-flex align-items-center gap-3">
            {profile.role === "user" && (
              <Link className="btn btn-outline-secondary btn-sm" href="/profile">
                My profile
              </Link>
            )}
            <span className="d-flex align-items-center gap-2">
              <Avatar photo={profile.photo} name={profile.name || profile.email} />
              <span>
                {profile.name || profile.email}{" "}
                <span className="badge badge-soft badge-soft-violet">{ROLE_LABEL[profile.role]}</span>
              </span>
            </span>
            <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
