import { db } from "@/lib/db";

export type Job = {
	id: number;
	url: string;
	title: string;
	content: string;
	created_at: string;
};

/** Save a job posting, keyed by url. Re-ingesting the same url overwrites it in place. Returns the id. */
export function saveJob(url: string, title: string, content: string): number {
	const row = db
		.query<{ id: number }, [string, string, string]>(
			`INSERT INTO job_postings (url, title, content) VALUES (?, ?, ?)
			 ON CONFLICT(url) DO UPDATE SET title = excluded.title, content = excluded.content
			 RETURNING id`,
		)
		.get(url, title, content);
	if (!row) throw new Error("saveJob: insert returned no row");
	return row.id;
}
