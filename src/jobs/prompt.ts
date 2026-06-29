import { type Counts, counts } from "@/jobs/applications";

/** The jobs slice's prompt fragment: aggregate counts of tracked jobs. Empty when none. */
export function jobsPrompt(userId: string): string {
	const { total, status, fit, readyToApply } = counts(userId);
	if (!total) return "";

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
	return lines.join("\n");
}
