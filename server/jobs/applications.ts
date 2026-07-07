import { db } from "@server/lib/db";
import type { Application, Fit, Status } from "@shared/jobs";

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

/** Stop tracking a job for a user. */
export function remove(userId: string, jobId: number): void {
	db.run("DELETE FROM job_applications WHERE user_id = ? AND job_id = ?", [
		userId,
		jobId,
	]);
}

/** A user's tracked jobs, newest first, for the dashboard. */
export function list(userId: string): Application[] {
	return db
		.query<Application, [string]>(
			`SELECT ja.job_id AS id, jp.title, jp.url, ja.status, ja.fit, ja.created_at
			 FROM job_applications ja JOIN job_postings jp ON jp.id = ja.job_id
			 WHERE ja.user_id = ? ORDER BY ja.created_at DESC`,
		)
		.all(userId);
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
