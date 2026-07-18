import {
	type Browser,
	type BrowserContext,
	chromium,
	type Page,
} from "playwright";

const SESSION_TTL_MS = 5 * 60 * 1000;

type Session = {
	context: BrowserContext;
	page: Page;
	timeout: ReturnType<typeof setTimeout>;
};

let browser: Promise<Browser> | undefined;
const sessions = new Map<string, Session>();

const getBrowser = () => (browser ??= chromium.launch({ headless: true }));

function scheduleClose(
	userId: string,
	context: BrowserContext,
): ReturnType<typeof setTimeout> {
	return setTimeout(() => {
		if (sessions.get(userId)?.context !== context) return;
		closeSession(userId).catch((error) =>
			console.error("browser session cleanup failed:", error),
		);
	}, SESSION_TTL_MS);
}

function touch(userId: string, session: Session): void {
	clearTimeout(session.timeout);
	session.timeout = scheduleClose(userId, session.context);
}

/** Replace the user's current page with a fresh isolated browser context. */
export async function openSession(userId: string, url: string): Promise<Page> {
	await closeSession(userId);
	const context = await (await getBrowser()).newContext();
	context.setDefaultTimeout(10_000);
	const page = await context.newPage();
	const timeout = scheduleClose(userId, context);
	const session = { context, page, timeout };
	sessions.set(userId, session);
	try {
		await page.goto(url, { waitUntil: "domcontentloaded" });
		return page;
	} catch (error) {
		await closeSession(userId);
		throw error;
	}
}

/** Return the user's active page, if any. */
export function getSession(userId: string): Page | undefined {
	const session = sessions.get(userId);
	if (!session) return;
	touch(userId, session);
	return session.page;
}

/** Close and forget the user's active browser context. */
export async function closeSession(userId: string): Promise<boolean> {
	const session = sessions.get(userId);
	if (!session) return false;
	sessions.delete(userId);
	clearTimeout(session.timeout);
	await session.context.close();
	return true;
}
