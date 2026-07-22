import { zValidator } from "@hono/zod-validator";
import {
	getOrCreateThread,
	getThread,
	listThreads,
	loadThreadContext,
} from "@server/channels/mobile/threads";
import { requireAuth } from "@server/lib/auth-guard";
import { Hono } from "hono";
import { z } from "zod";

export const chat = new Hono();

chat.post(
	"/chat/threads",
	requireAuth,
	zValidator(
		"json",
		z.object({ title: z.string().trim().max(200).optional() }),
	),
	(c) => {
		const thread = getOrCreateThread(
			crypto.randomUUID(),
			c.get("userId"),
			c.req.valid("json").title,
		);
		if (!thread) return c.json({ error: "Couldn't create thread." }, 500);
		return c.json(thread, 201);
	},
);

chat.get("/chat/threads", requireAuth, (c) =>
	c.json(listThreads(c.get("userId"))),
);

chat.get("/chat/threads/:id", requireAuth, (c) => {
	const userId = c.get("userId");
	const id = c.req.param("id");
	const thread = getThread(id, userId);
	if (!thread) return c.json({ error: "Thread not found." }, 404);
	return c.json({ ...thread, messages: loadThreadContext(id, userId) ?? [] });
});
