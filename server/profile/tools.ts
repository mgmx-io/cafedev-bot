import { addNote, removeNote } from "@server/profile/notes";
import { tool } from "ai";
import { z } from "zod";

/** Add a durable, self-contained note about the user. Bound to one user. */
const addProfileNote = (userId: string) =>
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

/** Remove a profile note that's outdated or contradicted by something newer. Bound to one user. */
const removeProfileNote = (userId: string) =>
	tool({
		description:
			"Remove a profile note that is now outdated or contradicted by something newer. Use the note's id.",
		inputSchema: z.object({
			id: z.coerce
				.number()
				.int()
				.positive()
				.describe("The id of the note to remove."),
		}),
		execute: ({ id }) => ({ removed: removeNote(userId, id) }),
	});

/** The profile slice's tools, bound to one user. */
export const profileTools = (userId: string) => ({
	add_profile_note: addProfileNote(userId),
	remove_profile_note: removeProfileNote(userId),
});
