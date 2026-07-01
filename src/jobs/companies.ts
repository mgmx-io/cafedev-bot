import { type AtsName, detectSource } from "@/jobs/catalog";
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
