"use client";

// Page for normal users (role "user").
import Link from "next/link";
import Avatar from "@/components/Avatar";
import RequireRole from "@/components/RequireRole";
import { useAuth } from "@/context/AuthContext";
import { ROLE_LABEL } from "@/lib/roles";

function DashboardContent() {
  const { profile } = useAuth();
  if (!profile) return null;

  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-3">
          <div className="d-flex align-items-center gap-3">
            <Avatar photo={profile.photo} name={profile.name || profile.email} size={56} />
            <h1 className="h4 mb-0">Welcome, {profile.name || profile.email}</h1>
          </div>
          <Link className="btn btn-outline-primary btn-sm" href="/profile">Edit my profile</Link>
        </div>
        <dl className="row mb-0">
          <dt className="col-sm-3">Email</dt>
          <dd className="col-sm-9">{profile.email}</dd>
          <dt className="col-sm-3">Role</dt>
          <dd className="col-sm-9">{ROLE_LABEL[profile.role]}</dd>
          <dt className="col-sm-3">Organization</dt>
          <dd className="col-sm-9">{profile.organization?.name ?? "-"}</dd>
        </dl>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <RequireRole roles={["user"]}>
      <DashboardContent />
    </RequireRole>
  );
}
