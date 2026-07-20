import { markdownToFormattable } from "@gramio/format/markdown";
import {
	type AutoChatActionFlavor,
	autoChatAction,
} from "@grammyjs/auto-chat-action";
import { autoRetry } from "@grammyjs/auto-retry";
import { clearContext } from "@server/chat/context";
import { registerDelivery } from "@server/chat/deliver";
import { handleIncoming } from "@server/chat/handle";
import { deleteUser, resolveIdentity } from "@server/identity/service";
import { TELEGRAM_BOT_TOKEN } from "@server/lib/env";
import { Bot, type Context, type Filter, InputFile } from "grammy";
import type { MessageEntity } from "grammy/types";
import { extractLinks, extractText, getDocumentProxy } from "unpdf";

type BotContext = Context & AutoChatActionFlavor;
type Chat = { texts: string[]; latest?: Context };

export const bot = new Bot<BotContext>(TELEGRAM_BOT_TOKEN);
const DEBOUNCE_MS = 0;
const MAX_ATTACHMENT_CHARS = 20_000;
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
	let extracted = "";

	if (mime_type === "application/pdf") {
		const { file_path } = await ctx.getFile();
		const bytes = await fetch(
			`https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${file_path}`,
		).then((response) => response.arrayBuffer());

		const pdf = await getDocumentProxy(bytes);
		const [{ text }, { links }] = await Promise.all([
			extractText(pdf, { mergePages: true }),
			extractLinks(pdf),
		]);

		const uniqueLinks = [...new Set(links)];
		extracted = [
			uniqueLinks.length ? `[embedded links]\n${uniqueLinks.join("\n")}` : "",
			text.trim(),
		]
			.filter(Boolean)
			.join("\n\n");
	}

	const body =
		extracted.slice(0, MAX_ATTACHMENT_CHARS) ||
		"(unreadable — only text PDFs are supported)";
	const content = `[attachment "${file_name ?? "document"}"]\n${body}`;

	await respond(ctx, [ctx.message.caption, content].filter(Boolean).join("\n"));
});

async function respond(ctx: Filter<BotContext, "message">, content: string) {
	ctx.chatAction = "typing";
	await handleIncoming({
		channel: "telegram",
		channelUserId: String(ctx.from.id),
		content,
	});
}

registerDelivery("telegram", {
	message: async ({ channelUserId, text }) => {
		const reply = markdownToFormattable(text);
		await bot.api.sendMessage(Number(channelUserId), reply.text, {
			entities: reply.entities as MessageEntity[],
		});
	},
	progress: async ({ channelUserId, text }) => {
		await bot.api.sendMessage(Number(channelUserId), text, {
			entities: [{ type: "italic", offset: 0, length: text.length }],
		});
	},
	document: async ({ channelUserId, filename, data }) => {
		await bot.api.sendDocument(
			Number(channelUserId),
			new InputFile(data, filename),
		);
		return "sent as a chat attachment";
	},
});

await bot.init();
