import { markdownToFormattable } from "@gramio/format/markdown";
import {
	type AutoChatActionFlavor,
	autoChatAction,
} from "@grammyjs/auto-chat-action";
import { autoRetry } from "@grammyjs/auto-retry";
import { Bot, type Context, type Filter, InputFile } from "grammy";
import type { MessageEntity } from "grammy/types";
import { extractText, getDocumentProxy } from "unpdf";
import { clearContext } from "@/chat/context";
import {
	registerDocumentDelivery,
	registerProgressDelivery,
} from "@/chat/deliver";
import { handleIncoming } from "@/chat/handle";
import { deleteUser, resolveIdentity } from "@/identity/service";
import { TELEGRAM_BOT_TOKEN } from "@/lib/env";

type BotContext = Context & AutoChatActionFlavor;
type Chat = { texts: string[]; latest?: Context };

export const bot = new Bot<BotContext>(TELEGRAM_BOT_TOKEN);
const DEBOUNCE_MS = 0;
const chats = new Map<number, Chat>();

bot.api.config.use(autoRetry());
bot.use(autoChatAction());
bot.catch((err) => console.error("telegram bot error:", err));

bot.command("new", async (ctx) => {
	if (!ctx.from) return;
	clearContext({ channel: "telegram", channelUserId: String(ctx.from.id) });
	await ctx.reply("Fresh start.");
});

bot.command("destroy", async (ctx) => {
	if (!ctx.from) return;
	const userId = resolveIdentity({
		channel: "telegram",
		channelUserId: String(ctx.from.id),
	});
	if (!userId) {
		await ctx.reply(
			"Nothing to delete — this chat isn't linked to an account.",
		);
		return;
	}
	const code = userId.slice(-4); // ponytail: código de confirmación stateless, derivado del id
	if (ctx.match.toLowerCase() !== code.toLowerCase()) {
		await ctx.reply(
			`This permanently erases your account: profile, applications, follows and this conversation. Send /destroy ${code} to proceed.`,
		);
		return;
	}
	deleteUser(userId);
	await ctx.reply("Done. Everything is gone.");
});

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

bot.on("message:document", async (ctx) => {
	ctx.chatAction = "typing";
	const { file_name, mime_type } = ctx.message.document;
	let text = "";
	if (mime_type === "application/pdf") {
		const file = await ctx.getFile();
		const bytes = await (
			await fetch(
				`https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${file.file_path}`,
			)
		).arrayBuffer();
		({ text } = await extractText(await getDocumentProxy(bytes), {
			mergePages: true,
		}));
	}
	// ponytail: 20k-char cap guards against rogue huge PDFs; CVs never get close
	const content = `[attachment "${file_name ?? "document"}"]\n${
		text.trim().slice(0, 20_000) ||
		"(unreadable — only text PDFs are supported)"
	}`;
	await respond(ctx, [ctx.message.caption, content].filter(Boolean).join("\n"));
});

async function respond(ctx: Filter<BotContext, "message">, content: string) {
	ctx.chatAction = "typing";
	const { text } = await handleIncoming({
		channel: "telegram",
		channelUserId: String(ctx.from.id),
		content,
	});
	const reply = markdownToFormattable(text);
	await ctx.reply(reply.text, { entities: reply.entities as MessageEntity[] });
}

registerProgressDelivery("telegram", async (chatId, text) => {
	await bot.api.sendMessage(Number(chatId), text, {
		entities: [{ type: "italic", offset: 0, length: text.length }],
	});
});

registerDocumentDelivery("telegram", async (chatId, filename, data) => {
	await bot.api.sendDocument(Number(chatId), new InputFile(data, filename));
	return "sent as a chat attachment";
});

await bot.init();
