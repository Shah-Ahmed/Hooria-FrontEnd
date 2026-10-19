import type { Role } from "@/types";

// Where each role lands after login
export const HOME_BY_ROLE: Record<Role, string> = {
  super_admin: "/super-admin",
  admin: "/admin",
  user: "/dashboard",
};

export const ROLE_LABEL: Record<Role, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  user: "User",
};
