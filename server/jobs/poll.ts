import { deliverMessage } from "@server/channels/shared/deliver";
import { ATS, type AtsName } from "@server/jobs/catalog";
import { db } from "@server/lib/db";
import type { Board } from "@shared/jobs";

function boardsWithFollowers(): Board[] {
	return db
		.query<Board, []>(
			`SELECT DISTINCT cb.id, cb.ats, cb.slug FROM company_boards cb
			 JOIN company_follows cf ON cf.board_id = cb.id`,
		)
		.all();
}

const insertPosting = db.query(
	`INSERT INTO board_postings (board_id, ext_id, url, title, notified_at)
	 VALUES (?, ?, ?, ?, CASE WHEN ? THEN CURRENT_TIMESTAMP END)
	 ON CONFLICT (board_id, ext_id) DO UPDATE SET title = excluded.title, url = excluded.url`,
);

/** Scrape one board and upsert its listing; new rows land unnotified. */
async function sweep(board: Board): Promise<void> {
	const postings = await ATS[board.ats as AtsName].source(board.slug);
	// a board's first sweep seeds pre-stamped — never notifies the backlog
	const seed = !db
		.query<{ id: number }, [number]>(
			"SELECT board_id AS id FROM board_postings WHERE board_id = ? LIMIT 1",
		)
		.get(board.id);
	db.transaction(() => {
		for (const p of postings)
			insertPosting.run(board.id, p.id, p.url, p.title, seed ? 1 : 0);
	})();
}

type Pending = {
	channel: string;
	channel_user_id: string;
	slug: string;
	title: string;
	url: string;
};

function digest(items: Pending[]): string {
	const bySlug = new Map<string, Pending[]>();
	for (const item of items) {
		bySlug.get(item.slug)?.push(item) ?? bySlug.set(item.slug, [item]);
	}
	const sections = [...bySlug].map(
		([slug, posts]) =>
			`*${slug}*\n${posts.map((p) => `- [${p.title || p.url}](${p.url})`).join("\n")}`,
	);
	return `New openings on boards you follow:\n\n${sections.join("\n\n")}`;
}

/** Send every unnotified posting to its board's followers, then stamp the batch. */
function notifyPending(): void {
	const rows = db
		.query<Pending, []>(
			`SELECT cl.channel, cl.channel_user_id, cb.slug, bp.title, bp.url
			 FROM board_postings bp
			 JOIN company_boards cb ON cb.id = bp.board_id
			 JOIN company_follows cf ON cf.board_id = bp.board_id
			 JOIN channel_links cl ON cl.user_id = cf.user_id
			 WHERE bp.notified_at IS NULL
			 ORDER BY cb.slug, bp.title`,
		)
		.all();
	const byRecipient = new Map<string, Pending[]>();
	for (const row of rows) {
		const key = `${row.channel}\x00${row.channel_user_id}`;
		byRecipient.get(key)?.push(row) ?? byRecipient.set(key, [row]);
	}
	for (const [key, items] of byRecipient) {
		const [channel, channelUserId] = key.split("\x00") as [string, string];
		deliverMessage({ channel, channelUserId }, digest(items));
	}
	db.run(
		"UPDATE board_postings SET notified_at = CURRENT_TIMESTAMP WHERE notified_at IS NULL",
	);
}

/** One digest round: sweep every followed board, then notify what's new. */
async function pollBoards(): Promise<void> {
	await Promise.all(
		boardsWithFollowers().map((board) =>
			sweep(board).catch((err) =>
				console.error(`board poll failed for ${board.slug}:`, err),
			),
		),
	);
	notifyPending();
}

/** Schedule the daily openings digest. */
export function startPolling(): void {
	Bun.cron("0 11,15,19,23 * * *", () =>
		pollBoards().catch((err) => console.error("board poll failed:", err)),
	);
}
