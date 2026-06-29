import { db } from "@/lib/db";

export type Fit = "apply" | "stretch" | "skip";

export const STATUSES = [
	"considering",
	"applied",
	"interviewing",
	"offer",
	"rejected",
	"withdrawn",
] as const;
export type Status = (typeof STATUSES)[number];

export type TrackedJob = {
	job_id: number;
	title: string;
	status: Status;
	fit: Fit | null;
};

/** Start tracking a job for a user (status 'considering'). Idempotent — won't reset an existing row. */
export function track(userId: string, jobId: number): void {
	db.run(
		"INSERT INTO job_applications (user_id, job_id) VALUES (?, ?) ON CONFLICT (user_id, job_id) DO NOTHING",
		[userId, jobId],
	);
}

/** Persist a job-fit verdict. Creates the tracking row if missing, else updates the verdict. */
export function setFit(userId: string, jobId: number, fit: Fit): void {
	db.run(
		`INSERT INTO job_applications (user_id, job_id, fit) VALUES (?, ?, ?)
		 ON CONFLICT (user_id, job_id) DO UPDATE SET fit = excluded.fit`,
		[userId, jobId, fit],
	);
}

/** Move a tracked job to a new lifecycle status. False if the user isn't tracking it. */
export function setStatus(
	userId: string,
	jobId: number,
	status: Status,
): boolean {
	return (
		db.run(
			"UPDATE job_applications SET status = ? WHERE user_id = ? AND job_id = ?",
			[status, userId, jobId],
		).changes > 0
	);
}

export type Counts = {
	total: number;
	status: [string, number][];
	fit: [string, number][];
	readyToApply: number;
};

/** Aggregate counts of a user's tracked jobs, for the injected prompt block. */
export function counts(userId: string): Counts {
	const status = db
		.query<{ k: string; n: number }, [string]>(
			"SELECT status AS k, COUNT(*) AS n FROM job_applications WHERE user_id = ? GROUP BY status",
		)
		.all(userId)
		.map((r) => [r.k, r.n] as [string, number]);
	const fit = db
		.query<{ k: string; n: number }, [string]>(
			"SELECT COALESCE(fit, 'unevaluated') AS k, COUNT(*) AS n FROM job_applications WHERE user_id = ? GROUP BY fit",
		)
		.all(userId)
		.map((r) => [r.k, r.n] as [string, number]);
	// jobs rated worth applying to but not yet applied — the nudge signal
	const readyToApply =
		db
			.query<{ n: number }, [string]>(
				"SELECT COUNT(*) AS n FROM job_applications WHERE user_id = ? AND fit = 'apply' AND status = 'considering'",
			)
			.get(userId)?.n ?? 0;
	const total = status.reduce((sum, [, n]) => sum + n, 0);
	return { total, status, fit, readyToApply };
}

/** Jobs the user is tracking, newest first. Joined with the posting for the injected index. */
export function list(userId: string): TrackedJob[] {
	return db
		.query<TrackedJob, [string]>(
			`SELECT a.job_id, j.title, a.status, a.fit
			 FROM job_applications a
			 JOIN job_postings j ON j.id = a.job_id
			 WHERE a.user_id = ?
			 ORDER BY a.id DESC`,
		)
		.all(userId);
}
