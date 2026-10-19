"use client";

// Page for normal users (role "user").
import RequireRole from "@/components/RequireRole";
import { useAuth } from "@/context/AuthContext";
import { ROLE_LABEL } from "@/lib/roles";

function DashboardContent() {
  const { profile } = useAuth();
  if (!profile) return null;

  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <h1 className="h4 mb-3">Welcome, {profile.name || profile.email}</h1>
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
