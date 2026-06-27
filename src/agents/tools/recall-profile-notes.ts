import { tool } from "ai";
import { z } from "zod";
import { recallNotes } from "@/profile/notes";

/** Recall the full detail of specific notes by id. Bound to one user. */
export const recallProfileNotes = (userId: string) =>
	tool({
		description:
			"Fetch the full detail of profile notes by id. Use when the injected index isn't enough — e.g. before writing a tailored CV or matching deeply against a job.",
		inputSchema: z.object({
			ids: z
				.array(z.coerce.number().int().positive())
				.describe("Ids of the notes to expand, taken from the index."),
		}),
		execute: ({ ids }) => ({ notes: recallNotes(userId, ids) }),
	});
