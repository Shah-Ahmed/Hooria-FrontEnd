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

// Response items of GET /api/organizations (also GET /api/my-organization)
export interface Organization {
  id: string;
  name: string;
  type: string;
  description: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  website: string;
  userLimit: number | null; // null = no limit set
  userCount: number;
  limitReached: boolean;
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

// Response items of GET /api/organizations/:id/users (read-only list for the super admin)
export interface OrgMember {
  name: string;
  email: string;
  role: Role;
  createdAt: number;
}
