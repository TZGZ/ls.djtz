export const ADMIN_EMAIL = 'edwintellez.eatg@gmail.com';
export type StaffRole = 'admin' | 'editor' | 'viewer';
export function isAssignableRole(role: unknown): role is 'editor' | 'viewer' { return role === 'editor' || role === 'viewer'; }
export const normalizeEmail = (email: string) => email.trim().toLowerCase();
export function isStaffAdmin(email?: string) { return !!email && normalizeEmail(email) === ADMIN_EMAIL; }
export function validMemberEmail(value: unknown): value is string {
 return typeof value === 'string' && value.length <= 254 && /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(value.trim());
}
export async function hasStaffAccess(db: D1Database, email?: string) {
 return (await getStaffRole(db,email)) !== null;
}
export async function getStaffRole(db: D1Database, email?: string): Promise<StaffRole | null> {
 if (!email) return null;
 if (isStaffAdmin(email)) return 'admin';
 const member=await db.prepare('SELECT role FROM staff_access WHERE email = ?').bind(normalizeEmail(email)).first<{role:string}>();
 return member && isAssignableRole(member.role) ? member.role : null;
}
