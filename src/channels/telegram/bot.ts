import { markdownToFormattable } from "@gramio/format/markdown";
import {
	type AutoChatActionFlavor,
	autoChatAction,
} from "@grammyjs/auto-chat-action";
import { autoRetry } from "@grammyjs/auto-retry";
import { sequentialize } from "@grammyjs/runner";
import { Bot, type Context } from "grammy";
import type { MessageEntity } from "grammy/types";
import { handleIncoming } from "@/chat/handle";
import { TELEGRAM_BOT_TOKEN } from "@/lib/env";

export const bot = new Bot<Context & AutoChatActionFlavor>(TELEGRAM_BOT_TOKEN);

bot.api.config.use(autoRetry());

bot.use(sequentialize((ctx) => ctx.chat?.id.toString()));

bot.use(autoChatAction());

bot.on("message:text", async (ctx) => {
	ctx.chatAction = "typing";
	const { text } = await handleIncoming({
		channel: "telegram",
		channelUserId: String(ctx.from.id),
		content: ctx.message.text,
	});
	const reply = markdownToFormattable(text);
	await ctx.reply(reply.text, { entities: reply.entities as MessageEntity[] });
});

bot.catch((err) => console.error("telegram bot error:", err));

await bot.init();
