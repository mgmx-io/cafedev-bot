import { tool } from "ai";
import { z } from "zod";
import { getJob, saveJob } from "@/jobs/store";
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

/** Fetch a saved job posting's full description by id. */
const recallJob = tool({
	description:
		"Fetch a saved job posting's full description by id. Use before evaluating how it fits the user.",
	inputSchema: z.object({ id: z.number().int().positive() }),
	execute: ({ id }) => {
		const job = getJob(id);
		return job
			? { title: job.title, content: job.content }
			: { error: `No job with id ${id}.` };
	},
});

export const jobsTools = {
	ingest_job: ingestJob,
	recall_job: recallJob,
};
