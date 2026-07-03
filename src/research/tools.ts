import { tavilyExtract, tavilySearch } from "@tavily/ai-sdk";

/** The research slice's tools: Tavily web search + page extraction. */
export const researchTools = {
	webSearch: tavilySearch(),
	webExtract: tavilyExtract(),
};
