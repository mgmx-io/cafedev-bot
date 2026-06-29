function required(name: string): string {
	const value = process.env[name]?.trim();
	if (!value) throw new Error(`Missing env var: ${name}`);
	return value;
}

function optional(name: string): string | undefined {
	return process.env[name]?.trim() || undefined;
}

export const DB_PATH = required("DB_PATH");
export const PORT = Number(required("PORT"));
export const BETTER_AUTH_SECRET = required("BETTER_AUTH_SECRET");
export const BETTER_AUTH_URL = required("BETTER_AUTH_URL");
export const GOOGLE_CLIENT_ID = required("GOOGLE_CLIENT_ID");
export const GOOGLE_CLIENT_SECRET = required("GOOGLE_CLIENT_SECRET");
export const TELEGRAM_BOT_TOKEN = required("TELEGRAM_BOT_TOKEN");
export const TELEGRAM_WEBHOOK_SECRET = required("TELEGRAM_WEBHOOK_SECRET");
export const LANGFUSE_PUBLIC_KEY = optional("LANGFUSE_PUBLIC_KEY");
export const LANGFUSE_SECRET_KEY = optional("LANGFUSE_SECRET_KEY");
