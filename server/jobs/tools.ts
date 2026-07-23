import { extractPage } from "@server/browser/extract";
import { setFit, setStatus, track } from "@server/jobs/applications";
import { checkBoards, followCompany, saveBoard } from "@server/jobs/companies";
import { discoverBoard } from "@server/jobs/discovery";
import { saveJob } from "@server/jobs/store";
import { normalizeUrl } from "@server/lib/url";
import { STATUSES } from "@shared/jobs";
import { tool } from "ai";
import { z } from "zod";

/** Fetch a pasted job posting, save it, and start tracking it for the user. */
const ingestJob = (userId: string) =>
	tool({
		description: "Ingest the job posting at the URL the user pasted.",
		inputSchema: z.object({
			url: z.url().describe("The job-posting URL the user pasted."),
		}),
		execute: async ({ url }) => {
			const normalized = normalizeUrl(url);
			const { title, text } = await extractPage(normalized);
			if (!text.trim()) return { error: "page came back empty — retry" };
			const id = saveJob(normalized, title, text);
			track(userId, id);
			return { id, title };
		},
	});

/** Follow a company's job board by URL so its openings show up in check_boards. */
const followCompanyTool = (userId: string) =>
	tool({
		description:
			"Follow a company's job board so its openings show up in check_boards. Takes a job-posting or careers-page URL; fails if the URL is not on a known ATS.",
		inputSchema: z.object({
			url: z
				.url()
				.describe("A job-posting or careers-page URL of the company."),
		}),
		execute: async ({ url }) => {
			const normalized = normalizeUrl(url);
			const candidate = await discoverBoard(normalized);
			if (!candidate) return { error: "No working ATS board at that URL." };
			const board = saveBoard(candidate);
			followCompany(userId, board.id);
			return { ok: true, ats: board.ats, slug: board.slug };
		},
	});

/** Scrape every board the user follows and report what's currently listed. Bound to one user. */
const checkBoardsTool = (userId: string) =>
	tool({
		description:
			"List every position currently open on the company boards the user follows. Call when the user asks what's open at the companies they track.",
		inputSchema: z.object({}),
		execute: async () => checkBoards(userId),
	});

/** Record a job-fit verdict for the user. Bound to one user. */
const recordFit = (userId: string) =>
	tool({
		description:
			"Record a job-fit verdict for a saved job. Call after assessing fit with the job-fit skill.",
		inputSchema: z.object({
			job_id: z.number().int().positive(),
			fit: z.enum(["apply", "stretch", "skip"]),
		}),
		execute: ({ job_id, fit }) => {
			setFit(userId, job_id, fit);
			return { ok: true };
		},
	});

/** Update a job's lifecycle status — e.g. when the user applies, lands an interview, or gets an offer. Bound to one user. */
const setJobStatus = (userId: string) =>
	tool({
		description:
			"Set a job's lifecycle status — e.g. when the user applies, lands an interview, or gets an offer. Starts tracking the job if it wasn't already.",
		inputSchema: z.object({
			job_id: z.number().int().positive(),
			status: z.enum(STATUSES),
		}),
		execute: ({ job_id, status }) => {
			setStatus(userId, job_id, status);
			return { ok: true };
		},
	});

/** The jobs slice's tools, bound to one user. */
export const jobsTools = (userId: string) => ({
	ingest_job: ingestJob(userId),
	record_fit: recordFit(userId),
	set_status: setJobStatus(userId),
	follow_company: followCompanyTool(userId),
	check_boards: checkBoardsTool(userId),
});
