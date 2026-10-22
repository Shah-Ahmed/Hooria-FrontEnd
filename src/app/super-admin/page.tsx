"use client";

// Page for the super admin:
//   - create an organization (details + user limit) together with its admin account
//   - list, edit (details / user limit) and delete organizations
//   - VIEW the users of an organization (read-only: no create / edit / delete buttons)

import { FormEvent, useCallback, useEffect, useState } from "react";
import RequireRole from "@/components/RequireRole";
import { apiFetch, errorMessage } from "@/lib/api";
import { ORG_TYPES } from "@/lib/orgTypes";
import { ROLE_LABEL } from "@/lib/roles";
import type { OrgMember, Organization } from "@/types";

const EMPTY_FORM = {
  name: "",
  type: "",
  address: "",
  city: "",
  country: "",
  phone: "",
  website: "",
  description: "",
  userLimit: "",
  adminName: "",
  adminEmail: "",
  adminPassword: "",
};
type FormState = typeof EMPTY_FORM;

function formatLimit(org: Organization) {
  return org.userLimit === null ? `${org.userCount} / no limit` : `${org.userCount} / ${org.userLimit}`;
}

function SuperAdminContent() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); // null = creating a new organization

  // read-only users panel
  const [viewOrg, setViewOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

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

  function setField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function startEdit(org: Organization) {
    setEditingId(org.id);
    setForm({
      ...EMPTY_FORM,
      name: org.name,
      type: org.type,
      address: org.address,
      city: org.city,
      country: org.country,
      phone: org.phone,
      website: org.website,
      description: org.description,
      userLimit: org.userLimit === null ? "" : String(org.userLimit),
    });
    setError(null);
    setSuccess(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    const details = {
      name: form.name,
      type: form.type,
      address: form.address,
      city: form.city,
      country: form.country,
      phone: form.phone,
      website: form.website,
      description: form.description,
      userLimit: Number(form.userLimit),
    };

    try {
      if (editingId) {
        await apiFetch(`/api/organizations/${editingId}`, { method: "PATCH", body: details });
        setSuccess(`Organization "${form.name}" updated`);
        setEditingId(null);
      } else {
        await apiFetch("/api/organizations", {
          method: "POST",
          body: {
            ...details,
            adminName: form.adminName,
            adminEmail: form.adminEmail,
            adminPassword: form.adminPassword,
          },
        });
        setSuccess(`Organization "${form.name}" created with admin ${form.adminEmail}`);
      }
      setForm(EMPTY_FORM);
      await loadOrgs();
      // keep an open users panel in sync (names / limit may have changed)
      if (viewOrg && editingId === viewOrg.id) setViewOrg(null);
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
      if (viewOrg?.id === org.id) setViewOrg(null);
      if (editingId === org.id) cancelEdit();
      await loadOrgs();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function handleView(org: Organization) {
    if (viewOrg?.id === org.id) {
      setViewOrg(null); // click again = close
      return;
    }
    setViewOrg(org);
    setMembers([]);
    setMembersLoading(true);
    setError(null);
    try {
      setMembers(await apiFetch<OrgMember[]>(`/api/organizations/${org.id}/users`));
    } catch (err) {
      setError(errorMessage(err));
      setViewOrg(null);
    } finally {
      setMembersLoading(false);
    }
  }

  const editing = editingId !== null;

  return (
    <>
      <h1 className="h4 mb-3">Organizations</h1>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card mb-4">
        <div className="card-body">
          <h2 className="h6 mb-3">{editing ? "Edit organization" : "Create organization and its admin"}</h2>
          <form onSubmit={handleSubmit} className="row g-3">
            <div className="col-md-6">
              <label className="form-label" htmlFor="orgName">Organization name</label>
              <input id="orgName" className="form-control" value={form.name}
                onChange={(e) => setField("name", e.target.value)} required minLength={2} />
            </div>
            <div className="col-md-3">
              <label className="form-label" htmlFor="orgType">Type</label>
              <select id="orgType" className="form-select" value={form.type}
                onChange={(e) => setField("type", e.target.value)} required>
                <option value="">Select type...</option>
                {ORG_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label" htmlFor="userLimit">User limit</label>
              <input id="userLimit" type="number" min={1} max={100000} step={1} className="form-control"
                value={form.userLimit} placeholder="e.g. 10"
                onChange={(e) => setField("userLimit", e.target.value)} required />
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="orgAddress">Address</label>
              <input id="orgAddress" className="form-control" value={form.address}
                onChange={(e) => setField("address", e.target.value)} required minLength={3} />
            </div>
            <div className="col-md-3">
              <label className="form-label" htmlFor="orgCity">City</label>
              <input id="orgCity" className="form-control" value={form.city}
                onChange={(e) => setField("city", e.target.value)} />
            </div>
            <div className="col-md-3">
              <label className="form-label" htmlFor="orgCountry">Country</label>
              <input id="orgCountry" className="form-control" value={form.country}
                onChange={(e) => setField("country", e.target.value)} />
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="orgPhone">Phone</label>
              <input id="orgPhone" className="form-control" value={form.phone}
                onChange={(e) => setField("phone", e.target.value)} />
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="orgWebsite">Website</label>
              <input id="orgWebsite" className="form-control" value={form.website}
                onChange={(e) => setField("website", e.target.value)} />
            </div>
            <div className="col-12">
              <label className="form-label" htmlFor="orgDescription">Description</label>
              <textarea id="orgDescription" className="form-control" rows={2} maxLength={500}
                value={form.description} onChange={(e) => setField("description", e.target.value)} />
            </div>

            {!editing && (
              <>
                <div className="col-12">
                  <hr className="my-1" />
                  <span className="meta-text">Organization admin account</span>
                </div>
                <div className="col-md-4">
                  <label className="form-label" htmlFor="adminName">Admin name</label>
                  <input id="adminName" className="form-control" value={form.adminName}
                    onChange={(e) => setField("adminName", e.target.value)} required minLength={2} />
                </div>
                <div className="col-md-4">
                  <label className="form-label" htmlFor="adminEmail">Admin email</label>
                  <input id="adminEmail" type="email" className="form-control" value={form.adminEmail}
                    onChange={(e) => setField("adminEmail", e.target.value)} required autoComplete="off" />
                </div>
                <div className="col-md-4">
                  <label className="form-label" htmlFor="adminPassword">Admin password (min 8 characters)</label>
                  <input id="adminPassword" type="password" className="form-control" value={form.adminPassword}
                    onChange={(e) => setField("adminPassword", e.target.value)} required minLength={8}
                    autoComplete="new-password" />
                </div>
              </>
            )}

            <div className="col-12 d-flex gap-2">
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? "Saving..." : editing ? "Save changes" : "Create organization"}
              </button>
              {editing && (
                <button className="btn btn-outline-light" type="button" onClick={cancelEdit} disabled={saving}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <div className="card mb-4">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Admin</th>
                <th>Users</th>
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
                  <td>
                    <div>
                      {org.name}{" "}
                      {org.type && <span className="badge badge-soft badge-soft-primary">{org.type}</span>}
                    </div>
                    <div className="meta-text">{[org.address, org.city, org.country].filter(Boolean).join(", ") || "-"}</div>
                  </td>
                  <td>
                    <div>{org.adminName}</div>
                    <div className="meta-text">{org.adminEmail}</div>
                  </td>
                  <td>
                    <span className={`badge badge-soft ${org.limitReached ? "badge-soft-warning" : "badge-soft-success"}`}>
                      {formatLimit(org)}
                    </span>
                    {org.limitReached && <div className="meta-text mt-1">Limit reached</div>}
                  </td>
                  <td className="text-end text-nowrap">
                    <button className="btn btn-outline-primary btn-sm me-2" onClick={() => handleView(org)}>
                      {viewOrg?.id === org.id ? "Hide users" : "View users"}
                    </button>
                    <button className="btn btn-outline-secondary btn-sm me-2" onClick={() => startEdit(org)}>
                      Edit
                    </button>
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

      {viewOrg && (
        <div className="card">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
              <div>
                <h2 className="h6 mb-1">{viewOrg.name}: users</h2>
                <div className="meta-text">Read-only view</div>
              </div>
              <span className={`badge badge-soft ${viewOrg.limitReached ? "badge-soft-warning" : "badge-soft-success"}`}>
                {formatLimit(viewOrg)}
              </span>
            </div>

            <dl className="row mb-3 small">
              <dt className="col-sm-2 text-muted fw-normal">Type</dt>
              <dd className="col-sm-10">{viewOrg.type || "-"}</dd>
              <dt className="col-sm-2 text-muted fw-normal">Address</dt>
              <dd className="col-sm-10">{[viewOrg.address, viewOrg.city, viewOrg.country].filter(Boolean).join(", ") || "-"}</dd>
              <dt className="col-sm-2 text-muted fw-normal">Phone</dt>
              <dd className="col-sm-10">{viewOrg.phone || "-"}</dd>
              <dt className="col-sm-2 text-muted fw-normal">Website</dt>
              <dd className="col-sm-10">{viewOrg.website || "-"}</dd>
              <dt className="col-sm-2 text-muted fw-normal">Description</dt>
              <dd className="col-sm-10 mb-0">{viewOrg.description || "-"}</dd>
            </dl>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {membersLoading && (
                  <tr><td colSpan={3} className="text-center py-4">Loading...</td></tr>
                )}
                {!membersLoading && members.length === 0 && (
                  <tr><td colSpan={3} className="text-center py-4 text-muted">No users.</td></tr>
                )}
                {members.map((m) => (
                  <tr key={m.email}>
                    <td>{m.name}</td>
                    <td>{m.email}</td>
                    <td>
                      <span className={`badge badge-soft ${m.role === "admin" ? "badge-soft-violet" : "badge-soft-primary"}`}>
                        {ROLE_LABEL[m.role]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
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
