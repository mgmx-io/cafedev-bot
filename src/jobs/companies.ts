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

/** Detect and persist the company board for a job or careers-page URL, if the catalog recognizes it. */
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

export type Board = { id: number; ats: AtsName; slug: string };

export function followedBoards(userId: string): Board[] {
	return db
		.query<Board, [string]>(
			`SELECT cb.id, cb.ats, cb.slug FROM company_boards cb
			 JOIN company_follows cf ON cf.board_id = cb.id
			 WHERE cf.user_id = ?`,
		)
		.all(userId);
}

export type BoardPostings = {
	ats: AtsName;
	slug: string;
	postings: { title: string; url: string }[];
};

/** Scrape every board the user follows and return what each currently lists; a board whose scrape throws lands in `failed`. */
export async function checkBoards(
	userId: string,
): Promise<{ boards: BoardPostings[]; failed: string[] }> {
	const boards: BoardPostings[] = [];
	const failed: string[] = [];
	for (const board of followedBoards(userId)) {
		try {
			const postings = await ATS[board.ats].source(board.slug);
			boards.push({
				ats: board.ats,
				slug: board.slug,
				postings: postings.map((p) => ({ title: p.title, url: p.url })),
			});
		} catch {
			failed.push(board.slug);
		}
	}
	return { boards, failed };
}
