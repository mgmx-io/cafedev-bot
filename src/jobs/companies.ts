import { ATS, type AtsName, detectSource } from "@/jobs/catalog";
import { db } from "@/lib/db";

function upsertBoard(ats: AtsName, slug: string): number {
	const row = db
		.query<{ id: number }, [string, string]>(
			`INSERT INTO company_boards (ats, slug) VALUES (?, ?)
			 ON CONFLICT(ats, slug) DO UPDATE SET slug = excluded.slug
			 RETURNING id`,
		)
		.get(ats, slug);
	if (!row) throw new Error("upsertBoard: insert returned no row");
	return row.id;
}

/** Detect and persist the company board for a job URL, if the catalog recognizes it. */
export function resolveBoard(
	url: string,
): { id: number; ats: AtsName; slug: string } | undefined {
	const detected = detectSource(url);
	if (!detected) return undefined;
	return { id: upsertBoard(detected.ats, detected.slug), ...detected };
}

/** Follow a company's board for a user. Idempotent. */
export function followCompany(userId: string, boardId: number): void {
	db.run(
		"INSERT INTO company_follows (user_id, board_id) VALUES (?, ?) ON CONFLICT (user_id, board_id) DO NOTHING",
		[userId, boardId],
	);
}

export type NewPosting = {
	url: string;
	title: string;
	ats: AtsName;
	slug: string;
};

function followedBoards(
	userId: string,
): { id: number; ats: AtsName; slug: string }[] {
	return db
		.query<{ id: number; ats: AtsName; slug: string }, [string]>(
			`SELECT cb.id, cb.ats, cb.slug FROM company_boards cb
			 JOIN company_follows cf ON cf.board_id = cb.id
			 WHERE cf.user_id = ?`,
		)
		.all(userId);
}

/** Close any tracked posting for this board that the fresh scrape no longer lists. */
function closeMissing(boardId: number, liveUrls: Set<string>): void {
	const tracked = db
		.query<{ id: number; url: string }, [number]>(
			"SELECT id, url FROM job_postings WHERE board_id = ? AND status = 'active'",
		)
		.all(boardId);
	for (const job of tracked) {
		if (!liveUrls.has(job.url))
			db.run("UPDATE job_postings SET status = 'closed' WHERE id = ?", [
				job.id,
			]);
	}
}

export type CheckResult = { fresh: NewPosting[]; failed: string[] };

/**
 * For each board the user follows: scrape its current postings, close any
 * previously-tracked posting no longer listed, and return the ones not yet tracked.
 * A board whose scrape throws is skipped (reported in `failed`) rather than
 * failing the whole check.
 */
export async function checkNewPostings(userId: string): Promise<CheckResult> {
	const fresh: NewPosting[] = [];
	const failed: string[] = [];
	for (const board of followedBoards(userId)) {
		try {
			const postings = await ATS[board.ats].source(board.slug);
			const known = new Set(
				db
					.query<{ url: string }, [number]>(
						"SELECT url FROM job_postings WHERE board_id = ?",
					)
					.all(board.id)
					.map((r) => r.url),
			);
			for (const p of postings)
				if (!known.has(p.url))
					fresh.push({
						url: p.url,
						title: p.title,
						ats: board.ats,
						slug: board.slug,
					});
			closeMissing(board.id, new Set(postings.map((p) => p.url)));
		} catch {
			failed.push(board.slug);
		}
	}
	return { fresh, failed };
}
