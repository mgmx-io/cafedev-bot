import { listSkills } from "@/skills/skills";

/** The skills slice's prompt fragment. Empty when there are no skills. */
export function skillsPrompt(): string {
	const skills = listSkills();
	if (!skills.length) return "";
	const lines = skills.map((s) => `- ${s.name}: ${s.description}`).join("\n");
	return `Playbooks for common jobs — call \`load_skill\` for the full guide when one applies:\n${lines}`;
}
