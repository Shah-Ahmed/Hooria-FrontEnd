export type Role = "super_admin" | "admin" | "user";

// Response of GET /api/me
export interface Profile {
  uid: string;
  email: string | null;
  role: Role;
  name: string | null;
  photo: string | null; // profile picture (image data URL) or null
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
  deletedAt: number | null; // only set for deleted organizations
}

// Response items of GET /api/users
export interface OrgUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  orgId: string | null;
  createdAt: number;
  deletedAt: number | null; // only set in the "deleted users" list
}

// Response items of GET /api/organizations/:id/users (read-only list for the super admin)
export interface OrgMember {
  name: string;
  email: string;
  role: Role;
  createdAt: number;
}
