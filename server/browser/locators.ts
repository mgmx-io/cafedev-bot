import type { Locator, Page } from "playwright";

type Target = {
	role: Parameters<Page["getByRole"]>[0];
	name: string;
	index?: number;
};

function byRole(page: Page, target: Target): Locator {
	return page.getByRole(target.role, {
		name: target.name,
		exact: true,
	});
}

export function locate(page: Page, target: Target): Locator {
	const locator = byRole(page, target);
	return target.index === undefined ? locator : locator.nth(target.index);
}

export async function findFileInput(
	page: Page,
	target: Target,
): Promise<Locator | undefined> {
	const fileInputs = locate(page, target).and(
		page.locator('input[type="file"]'),
	);
	const count = await fileInputs.count();

	if (count === 0) return;
	if (count === 1) return fileInputs;

	throw new Error(
		`Upload target '${target.name}' matches ${count} HTML file inputs; provide the file input's index.`,
	);
}
