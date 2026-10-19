export type Role = "super_admin" | "admin" | "user";

// Response of GET /api/me
export interface Profile {
  uid: string;
  email: string | null;
  role: Role;
  name: string | null;
  orgId: string | null;
  organization: { id: string; name: string } | null;
}

// Response items of GET /api/organizations
export interface Organization {
  id: string;
  name: string;
  adminUid: string;
  adminName: string;
  adminEmail: string;
  createdAt: number;
}

// Response items of GET /api/users
export interface OrgUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  orgId: string | null;
  createdAt: number;
}
