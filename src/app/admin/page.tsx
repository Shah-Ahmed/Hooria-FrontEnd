"use client";

// Page for an organization admin: create, list, delete and re-activate users of MY organization.

import { FormEvent, useCallback, useEffect, useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import RequireRole from "@/components/RequireRole";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, errorMessage } from "@/lib/api";
import type { Organization, OrgUser } from "@/types";

const EMPTY_FORM = { name: "", email: "", password: "" };
const LIMIT_HINT = "User limit reached. Please contact your service provider.";

function formatDate(ms: number | null) {
  return ms ? new Date(ms).toLocaleDateString() : "-";
}

function AdminContent() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [deletedUsers, setDeletedUsers] = useState<OrgUser[]>([]);
  const [org, setOrg] = useState<Organization | null>(null); // details + user limit of my organization
  const [tab, setTab] = useState<"active" | "deleted">("active");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmUser, setConfirmUser] = useState<OrgUser | null>(null); // user waiting for "delete?" answer
  const [deleting, setDeleting] = useState(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      const [list, deleted, myOrg] = await Promise.all([
        apiFetch<OrgUser[]>("/api/users"),
        apiFetch<OrgUser[]>("/api/users?status=deleted"),
        apiFetch<Organization>("/api/my-organization"),
      ]);
      setUsers(list);
      setDeletedUsers(deleted);
      setOrg(myOrg);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  function setField(field: keyof typeof EMPTY_FORM, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      await apiFetch("/api/users", { method: "POST", body: form });
      setSuccess(`User ${form.email} created`);
      setForm(EMPTY_FORM);
      await loadUsers();
    } catch (err) {
      setError(errorMessage(err));
      await loadUsers(); // the limit may have been reached in the meantime: refresh the notice
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteConfirmed() {
    if (!confirmUser) return;
    const user = confirmUser;
    setDeleting(true);
    setError(null);
    setSuccess(null);
    try {
      await apiFetch(`/api/users/${user.id}`, { method: "DELETE" });
      setSuccess(`User ${user.email} deleted. You can find the user under "Deleted users".`);
      await loadUsers();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setDeleting(false);
      setConfirmUser(null);
    }
  }

  async function handleActivate(user: OrgUser) {
    setActivatingId(user.id);
    setError(null);
    setSuccess(null);
    try {
      await apiFetch(`/api/users/${user.id}/activate`, { method: "POST" });
      setSuccess(`User ${user.email} is active again`);
      await loadUsers();
    } catch (err) {
      setError(errorMessage(err));
      await loadUsers();
    } finally {
      setActivatingId(null);
    }
  }

  // The admin's own account is in the list too; only normal users can be deleted.
  const normalUsers = users.filter((u) => u.role === "user");

  return (
    <>
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
        <div>
          <h1 className="h4 mb-1">{profile?.organization?.name ?? "My organization"}: users</h1>
          {org && (
            <div className="meta-text">
              {[org.type, org.address, org.city, org.country].filter(Boolean).join(" · ")}
            </div>
          )}
        </div>
        {org && (
          <span className={`badge badge-soft ${org.limitReached ? "badge-soft-warning" : "badge-soft-success"}`}>
            Users: {org.userLimit === null ? `${org.userCount} (no limit)` : `${org.userCount} / ${org.userLimit}`}
          </span>
        )}
      </div>

      {org?.limitReached && (
        <div className="alert alert-warning" role="alert">
          <strong>User limit reached</strong> ({org.userCount} of {org.userLimit}). No more users can be added
          or re-activated. Please contact your service provider to increase the limit.
        </div>
      )}
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card mb-4">
        <div className="card-body">
          <h2 className="h6 mb-3">Create user</h2>
          <form onSubmit={handleCreate}>
            {/* the whole form is switched off when the user limit is reached */}
            <fieldset disabled={saving || !!org?.limitReached} className="row g-3 m-0 p-0 border-0">
            <div className="col-md-4">
              <label className="form-label" htmlFor="userName">Name</label>
              <input id="userName" className="form-control" value={form.name}
                onChange={(e) => setField("name", e.target.value)} required minLength={2} />
            </div>
            <div className="col-md-4">
              <label className="form-label" htmlFor="userEmail">Email</label>
              <input id="userEmail" type="email" className="form-control" value={form.email}
                onChange={(e) => setField("email", e.target.value)} required autoComplete="off" />
            </div>
            <div className="col-md-4">
              <label className="form-label" htmlFor="userPassword">Password (min 8 characters)</label>
              <input id="userPassword" type="password" className="form-control" value={form.password}
                onChange={(e) => setField("password", e.target.value)} required minLength={8}
                autoComplete="new-password" />
            </div>
            <div className="col-12">
              <button className="btn btn-primary" type="submit" disabled={saving || !!org?.limitReached}>
                {saving ? "Creating..." : "Create user"}
              </button>
            </div>
            </fieldset>
          </form>
        </div>
      </div>

      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button className={`nav-link ${tab === "active" ? "active" : ""}`} onClick={() => setTab("active")}>
            Active users ({normalUsers.length})
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${tab === "deleted" ? "active" : ""}`} onClick={() => setTab("deleted")}>
            Deleted users ({deletedUsers.length})
          </button>
        </li>
      </ul>

      <div className="card">
        <div className="table-responsive">
          {tab === "active" ? (
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={3} className="text-center py-4">Loading...</td></tr>
                )}
                {!loading && normalUsers.length === 0 && (
                  <tr><td colSpan={3} className="text-center py-4 text-muted">No users yet.</td></tr>
                )}
                {normalUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td className="text-end">
                      <button className="btn btn-outline-danger btn-sm" onClick={() => setConfirmUser(user)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Deleted on</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={4} className="text-center py-4">Loading...</td></tr>
                )}
                {!loading && deletedUsers.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-4 text-muted">No deleted users.</td></tr>
                )}
                {deletedUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{formatDate(user.deletedAt)}</td>
                    <td className="text-end">
                      <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => handleActivate(user)}
                        disabled={!!org?.limitReached || activatingId === user.id}
                        title={org?.limitReached ? LIMIT_HINT : undefined}
                      >
                        {activatingId === user.id ? "Activating..." : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmUser !== null}
        title="Delete user"
        message={`Delete ${confirmUser?.email ?? "this user"}? The user can no longer log in. You can activate the user again later from "Deleted users".`}
        confirmLabel="Delete"
        danger
        busy={deleting}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmUser(null)}
      />
    </>
  );
}

export default function AdminPage() {
  return (
    <RequireRole roles={["admin"]}>
      <AdminContent />
    </RequireRole>
  );
}
