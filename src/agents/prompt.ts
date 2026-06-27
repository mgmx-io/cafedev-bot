import { listNoteIndex } from "@/profile/notes";

const PERSONA =
	"You are the career agent. You help users with career advice, job search, and professional development.";

// ponytail: solo el índice de summaries va al prompt; el detalle se trae con recall_profile_notes.
function profileIndex(userId: string): string {
	const notes = listNoteIndex(userId);
	if (!notes.length)
		return "You know nothing about this user yet — ask questions to build their profile.";
	const lines = notes
		.map((n) => `- [${n.id}] ${n.summary}${n.has_detail ? " ›" : ""}`)
		.join("\n");
	return `Index of what you know about the user (summaries). Items marked › have fuller detail — call \`recall_profile_notes\` with their ids before relying on it or writing a tailored CV:\n${lines}`;
}

/** System prompt for one user. Tool-agnostic: how to use each tool lives in its own description. */
export function systemPrompt(userId: string): string {
	return `${PERSONA}

${profileIndex(userId)}

Keep the user's profile current as you learn: add durable new notes (a preference, a skill, a whole role with its achievements) and remove ones that become outdated or contradicted.`;
}
