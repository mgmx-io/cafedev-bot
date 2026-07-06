import { Hono } from "hono";
import { list } from "@/jobs/applications";
import { followedBoards } from "@/jobs/companies";
import { requireAuth } from "@/lib/auth-guard";

export const jobs = new Hono();

jobs.get("/applications", requireAuth, (c) => c.json(list(c.get("userId"))));
jobs.get("/boards", requireAuth, (c) =>
	c.json(followedBoards(c.get("userId"))),
);
