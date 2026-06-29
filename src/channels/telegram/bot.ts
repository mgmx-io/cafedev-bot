import { autoRetry } from "@grammyjs/auto-retry";
import { sequentialize } from "@grammyjs/runner";
import { Bot } from "grammy";
import { handleIncoming } from "@/chat/handle";
import { TELEGRAM_BOT_TOKEN } from "@/lib/env";

export const bot = new Bot(TELEGRAM_BOT_TOKEN);

bot.api.config.use(autoRetry());

bot.use(sequentialize((ctx) => ctx.chat?.id.toString()));

bot.on("message:text", async (ctx) => {
	const { text } = await handleIncoming({
		channel: "telegram",
		channelUserId: String(ctx.from.id),
		content: ctx.message.text,
	});
	await ctx.reply(text);
});

bot.catch((err) => console.error("telegram bot error:", err));

await bot.init();
