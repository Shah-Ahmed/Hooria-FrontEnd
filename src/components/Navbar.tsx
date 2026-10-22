"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
            <span>
              {profile.name || profile.email}{" "}
              <span className="badge badge-soft badge-soft-violet">{ROLE_LABEL[profile.role]}</span>
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
