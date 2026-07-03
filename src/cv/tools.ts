import { tool } from "ai";
import { z } from "zod";
import { deliverDocument } from "@/chat/deliver";
import { renderCvPdf } from "@/cv/render";
import type { Sender } from "@/identity/service";

/** Render a markdown CV to PDF and deliver it as a file on the user's channel. */
const sendCv = (sender: Sender) =>
	tool({
		description:
			"Render a CV written in markdown to an ATS-safe PDF and send it to the user as a file. Load the cv-writing skill before drafting.",
		inputSchema: z.object({
			markdown: z
				.string()
				.describe("The full CV in markdown, per the cv-writing skill."),
			filename: z
				.string()
				.regex(/^[\w-]+\.pdf$/)
				.describe("Recruiter-facing name, e.g. 'Jane-Doe-CV-Acme.pdf'."),
		}),
		execute: async ({ markdown, filename }) => {
			const pdf = await renderCvPdf(markdown);
			return { delivered: await deliverDocument(sender, filename, pdf) };
		},
	});

/** The cv slice's tools, bound to one sender. */
export const cvTools = (sender: Sender) => ({ send_cv: sendCv(sender) });
