import {
	type Browser,
	type BrowserContext,
	type BrowserContextOptions,
	chromium,
	type Page,
} from "playwright";

type PageTask<T> = (page: Page) => Promise<T>;

let browser: Promise<Browser> | undefined;

const getBrowser = () => (browser ??= chromium.launch({ headless: true }));

/** Create an isolated context in the shared Chromium process. */
export async function newBrowserContext(
	options?: BrowserContextOptions,
): Promise<BrowserContext> {
	return (await getBrowser()).newContext(options);
}

/** Run an isolated browser page and always release its context. */
export async function withBrowserPage<T>(
	task: PageTask<T>,
	contextOptions?: BrowserContextOptions,
): Promise<T> {
	const context = await newBrowserContext(contextOptions);
	try {
		return await task(await context.newPage());
	} finally {
		await context.close();
	}
}
