import { type Counts, counts } from "@/jobs/applications";

/** The jobs slice's prompt fragment for one user. */
export function jobsPrompt(userId: string): string {
	const instruction =
		"When ingest_job returns a detected board, offer to follow that company for future postings; call follow_company only if the user agrees.";

	const { total, status, fit, readyToApply } = counts(userId);
	if (!total) return instruction;

	const fmt = (pairs: Counts["status"]) =>
		pairs.map(([k, n]) => `${n} ${k}`).join(" · ");
	const lines = [
		`Tracked jobs: ${total}`,
		`  status — ${fmt(status)}`,
		`  fit    — ${fmt(fit)}`,
	];
	if (readyToApply)
		lines.push(`  ${readyToApply} rated 'apply' but not yet applied`);
	lines.push("→ call list_jobs to see them");

	return `${instruction}\n\n${lines.join("\n")}`;
}
