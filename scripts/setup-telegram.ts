// bun scripts/setup-telegram.ts https://bot.cafedev.co
import { TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET } from "@/lib/env";

const res = await fetch(
	`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`,
	{
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			url: `${process.argv[2]}/telegram/webhook`,
			secret_token: TELEGRAM_WEBHOOK_SECRET,
		}),
	},
);

console.log(await res.text());

const commands = await fetch(
	`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setMyCommands`,
	{
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			commands: [
				{ command: "new", description: "Start a fresh conversation" },
				{
					command: "destroy",
					description: "Erase your account and all its data",
				},
			],
		}),
	},
);

console.log(await commands.text());
