import { Database } from "bun:sqlite";
import { tool } from "ai";
import { z } from "zod";
import { DB_PATH } from "@/lib/env";

const CTE_PREFIX = `
-- scoped to the current user
profile_notes    AS (SELECT * FROM main.profile_notes    WHERE user_id = ?1),
job_applications AS (SELECT * FROM main.job_applications WHERE user_id = ?1),
company_follows  AS (SELECT * FROM main.company_follows  WHERE user_id = ?1),
-- blanked out: auth/token tables the model should never see
"user"               AS (SELECT 0 WHERE 0),
session              AS (SELECT 0 WHERE 0),
account              AS (SELECT 0 WHERE 0),
verification         AS (SELECT 0 WHERE 0),
channel_links        AS (SELECT 0 WHERE 0),
link_requests        AS (SELECT 0 WHERE 0),
conversation_context AS (SELECT 0 WHERE 0)`;

const SCHEMA = `
job_postings(id, url, title, content, created_at)
-- global catalog of saved JDs; content is the full JD text
job_applications(id, job_id -> job_postings.id, status, fit, created_at)
-- status: considering|applied|interviewing|offer|rejected|withdrawn
-- fit: apply|stretch|skip, NULL = not evaluated
profile_notes(id, summary, content, created_at, removed_at)
-- removed_at NULL = active; content NULL = summary says it all
company_boards(id, ats, slug, created_at)
-- global ATS boards, e.g. ats='greenhouse'
company_follows(id, board_id -> company_boards.id, created_at)`;

let ro: Database | undefined;
const roDb = () => (ro ??= new Database(DB_PATH, { readonly: true }));
const MAX_CHARS = 20_000;
const ESCAPES_SCOPE = /\b(main|temp)\s*\.|\battach\b/i;

/** Read-only SQL over the user's slice of the DB. Bound to one user via CTE shadowing. */
const queryDb = (userId: string) =>
	tool({
		description: `Run a read-only SQLite SELECT over the user's data — for anything the other tools don't cover: counts, filters, joins, history. Rows in user-owned tables are already filtered to the current user; do not filter by user_id. Schema:\n${SCHEMA}`,
		inputSchema: z.object({
			sql: z
				.string()
				.describe(
					"One SELECT statement. Joins, aggregates and subqueries are fine.",
				),
		}),
		execute: ({ sql }) => {
			if (ESCAPES_SCOPE.test(sql))
				return {
					error: "Schema-qualified references and ATTACH aren't allowed.",
				};
			const rows = roDb().query(`WITH ${CTE_PREFIX} ${sql}`).all(userId);
			return JSON.stringify(rows).length > MAX_CHARS
				? { error: "Result too large — select fewer columns or add LIMIT." }
				: { rows };
		},
	});

/** The query slice's tools, bound to one user. */
export const queryTools = (userId: string) => ({
	query_db: queryDb(userId),
});
