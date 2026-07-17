import { readdirSync, readFileSync } from "node:fs";
import { tool } from "ai";
import matter from "gray-matter";
import { z } from "zod";

const SKILLS_DIR = `${import.meta.dir}/../../skills`;

type SkillMeta = { name: string; description: string };

/** Name to path index. Also acts as the allowlist that blocks path traversal. */
function skillPaths(): Record<string, string> {
	const files: Record<string, string> = {};
	for (const file of readdirSync(SKILLS_DIR)) {
		if (file.endsWith(".md"))
			files[file.slice(0, -3)] = `${SKILLS_DIR}/${file}`;
	}
	return files;
}

/** Skill filename and frontmatter description for the system prompt. */
function listSkills(): SkillMeta[] {
	return Object.entries(skillPaths())
		.map(([name, path]) => {
			const { data } = matter(readFileSync(path, "utf8"));
			return { name, description: data.description ?? "" };
		})
		.sort((a, b) => a.name.localeCompare(b.name));
}

/** Skill body without frontmatter, or null if the name is unknown. */
function loadSkill(name: string): string | null {
	const path = skillPaths()[name];
	return path ? matter(readFileSync(path, "utf8")).content.trim() : null;
}

/** System-prompt fragment listing the available skills. */
export function skillsPrompt(): string {
	const skills = listSkills();
	if (!skills.length) return "";
	const lines = skills.map((s) => `- ${s.name}: ${s.description}`).join("\n");
	return `Playbooks for common jobs — call \`load_skill\` for the full guide when one applies:\n${lines}`;
}

const loadSkillTool = tool({
	description:
		"Load the full instructions for a coaching skill by name, taken from the skills index in your system prompt. Call this before doing the task the skill covers.",
	inputSchema: z.object({
		name: z
			.string()
			.describe("The skill name from the index, e.g. 'cv-writing'."),
	}),
	execute: ({ name }) => {
		const content = loadSkill(name);
		return content ? { content } : { error: `No skill named '${name}'.` };
	},
});

/** Skill tools available to the agent. */
export const skillsTools = {
	load_skill: loadSkillTool,
};
