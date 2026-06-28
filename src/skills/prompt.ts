import { listSkills } from "@/skills/skills";

/** The skills slice's prompt fragment. Empty when there are no skills. */
export function skillsPrompt(): string {
	const skills = listSkills();
	if (!skills.length) return "";
	const lines = skills.map((s) => `- ${s.name}: ${s.description}`).join("\n");
	return `Coaching skills — call \`load_skill\` with the name to get the full playbook before doing one of these:\n${lines}`;
}
