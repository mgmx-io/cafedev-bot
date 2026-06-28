import { profileTools } from "@/profile/tools";
import { skillsTools } from "@/skills/tools";

/** Every tool the agent can use, bound to one user. Composes one slice per spread. */
export const buildTools = (userId: string) => ({
	...profileTools(userId),
	...skillsTools,
});
