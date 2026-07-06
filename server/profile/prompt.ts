import { listNoteIndex } from "@server/profile/notes";

// ponytail: solo el índice de summaries va al prompt; el detalle se trae con query_db.
/** The profile slice's prompt fragment for one user. */
export function profilePrompt(userId: string): string {
	const notes = listNoteIndex(userId);
	if (!notes.length)
		return "You know nothing about this user yet — ask questions to build their profile.";
	const lines = notes
		.map((n) => `- [${n.id}] ${n.summary}${n.has_detail ? " >" : ""}`)
		.join("\n");
	return `Index of what you know about the user (summaries). Items marked > have fuller detail — query_db their profile_notes.content by id before relying on it or writing a tailored CV:\n${lines}`;
}
