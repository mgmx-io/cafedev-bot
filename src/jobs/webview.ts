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
	const view = new Bun.WebView({
		// url:false forces spawn (no auto-connect). --no-sandbox: Chrome's own
		// namespace sandbox is blocked by the systemd unit's RestrictNamespaces;
		// the unit already confines the process. --disable-dev-shm-usage: use
		// /tmp not /dev/shm (PrivateTmp gives a small shm). Binary auto-detected.
		backend: {
			type: "chrome",
			url: false,
			argv: ["--no-sandbox", "--disable-dev-shm-usage"],
		},
	});
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
