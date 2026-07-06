import { list } from "@server/jobs/applications";
import { followedBoards } from "@server/jobs/companies";
import { requireAuth } from "@server/lib/auth-guard";
import { Hono } from "hono";

export const jobs = new Hono();

jobs.get("/applications", requireAuth, (c) => c.json(list(c.get("userId"))));
jobs.get("/boards", requireAuth, (c) =>
	c.json(followedBoards(c.get("userId"))),
);
