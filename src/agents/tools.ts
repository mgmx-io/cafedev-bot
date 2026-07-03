import { queryTools } from "@/agents/query";
import { cvTools } from "@/cv/tools";
import type { Sender } from "@/identity/service";
import { jobsTools } from "@/jobs/tools";
import { profileTools } from "@/profile/tools";
import { skillsTools } from "@/skills/tools";

/** Every tool the agent can use, bound to one user. Composes one slice per spread. */
export const buildTools = (userId: string, sender: Sender) => ({
	...skillsTools,
	...profileTools(userId),
	...jobsTools(userId),
	...queryTools(userId),
	...cvTools(sender),
});
