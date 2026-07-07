import { ATS, type AtsName, detectSource } from "@server/jobs/catalog";
import { db } from "@server/lib/db";
import type { Board, BoardCheck } from "@shared/jobs";

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

/** Stop following a company's board for a user. The board row stays — other users may follow it. */
export function unfollowCompany(userId: string, boardId: number): void {
	db.run("DELETE FROM company_follows WHERE user_id = ? AND board_id = ?", [
		userId,
		boardId,
	]);
}

export function followedBoards(userId: string): Board[] {
	return db
		.query<Board, [string]>(
			`SELECT cb.id, cb.ats, cb.slug FROM company_boards cb
			 JOIN company_follows cf ON cf.board_id = cb.id
			 WHERE cf.user_id = ?`,
		)
		.all(userId);
}

/** Scrape every board the user follows and return what each currently lists; a board whose scrape throws lands in `failed`. */
export async function checkBoards(userId: string): Promise<BoardCheck> {
	const boards: BoardCheck["boards"] = [];
	const failed: string[] = [];
	await Promise.all(
		followedBoards(userId).map(async (board) => {
			// ponytail: shared Board types ats as plain string; rows only ever hold catalog names
			const ats = board.ats as AtsName;
			try {
				const postings = await ATS[ats].source(board.slug);
				boards.push({
					id: board.id,
					ats,
					slug: board.slug,
					postings: postings.map((p) => ({ title: p.title, url: p.url })),
				});
			} catch {
				failed.push(board.slug);
			}
		}),
	);
	// los scrapes terminan en cualquier orden; orden estable para UI y agente
	boards.sort((a, b) => a.slug.localeCompare(b.slug));
	return { boards, failed };
}
