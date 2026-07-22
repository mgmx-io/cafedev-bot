import { saveArtifact } from "@server/artifacts/store";
import { renderCvPdf } from "@server/cv/render";
import { cvSchema, styleSchema } from "@server/cv/schema";
import { tool } from "ai";
import { z } from "zod";

type OnCreated = (filename: string, data: Uint8Array) => unknown;

/** Render a structured CV to PDF and persist it as an artifact. */
const sendCv = (userId: string, onCreated?: OnCreated) =>
	tool({
		description:
			"Render a structured CV to an ATS-safe PDF and persist it. Load the cv-writing skill before drafting. Returns its artifact id, filename, hash, and page count.",
		inputSchema: z.object({
			cv: cvSchema,
			filename: z
				.string()
				.regex(/^[\w-]+\.pdf$/)
				.describe("Recruiter-facing name, e.g. 'Jane-Doe-CV-Acme.pdf'."),
			style: styleSchema.optional(),
		}),
		execute: async ({ cv, filename, style }) => {
			const { pdf, pages } = await renderCvPdf(cv, style);
			const { id, sha256 } = await saveArtifact({
				userId,
				kind: "cv",
				filename,
				contentType: "application/pdf",
				data: pdf,
			});
			await onCreated?.(filename, pdf);
			return {
				artifactId: id,
				filename,
				sha256,
				pages,
			};
		},
	});

/** The CV slice's tools, bound to one user. */
export const cvTools = (userId: string, onCreated?: OnCreated) => ({
	send_cv: sendCv(userId, onCreated),
});
