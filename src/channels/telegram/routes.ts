import { Hono } from "hono";
import { bot } from "@/channels/telegram/bot";
import { TELEGRAM_WEBHOOK_SECRET } from "@/lib/env";

export const telegram = new Hono();

telegram.post("/webhook", async (c) => {
	if (
		c.req.header("X-Telegram-Bot-Api-Secret-Token") !== TELEGRAM_WEBHOOK_SECRET
	)
		return c.body(null, 401);

	const update = await c.req.json();
	bot
		.handleUpdate(update)
		.catch((err) => console.error("telegram update failed:", err));
	return c.body(null, 200); // ack now; the LLM runs after, past Telegram's timeout
});
