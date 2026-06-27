import { tool } from "ai";
import { z } from "zod";
import { removeNote } from "@/profile/notes";

/** Remove a profile note that's outdated or contradicted by something newer. Bound to one user. */
export const removeProfileNote = (userId: string) =>
	tool({
		description:
			"Remove a profile note that is now outdated or contradicted by something newer. Use the note's id.",
		inputSchema: z.object({
			id: z.string().describe("The id of the note to remove."),
		}),
		execute: ({ id }) => ({ removed: removeNote(userId, id) }),
	});
