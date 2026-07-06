type Page = {
	title: string;
	text: string;
	finalUrl: string;
	html: string;
};

function networkIdle(view: Bun.WebView): Promise<void> {
	return new Promise((resolve) => {
		view.addEventListener("Page.lifecycleEvent", (e: MessageEvent) => {
			if (e.data?.name === "networkIdle") resolve();
		});
	});
}

function readPage(view: Bun.WebView): Promise<Page> {
	return view.evaluate(
		"({ title: document.title, text: document.body.innerText, finalUrl: location.href, html: document.documentElement.outerHTML })",
	);
}

export async function extract(url: string): Promise<Page> {
	const view = new Bun.WebView({
		backend: {
			type: "chrome",
			url: false,
			argv: ["--no-sandbox", "--disable-dev-shm-usage"],
		},
	});
	try {
		await view.navigate("about:blank");
		await view.cdp("Page.setLifecycleEventsEnabled", { enabled: true });
		await view.cdp("Page.addScriptToEvaluateOnNewDocument", {
			source:
				"Object.defineProperty(navigator, 'webdriver', { get: () => undefined })",
		});
		const idle = networkIdle(view);
		await view.navigate(url);
		await Promise.race([idle, Bun.sleep(10_000)]);
		return await readPage(view);
	} finally {
		view.close();
	}
}
