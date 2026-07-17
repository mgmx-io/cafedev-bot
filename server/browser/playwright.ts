import { type BrowserContextOptions, chromium, type Page } from "playwright";

type PageTask<T> = (page: Page) => Promise<T>;

/** Run an isolated browser page and always release its Chromium process. */
export async function withBrowserPage<T>(
	task: PageTask<T>,
	contextOptions?: BrowserContextOptions,
): Promise<T> {
	const browser = await chromium.launch({ headless: true });

	try {
		const context = await browser.newContext(contextOptions);
		try {
			return await task(await context.newPage());
		} finally {
			await context.close();
		}
	} finally {
		await browser.close();
	}
}
