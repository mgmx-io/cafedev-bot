import { markdownToFormattable } from "@gramio/format/markdown";
import {
	type AutoChatActionFlavor,
	autoChatAction,
} from "@grammyjs/auto-chat-action";
import { autoRetry } from "@grammyjs/auto-retry";
import { Bot, type Context, type Filter } from "grammy";
import type { MessageEntity } from "grammy/types";
import { handleIncoming } from "@/chat/handle";
import { TELEGRAM_BOT_TOKEN } from "@/lib/env";

type BotContext = Context & AutoChatActionFlavor;
type Chat = { texts: string[]; latest?: Context };

export const bot = new Bot<BotContext>(TELEGRAM_BOT_TOKEN);
const DEBOUNCE_MS = 2000;
const chats = new Map<number, Chat>();

bot.api.config.use(autoRetry());
bot.use(autoChatAction());
bot.catch((err) => console.error("telegram bot error:", err));

bot.on("message:text", async (ctx) => {
	let chat = chats.get(ctx.chat.id);
	if (!chat) {
		chat = { texts: [] };
		chats.set(ctx.chat.id, chat);
	}
	chat.texts.push(ctx.message.text);
	chat.latest = ctx;
	await Bun.sleep(DEBOUNCE_MS);
	if (chat.latest !== ctx) return;

	const content = chat.texts.join("\n");
	chat.texts = [];
	await respond(ctx, content);
});

async function respond(
	ctx: Filter<BotContext, "message:text">,
	content: string,
) {
	ctx.chatAction = "typing";
	const { text } = await handleIncoming({
		channel: "telegram",
		channelUserId: String(ctx.from.id),
		content,
	});
	const reply = markdownToFormattable(text);
	await ctx.reply(reply.text, { entities: reply.entities as MessageEntity[] });
}

await bot.init();
