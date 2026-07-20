import { readArtifact } from "@server/artifacts/store";
import { findFileInput, locate } from "@server/browser/locators";
import { closeSession, getSession, openSession } from "@server/browser/session";
import { tool } from "ai";
import type { Page } from "playwright";
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
	index: z
		.number()
		.int()
		.nonnegative()
		.optional()
		.describe(
			"Zero-based index when multiple elements have the same role and name.",
		),
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
	target.extend({
		type: z.literal("upload"),
		artifact_id: z.string().describe("An artifact id owned by the user."),
	}),
]);

type BrowserAction = z.infer<typeof actions>;
type UploadAction = Extract<BrowserAction, { type: "upload" }>;

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

async function uploadArtifact(
	userId: string,
	page: Page,
	action: UploadAction,
): Promise<void> {
	const artifact = await readArtifact(userId, action.artifact_id);
	if (!artifact) throw new Error(`Artifact '${action.artifact_id}' not found.`);

	const file = {
		name: artifact.filename,
		mimeType: artifact.contentType,
		buffer: Buffer.from(artifact.data),
	};
	const input = await findFileInput(page, action);
	if (input) {
		await input.setInputFiles(file);
		return;
	}

	const trigger = locate(page, action);
	const count = await trigger.count();
	if (count !== 1)
		throw new Error(
			`Upload target '${action.name}' matches ${count} controls; provide its index.`,
		);
	const [chooser] = await Promise.all([
		page.waitForEvent("filechooser"),
		trigger.click(),
	]);
	await chooser.setFiles(file);
}

async function performAction(
	userId: string,
	page: Page,
	action: BrowserAction,
): Promise<void> {
	switch (action.type) {
		case "fill":
			await locate(page, action).fill(action.value);
			return;
		case "click":
			await locate(page, action).click();
			return;
		case "check":
			await locate(page, action).setChecked(action.checked);
			return;
		case "select":
			await locate(page, action).selectOption({ label: action.value });
			return;
		case "press":
			await locate(page, action).press(action.key);
			return;
		case "upload":
			await uploadArtifact(userId, page, action);
			return;
		default: {
			const unsupported: never = action;
			throw new Error(
				`Unsupported browser action: ${JSON.stringify(unsupported)}`,
			);
		}
	}
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
			for (const action of batch) await performAction(userId, page, action);
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
