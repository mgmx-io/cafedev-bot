import { db } from "@/lib/db";

export type NoteIndex = {
	id: string;
	summary: string;
	has_detail: number;
};

export type Note = {
	id: string;
	summary: string;
	content: string | null;
	created_at: string;
};

/** Index of active notes (summaries only), oldest first. Injected every turn. */
export function listNoteIndex(userId: string): NoteIndex[] {
	return db
		.query<NoteIndex, [string]>(
			"SELECT id, summary, content IS NOT NULL AS has_detail FROM profile_notes WHERE user_id = ? AND removed_at IS NULL ORDER BY created_at",
		)
		.all(userId);
}

/** Full detail for specific notes. Scoped to user_id so a stray id can't read another user's notes. */
export function recallNotes(userId: string, ids: string[]): Note[] {
	if (ids.length === 0) return [];
	const placeholders = ids.map(() => "?").join(", ");
	return db
		.query<Note, string[]>(
			`SELECT id, summary, content, created_at FROM profile_notes WHERE user_id = ? AND removed_at IS NULL AND id IN (${placeholders})`,
		)
		.all(userId, ...ids);
}

/** Add a note: a short summary (the index line) and optional rich detail. Returns the id. */
export function addNote(
	userId: string,
	summary: string,
	content: string | null,
): string {
	const id = crypto.randomUUID();
	db.run(
		"INSERT INTO profile_notes (id, user_id, summary, content, created_at) VALUES (?, ?, ?, ?, ?)",
		[id, userId, summary, content, new Date().toISOString()],
	);
	return id;
}

/** Remove a note: soft delete (sets removed_at). Scoped to user_id. True if one was active. */
export function removeNote(userId: string, id: string): boolean {
	return (
		db.run(
			"UPDATE profile_notes SET removed_at = ? WHERE id = ? AND user_id = ? AND removed_at IS NULL",
			[new Date().toISOString(), id, userId],
		).changes > 0
	);
}
