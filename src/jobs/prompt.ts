import { type Counts, counts } from "@/jobs/applications";

/** The jobs slice's prompt fragment: aggregate counts of tracked jobs. Empty when none. */
export function jobsPrompt(userId: string): string {
	const { total, status, fit } = counts(userId);
	if (!total) return "";

	const fmt = (pairs: Counts["status"]) =>
		pairs.map(([k, n]) => `${n} ${k}`).join(" · ");
	return `Tracked jobs: ${total}\n  status — ${fmt(status)}\n  fit    — ${fmt(fit)}\n→ call list_jobs to see them`;
}
