import { db } from "@/lib/db";

export type Job = {
	id: number;
	url: string;
	title: string;
	content: string;
	created_at: string;
};

/** Save a job posting, keyed by url. Re-ingesting the same url overwrites it in place. Returns the id. */
export function saveJob(
	url: string,
	title: string,
	content: string,
	boardId: number | null = null,
): number {
	const row = db
		.query<{ id: number }, [string, string, string, number | null]>(
			`INSERT INTO job_postings (url, title, content, board_id) VALUES (?, ?, ?, ?)
			 ON CONFLICT(url) DO UPDATE SET title = excluded.title, content = excluded.content, board_id = excluded.board_id
			 RETURNING id`,
		)
		.get(url, title, content, boardId);
	if (!row) throw new Error("saveJob: insert returned no row");
	return row.id;
}

/** Fetch one job posting by id. Null if it doesn't exist. */
export function getJob(id: number): Job | null {
	return db
		.query<Job, [number]>(
			"SELECT id, url, title, content, created_at FROM job_postings WHERE id = ?",
		)
		.get(id);
}
