import { loadSkill } from "@server/skills/skills";
import { tool } from "ai";
import { z } from "zod";

/** Load a coaching skill's full instructions by name. Global, not user-scoped. */
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

/** The skills slice's tools. Global, not user-scoped. */
export const skillsTools = {
	load_skill: loadSkillTool,
};
