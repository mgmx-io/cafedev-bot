import { tool } from "ai";
import { z } from "zod";
import { addNote } from "@/profile/notes";

/** Add a durable note about the user: a short index summary + optional rich detail. Bound to one user. */
export const addProfileNote = (userId: string) =>
	tool({
		description:
			"Add a durable, self-contained note about the user — a preference, a skill, or a whole role with its achievements. Give a short `summary` (the index line, always visible) and, when the note is rich (e.g. a CV role block), the full `content`. Check the existing index first to avoid duplicates.",
		inputSchema: z.object({
			summary: z
				.string()
				.describe(
					"Short index line, self-contained. E.g. 'remote only', 'Acme (2021-2024), Senior Backend Eng'.",
				),
			content: z
				.string()
				.optional()
				.describe(
					"Full detail when richer than the summary (e.g. the role's achievements verbatim). Omit for one-liners.",
				),
		}),
		execute: ({ summary, content }) => ({
			id: addNote(userId, summary, content ?? null),
		}),
	});
