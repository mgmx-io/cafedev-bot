export type Fit = "apply" | "stretch" | "skip";

export const STATUSES = [
	"considering",
	"applied",
	"interviewing",
	"offer",
	"rejected",
	"withdrawn",
] as const;

export type Status = (typeof STATUSES)[number];

export type Application = {
	id: number;
	title: string;
	url: string;
	status: Status;
	fit: Fit | null;
	created_at: string;
};

export type Board = { id: number; ats: string; slug: string };

export type BoardOpenings = {
	id: number;
	ats: string;
	slug: string;
	postings: { title: string; url: string }[];
};

export type BoardCheck = { boards: BoardOpenings[]; failed: string[] };
