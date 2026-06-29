type Page = {
	title: string;
	text: string;
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
		"({ title: document.title, text: document.body.innerText })",
	);
}

export async function extract(url: string): Promise<Page> {
	const view = new Bun.WebView({ backend: "chrome" });
	try {
		await view.navigate("about:blank");
		await view.cdp("Page.setLifecycleEventsEnabled", { enabled: true });
		const idle = networkIdle(view);
		await view.navigate(url);
		await idle;
		return await readPage(view);
	} finally {
		view.close();
	}
}
