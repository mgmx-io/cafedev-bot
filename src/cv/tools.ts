import { tool } from "ai";
import { z } from "zod";
import { deliverDocument } from "@/chat/deliver";
import { renderCvPdf } from "@/cv/render";
import { cvSchema } from "@/cv/schema";
import type { Sender } from "@/identity/service";

/** Render a structured CV to PDF and deliver it as a file on the user's channel. */
const sendCv = (sender: Sender) =>
	tool({
		description:
			"Render a structured CV to an ATS-safe PDF and send it to the user as a file. Load the cv-writing skill before drafting. Returns the page count.",
		inputSchema: z.object({
			cv: cvSchema,
			filename: z
				.string()
				.regex(/^[\w-]+\.pdf$/)
				.describe("Recruiter-facing name, e.g. 'Jane-Doe-CV-Acme.pdf'."),
		}),
		execute: async ({ cv, filename }) => {
			const { pdf, pages } = await renderCvPdf(cv);
			return { delivered: await deliverDocument(sender, filename, pdf), pages };
		},
	});

/** The cv slice's tools, bound to one sender. */
export const cvTools = (sender: Sender) => ({ send_cv: sendCv(sender) });
