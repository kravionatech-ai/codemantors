import { UserRole } from "@/models/User";

export const ALL_PERMISSIONS = [
  // Courses
  "courses.create",
  "courses.read",
  "courses.update_own",
  "courses.update_any",
  "courses.delete_own",
  "courses.delete_any",
  "courses.publish_own",
  "courses.publish_any",
  // Lessons & Curriculum
  "lessons.manage_own",
  "lessons.manage_any",
  // Payments & Financials
  "payments.read_own",
  "payments.read_all",
  "refunds.request",
  "refunds.approve",
  // Users & Roles
  "users.manage",
  "roles.manage",
  "permissions.manage",
  // SEO
  "seo.read",
  "seo.manage",
  "seo.publish",
  "seo.manage_own",
  "seo.manage_any",
  // CMS & Settings
  "cms.manage",
  "settings.manage",
  "settings.general.manage",
  "settings.branding.manage",
  "settings.payments.read",
  "settings.payments.manage",
  "settings.secrets.manage",
  "settings.security.manage",
  "settings.integrations.manage",
  "settings.email.manage",
  "settings.storage.manage",
  "settings.limits.manage",
  "settings.notifications.manage",
  "account.manage",
  // Analytics & Audits
  "reports.read",
  "audit_logs.read",
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number] | string;

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [...ALL_PERMISSIONS],
  admin: [
    "courses.create",
    "courses.read",
    "courses.update_own",
    "courses.update_any",
    "courses.delete_own",
    "courses.delete_any",
    "courses.publish_own",
    "courses.publish_any",
    "lessons.manage_own",
    "lessons.manage_any",
    "payments.read_own",
    "payments.read_all",
    "refunds.request",
    "refunds.approve",
    "users.manage",
    "roles.manage",
    "permissions.manage",
    "seo.read",
    "seo.manage",
    "seo.publish",
    "seo.manage_own",
    "seo.manage_any",
    "cms.manage",
    "settings.manage",
    "settings.general.manage",
    "settings.branding.manage",
    "settings.payments.read",
    "settings.payments.manage",
    "settings.secrets.manage",
    "settings.security.manage",
    "settings.integrations.manage",
    "settings.email.manage",
    "settings.storage.manage",
    "settings.limits.manage",
    "settings.notifications.manage",
    "account.manage",
    "reports.read",
    "audit_logs.read",
  ],
  instructor: [
    "courses.create",
    "courses.read",
    "courses.update_own",
    "courses.delete_own",
    "courses.publish_own",
    "lessons.manage_own",
    "payments.read_own",
    "seo.manage_own",
    "reports.read",
  ],
  student: [
    "courses.read",
    "payments.read_own",
    "refunds.request",
  ],
  support: [
    "courses.read",
    "users.manage",
    "refunds.request",
    "payments.read_all",
    "reports.read",
    "audit_logs.read",
  ],
};

export function getUserEffectivePermissions(user: {
  role?: string;
  permissions?: string[];
}): Set<string> {
  const role = (user?.role as UserRole) || "student";
  const defaultPerms = DEFAULT_ROLE_PERMISSIONS[role] || DEFAULT_ROLE_PERMISSIONS.student;
  const userOverrides = user?.permissions || [];
  return new Set([...defaultPerms, ...userOverrides]);
}

export function hasPermission(
  user: { role?: string; permissions?: string[] } | null | undefined,
  permission: Permission
): boolean {
  if (!user) return false;
  if (user.role === "super_admin") return true;

  const perms = getUserEffectivePermissions(user);
  return perms.has(permission) || perms.has("*");
}

export function hasAnyPermission(
  user: { role?: string; permissions?: string[] } | null | undefined,
  permissions: Permission[]
): boolean {
  if (!user) return false;
  if (user.role === "super_admin") return true;

  const perms = getUserEffectivePermissions(user);
  return permissions.some((p) => perms.has(p) || perms.has("*"));
}
