import type { Locator, Page } from "playwright";

type Target = {
	role: Parameters<Page["getByRole"]>[0];
	name: string;
	index?: number;
};

function byRole(page: Page, target: Target, includeHidden = false): Locator {
	return page.getByRole(target.role, {
		name: target.name,
		exact: true,
		includeHidden,
	});
}

export function locate(page: Page, target: Target): Locator {
	const locator = byRole(page, target);
	return target.index === undefined ? locator : locator.nth(target.index);
}

// File inputs can share their button role and accessible name with a visible proxy.
export async function locateFileInput(
	page: Page,
	target: Target,
): Promise<Locator> {
	const fileInput = page.locator('input[type="file"]');

	if (target.index !== undefined) {
		const indexedFileInput = locate(page, target).and(fileInput);
		if ((await indexedFileInput.count()) === 1) return indexedFileInput;
	}

	const fileInputs = byRole(page, target, true).and(fileInput);
	const count = await fileInputs.count();

	if (count === 1) {
		return fileInputs;
	}

	if (count === 0) {
		throw new Error(
			`Upload target '${target.name}' does not match an HTML file input.`,
		);
	}

	throw new Error(
		`Upload target '${target.name}' matches ${count} HTML file inputs; provide the file input's index.`,
	);
}
