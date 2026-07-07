import { zValidator } from "@hono/zod-validator";
import { list, setStatus } from "@server/jobs/applications";
import { followedBoards } from "@server/jobs/companies";
import { requireAuth } from "@server/lib/auth-guard";
import { STATUSES } from "@shared/jobs";
import { Hono } from "hono";
import { z } from "zod";

export const jobs = new Hono();

jobs.get("/applications", requireAuth, (c) => c.json(list(c.get("userId"))));
jobs.patch(
	"/applications/:id/status",
	requireAuth,
	zValidator("param", z.object({ id: z.coerce.number().int() })),
	zValidator("json", z.object({ status: z.enum(STATUSES) })),
	(c) => {
		setStatus(
			c.get("userId"),
			c.req.valid("param").id,
			c.req.valid("json").status,
		);
		return c.body(null, 204);
	},
);
jobs.get("/boards", requireAuth, (c) =>
	c.json(followedBoards(c.get("userId"))),
);
