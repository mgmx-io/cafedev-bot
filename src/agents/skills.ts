import { readdirSync, readFileSync } from "node:fs";
import matter from "gray-matter";

const SKILLS_DIR = `${import.meta.dir}/../../skills`;

export type SkillMeta = { name: string; description: string };

// ponytail: re-reads the dir each turn; cache only if you reach hundreds of skills.
/** name (filename without .md) -> path. Also the allowlist that blocks path traversal. */
function skillPaths(): Record<string, string> {
	const files: Record<string, string> = {};
	for (const f of readdirSync(SKILLS_DIR))
		if (f.endsWith(".md")) files[f.slice(0, -3)] = `${SKILLS_DIR}/${f}`;
	return files;
}

/** Index for the prompt: filename + frontmatter description. */
export function listSkills(): SkillMeta[] {
	return Object.entries(skillPaths())
		.map(([name, path]) => {
			const { data } = matter(readFileSync(path, "utf8"));
			return { name, description: data.description ?? "" };
		})
		.sort((a, b) => a.name.localeCompare(b.name));
}

/** Skill body (frontmatter stripped), or null if name is unknown (blocks traversal). */
export function loadSkill(name: string): string | null {
	const path = skillPaths()[name];
	return path ? matter(readFileSync(path, "utf8")).content.trim() : null;
}
