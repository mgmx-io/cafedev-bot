import { withBrowserPage } from "@server/browser/playwright";

export type ExtractedPage = {
	title: string;
	text: string;
	finalUrl: string;
	html: string;
	requests: string[];
};

export async function extractPage(url: string): Promise<ExtractedPage> {
	return withBrowserPage(async (page) => {
		const requests = new Set<string>();
		page.on("response", (response) => requests.add(response.url()));
		await page.addInitScript(() => {
			Object.defineProperty(navigator, "webdriver", { get: () => undefined });
		});
		await page.goto(url, { waitUntil: "domcontentloaded" });
		await page
			.waitForLoadState("networkidle", { timeout: 10_000 })
			.catch(() => undefined);

		const [title, text, html] = await Promise.all([
			page.title(),
			page.locator("body").innerText(),
			page.content(),
		]);
		return { title, text, finalUrl: page.url(), html, requests: [...requests] };
	});
}
