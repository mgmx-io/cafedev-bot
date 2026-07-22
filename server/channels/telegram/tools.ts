import { queryTools } from "@server/agents/query";
import { researchTools } from "@server/agents/research";
import { skillsTools } from "@server/agents/skills";
import { browserTools } from "@server/browser/tools";
import {
	deliverDocument,
	deliverProgress,
} from "@server/channels/shared/deliver";
import type { Sender } from "@server/channels/shared/identity";
import { cvTools } from "@server/cv/tools";
import { jobsTools } from "@server/jobs/tools";
import { profileTools } from "@server/profile/tools";
import type { Tool, ToolSet } from "ai";

/** Announce each tool call on the sender's channel just before it runs. */
function withProgress(tools: ToolSet, sender: Sender): ToolSet {
	return Object.fromEntries(
		Object.entries(tools).map(([name, t]) => {
			const execute = t.execute;
			if (!execute) return [name, t];
			const wrapped: Tool = {
				...t,
				execute: (input, options) => {
					deliverProgress(sender, `⚙️ ${name}`);
					return execute(input, options);
				},
			};
			return [name, wrapped];
		}),
	);
}

/** Every tool the agent can use, bound to one user. Composes one slice per spread. */
export const buildTools = (userId: string, sender: Sender) =>
	withProgress(
		{
			...skillsTools,
			...researchTools,
			...profileTools(userId),
			...jobsTools(userId),
			...queryTools(userId),
			...cvTools(userId, deliverDocument.bind(null, sender)),
			...browserTools(userId),
		},
		sender,
	);
