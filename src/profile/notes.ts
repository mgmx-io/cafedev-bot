import { db } from "@/lib/db";

export type NoteIndex = {
	id: number;
	summary: string;
	has_detail: number;
};

export type Note = {
	id: number;
	summary: string;
	content: string | null;
	created_at: string;
};

/** Index of active notes (summaries only), insertion order. Injected every turn. */
export function listNoteIndex(userId: string): NoteIndex[] {
	return db
		.query<NoteIndex, [string]>(
			"SELECT id, summary, content IS NOT NULL AS has_detail FROM profile_notes WHERE user_id = ? AND removed_at IS NULL ORDER BY id",
		)
		.all(userId);
}

/** Full detail for specific notes. Scoped to user_id so a stray id can't read another user's notes. */
export function recallNotes(userId: string, ids: number[]): Note[] {
	if (ids.length === 0) return [];
	const placeholders = ids.map(() => "?").join(", ");
	return db
		.query<Note, (string | number)[]>(
			`SELECT id, summary, content, created_at FROM profile_notes WHERE user_id = ? AND removed_at IS NULL AND id IN (${placeholders})`,
		)
		.all(userId, ...ids);
}

/** Add a note: a short summary (the index line) and optional rich detail. Returns the new id. */
export function addNote(
	userId: string,
	summary: string,
	content: string | null,
): number {
	const { lastInsertRowid } = db.run(
		"INSERT INTO profile_notes (user_id, summary, content) VALUES (?, ?, ?)",
		[userId, summary, content],
	);
	return Number(lastInsertRowid);
}

/** Remove a note: soft delete (sets removed_at). Scoped to user_id. True if one was active. */
export function removeNote(userId: string, id: number): boolean {
	return (
		db.run(
			"UPDATE profile_notes SET removed_at = ? WHERE id = ? AND user_id = ? AND removed_at IS NULL",
			[new Date().toISOString(), id, userId],
		).changes > 0
	);
}
