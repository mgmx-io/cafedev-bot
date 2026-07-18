import { readArtifact } from "@server/artifacts/store";
import { closeSession, getSession, openSession } from "@server/browser/session";
import { tool } from "ai";
import type { Locator, Page } from "playwright";
import { z } from "zod";

const MAX_SNAPSHOT_CHARS = 25_000;
const roles = [
	"button",
	"checkbox",
	"combobox",
	"link",
	"option",
	"radio",
	"searchbox",
	"spinbutton",
	"switch",
	"tab",
	"textbox",
] as const;

const target = z.object({
	role: z.enum(roles),
	name: z.string().describe("The element's accessible name from browser_view."),
});

const actions = z.discriminatedUnion("type", [
	target.extend({
		type: z.literal("fill"),
		value: z.string(),
	}),
	target.extend({
		type: z.literal("click"),
	}),
	target.extend({
		type: z.literal("check"),
		checked: z.boolean(),
	}),
	target.extend({
		type: z.literal("select"),
		value: z.string().describe("The visible option label."),
	}),
	target.extend({
		type: z.literal("press"),
		key: z.string().describe("A Playwright key, e.g. Enter or ArrowDown."),
	}),
	z.object({
		type: z.literal("upload"),
		label: z.string().describe("The file input's visible label."),
		artifact_id: z.string().describe("An artifact id owned by the user."),
	}),
]);

function activePage(userId: string): Page {
	const page = getSession(userId);
	if (!page) throw new Error("No browser is open. Call browser_open first.");
	return page;
}

async function view(page: Page) {
	const snapshot = await page.ariaSnapshot({ mode: "ai", timeout: 5_000 });
	return {
		url: page.url(),
		title: await page.title(),
		snapshot: snapshot.slice(0, MAX_SNAPSHOT_CHARS),
		truncated: snapshot.length > MAX_SNAPSHOT_CHARS,
	};
}

function locate(page: Page, action: z.infer<typeof target>): Locator {
	return page.getByRole(action.role, {
		name: action.name,
		exact: true,
	});
}

const openBrowser = (userId: string) =>
	tool({
		description:
			"Open a fresh interactive browser at a URL. Replaces any browser already open for this user and returns an accessibility snapshot.",
		inputSchema: z.object({
			url: z
				.url()
				.refine(
					(url) => /^https?:/.test(url),
					"Only HTTP(S) URLs are allowed.",
				),
		}),
		execute: async ({ url }) => view(await openSession(userId, url)),
	});

const viewBrowser = (userId: string) =>
	tool({
		description:
			"Inspect the current interactive page. Returns an AI-oriented accessibility snapshot containing the visible text and accessible names of controls.",
		inputSchema: z.object({}),
		execute: async () => view(activePage(userId)),
	});

const actBrowser = (userId: string) =>
	tool({
		description:
			"Perform a batch of actions on the current page using exact roles and accessible names from browser_view, then return the updated snapshot. Never click the final application submit button without the user's explicit confirmation.",
		inputSchema: z.object({
			actions: z.array(actions).min(1),
		}),
		execute: async ({ actions: batch }) => {
			const page = activePage(userId);
			for (const action of batch) {
				if (action.type === "upload") {
					const artifact = await readArtifact(userId, action.artifact_id);
					if (!artifact)
						throw new Error(`Artifact '${action.artifact_id}' not found.`);
					await page.getByLabel(action.label, { exact: true }).setInputFiles({
						name: artifact.filename,
						mimeType: artifact.contentType,
						buffer: Buffer.from(artifact.data),
					});
					continue;
				}
				const element = locate(page, action);
				switch (action.type) {
					case "fill":
						await element.fill(action.value);
						break;
					case "click":
						await element.click();
						break;
					case "check":
						await element.setChecked(action.checked);
						break;
					case "select":
						await element.selectOption({ label: action.value });
						break;
					case "press":
						await element.press(action.key);
						break;
				}
			}
			return view(page);
		},
	});

const closeBrowser = (userId: string) =>
	tool({
		description: "Close and discard the user's current interactive browser.",
		inputSchema: z.object({}),
		execute: async () => ({ closed: await closeSession(userId) }),
	});

export const browserTools = (userId: string) => ({
	browser_open: openBrowser(userId),
	browser_view: viewBrowser(userId),
	browser_act: actBrowser(userId),
	browser_close: closeBrowser(userId),
});
