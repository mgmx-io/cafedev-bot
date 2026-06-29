import { tool } from "ai";
import { z } from "zod";
import { saveJob } from "@/jobs/store";
import { extract } from "@/jobs/webview";
import { normalizeUrl } from "@/lib/url";

/** Fetch a pasted job posting, extract its description, and save it. */
const ingestJob = tool({
	description: "Ingest the job posting at the URL the user pasted.",
	inputSchema: z.object({
		url: z.url().describe("The job-posting URL the user pasted."),
	}),
	execute: async ({ url }) => {
		const normalized = normalizeUrl(url);
		const { title, text } = await extract(normalized);
		return { id: saveJob(normalized, title, text), title };
	},
});

export const jobsTools = {
	ingest_job: ingestJob,
};
