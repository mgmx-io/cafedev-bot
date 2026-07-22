import { db } from "@server/lib/db";

/** Erase a user account entirely; foreign keys cascade through owned data. */
export function deleteUser(userId: string): void {
	db.run("DELETE FROM user WHERE id = ?", [userId]);
}
