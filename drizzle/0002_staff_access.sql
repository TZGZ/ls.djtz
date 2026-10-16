CREATE TABLE staff_access (
 email TEXT PRIMARY KEY NOT NULL,
 granted_by TEXT NOT NULL,
 granted_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
