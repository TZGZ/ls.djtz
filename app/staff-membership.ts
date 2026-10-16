export const ADMIN_EMAIL = 'edwintellez.eatg@gmail.com';
export const normalizeEmail = (email: string) => email.trim().toLowerCase();
export function isStaffAdmin(email?: string) { return !!email && normalizeEmail(email) === ADMIN_EMAIL; }
export function validMemberEmail(value: unknown): value is string {
 return typeof value === 'string' && value.length <= 254 && /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(value.trim());
}
export async function hasStaffAccess(db: D1Database, email?: string) {
 if (!email) return false;
 if (isStaffAdmin(email)) return true;
 return !!await db.prepare('SELECT email FROM staff_access WHERE email = ?').bind(normalizeEmail(email)).first();
}
