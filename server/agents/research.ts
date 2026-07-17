import { tavilyExtract, tavilySearch } from "@tavily/ai-sdk";

/** Web research tools available to the agent. */
export const researchTools = {
	webSearch: tavilySearch(),
	webExtract: tavilyExtract(),
};
