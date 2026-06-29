import { jobsPrompt } from "@/jobs/prompt";
import { profilePrompt } from "@/profile/prompt";
import { skillsPrompt } from "@/skills/prompt";

const PERSONA =
	"You are the career agent. You help users with career advice, job search, and professional development.";

/** System prompt for one user. Composes one prompt fragment per slice. */
export function systemPrompt(userId: string): string {
	return [
		PERSONA,
		profilePrompt(userId),
		skillsPrompt(),
		jobsPrompt(userId),
		"Keep the user's profile current as you learn: add durable new notes (a preference, a skill, a whole role with its achievements) and remove ones that become outdated or contradicted.",
	]
		.filter(Boolean)
		.join("\n\n");
}
