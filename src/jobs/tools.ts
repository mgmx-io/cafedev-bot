import { tool } from "ai";
import { z } from "zod";
import { list, STATUSES, setFit, setStatus, track } from "@/jobs/applications";
import { checkBoards, followCompany, resolveBoard } from "@/jobs/companies";
import { getJob, saveJob } from "@/jobs/store";
import { extract } from "@/jobs/webview";
import { normalizeUrl } from "@/lib/url";

/** Fetch a pasted job posting, save it, and start tracking it for the user. */
const ingestJob = (userId: string) =>
	tool({
		description: "Ingest the job posting at the URL the user pasted.",
		inputSchema: z.object({
			url: z.url().describe("The job-posting URL the user pasted."),
		}),
		execute: async ({ url }) => {
			const normalized = normalizeUrl(url);
			const { title, text } = await extract(normalized);
			const id = saveJob(normalized, title, text);
			track(userId, id);
			return { id, title };
		},
	});

/** Follow a company's job board by URL so the user can be notified of future postings there. */
const followCompanyTool = (userId: string) =>
	tool({
		description:
			"Follow a company's job board so the user can be notified of future postings. Takes a job-posting or careers-page URL; fails if the URL is not on a known ATS.",
		inputSchema: z.object({
			url: z
				.url()
				.describe("A job-posting or careers-page URL of the company."),
		}),
		execute: async ({ url }) => {
			const normalized = normalizeUrl(url);
			let board = resolveBoard(normalized);
			if (!board) {
				const page = await extract(normalized);
				board = resolveBoard(page.finalUrl) ?? resolveBoard(page.html);
			}
			if (!board) return { error: "No known ATS board at that URL." };
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

/** Fetch a saved job posting's full description by id. Global, not user-scoped. */
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

/** List the jobs the user is tracking. Bound to one user. */
const listJobs = (userId: string) =>
	tool({
		description:
			"List the jobs the user is tracking — id, title, status, and fit. Use when they ask about a job they saved earlier.",
		inputSchema: z.object({}),
		execute: () => ({ jobs: list(userId) }),
	});

/** Update a tracked job's lifecycle status. Bound to one user. */
const setJobStatus = (userId: string) =>
	tool({
		description:
			"Update a tracked job's lifecycle status — e.g. when the user applies, lands an interview, or gets an offer.",
		inputSchema: z.object({
			job_id: z.number().int().positive(),
			status: z.enum(STATUSES),
		}),
		execute: ({ job_id, status }) =>
			setStatus(userId, job_id, status)
				? { ok: true }
				: { error: `Not tracking job ${job_id}.` },
	});

/** The jobs slice's tools, bound to one user. */
export const jobsTools = (userId: string) => ({
	ingest_job: ingestJob(userId),
	recall_job: recallJob,
	record_fit: recordFit(userId),
	list_jobs: listJobs(userId),
	set_status: setJobStatus(userId),
	follow_company: followCompanyTool(userId),
	check_boards: checkBoardsTool(userId),
});
