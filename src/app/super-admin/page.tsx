"use client";

// Page for the super admin: create, list and delete organizations.
// Creating an organization also creates its admin account.

import { FormEvent, useCallback, useEffect, useState } from "react";
import RequireRole from "@/components/RequireRole";
import { apiFetch, errorMessage } from "@/lib/api";
import type { Organization } from "@/types";

const EMPTY_FORM = { name: "", adminName: "", adminEmail: "", adminPassword: "" };

function SuperAdminContent() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const loadOrgs = useCallback(async () => {
    try {
      setOrgs(await apiFetch<Organization[]>("/api/organizations"));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrgs();
  }, [loadOrgs]);

  function setField(field: keyof typeof EMPTY_FORM, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      await apiFetch("/api/organizations", { method: "POST", body: form });
      setSuccess(`Organization "${form.name}" created with admin ${form.adminEmail}`);
      setForm(EMPTY_FORM);
      await loadOrgs();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(org: Organization) {
    if (!window.confirm(`Delete "${org.name}"? All its users will be deactivated and can no longer log in. The records stay in the database.`)) return;
    setError(null);
    setSuccess(null);
    try {
      await apiFetch(`/api/organizations/${org.id}`, { method: "DELETE" });
      setSuccess(`Organization "${org.name}" deleted`);
      await loadOrgs();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <>
      <h1 className="h4 mb-3">Organizations</h1>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h2 className="h6 mb-3">Create organization and its admin</h2>
          <form onSubmit={handleCreate} className="row g-3">
            <div className="col-md-6">
              <label className="form-label" htmlFor="orgName">Organization name</label>
              <input id="orgName" className="form-control" value={form.name}
                onChange={(e) => setField("name", e.target.value)} required minLength={2} />
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="adminName">Admin name</label>
              <input id="adminName" className="form-control" value={form.adminName}
                onChange={(e) => setField("adminName", e.target.value)} required minLength={2} />
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="adminEmail">Admin email</label>
              <input id="adminEmail" type="email" className="form-control" value={form.adminEmail}
                onChange={(e) => setField("adminEmail", e.target.value)} required autoComplete="off" />
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="adminPassword">Admin password (min 8 characters)</label>
              <input id="adminPassword" type="password" className="form-control" value={form.adminPassword}
                onChange={(e) => setField("adminPassword", e.target.value)} required minLength={8}
                autoComplete="new-password" />
            </div>
            <div className="col-12">
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? "Creating..." : "Create organization"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Admin</th>
                <th>Admin email</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={4} className="text-center py-4">Loading...</td></tr>
              )}
              {!loading && orgs.length === 0 && (
                <tr><td colSpan={4} className="text-center py-4 text-muted">No organizations yet.</td></tr>
              )}
              {orgs.map((org) => (
                <tr key={org.id}>
                  <td>{org.name}</td>
                  <td>{org.adminName}</td>
                  <td>{org.adminEmail}</td>
                  <td className="text-end">
                    <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(org)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default function SuperAdminPage() {
  return (
    <RequireRole roles={["super_admin"]}>
      <SuperAdminContent />
    </RequireRole>
  );
}
