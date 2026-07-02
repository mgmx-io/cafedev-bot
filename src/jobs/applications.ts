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

/** Move a job to a new lifecycle status. Creates the tracking row if missing, else updates it. */
export function setStatus(userId: string, jobId: number, status: Status): void {
	db.run(
		`INSERT INTO job_applications (user_id, job_id, status) VALUES (?, ?, ?)
		 ON CONFLICT (user_id, job_id) DO UPDATE SET status = excluded.status`,
		[userId, jobId, status],
	);
}

export type Counts = {
	total: number;
	status: [string, number][];
	fit: [string, number][];
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
	const total = status.reduce((sum, [, n]) => sum + n, 0);
	return { total, status, fit };
}
