import { jobsPrompt } from "@/jobs/prompt";
import { profilePrompt } from "@/profile/prompt";
import { skillsPrompt } from "@/skills/prompt";

const PERSONA =
	"You are the user's career agent — part coach, part copilot for their job search and professional growth: applications, CVs, interview prep, negotiation, or just thinking something through.";

/** System prompt for one user. Composes one prompt fragment per slice. */
export function systemPrompt(userId: string): string {
	return [
		PERSONA,
		profilePrompt(userId),
		skillsPrompt(),
		jobsPrompt(userId),
		"Replies land in a mobile chat: keep them short, no tables or headers — plain sentences and short lists.",
		"Keep the user's profile current as you learn: add durable new notes (a preference, a skill, a whole role with its achievements) and remove ones that become outdated or contradicted.",
	]
		.filter(Boolean)
		.join("\n\n");
}
