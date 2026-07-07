import { zValidator } from "@hono/zod-validator";
import { list, remove, setStatus } from "@server/jobs/applications";
import { checkBoards } from "@server/jobs/companies";
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
jobs.delete(
	"/applications/:id",
	requireAuth,
	zValidator("param", z.object({ id: z.coerce.number().int() })),
	(c) => {
		remove(c.get("userId"), c.req.valid("param").id);
		return c.body(null, 204);
	},
);
jobs.get("/boards/openings", requireAuth, async (c) =>
	c.json(await checkBoards(c.get("userId"))),
);
