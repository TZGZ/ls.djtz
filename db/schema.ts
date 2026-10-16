import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import {sql} from 'drizzle-orm';
export const records = sqliteTable("records", { id: text("id").primaryKey(), kind: text("kind").notNull(), data: text("data").notNull(), version: integer("version").notNull().default(1) });
export const staffAccess = sqliteTable('staff_access', {
 email: text('email').primaryKey(),
 grantedBy: text('granted_by').notNull(),
 grantedAt: text('granted_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
});
