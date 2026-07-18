import {
	type Browser,
	type BrowserContext,
	chromium,
	type Page,
} from "playwright";

type Session = { context: BrowserContext; page: Page };

let browser: Promise<Browser> | undefined;
const sessions = new Map<string, Session>();

const getBrowser = () => (browser ??= chromium.launch({ headless: true }));

/** Replace the user's current page with a fresh isolated browser context. */
export async function openSession(userId: string, url: string): Promise<Page> {
	await closeSession(userId);
	const context = await (await getBrowser()).newContext();
	context.setDefaultTimeout(10_000);
	const page = await context.newPage();
	sessions.set(userId, { context, page });
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
	return sessions.get(userId)?.page;
}

/** Close and forget the user's active browser context. */
export async function closeSession(userId: string): Promise<boolean> {
	const session = sessions.get(userId);
	if (!session) return false;
	sessions.delete(userId);
	await session.context.close();
	return true;
}
