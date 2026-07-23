import { type ExtractedPage, extractPage } from "@server/browser/extract";
import { ATS, type AtsBoard, detectSources } from "@server/jobs/catalog";

export function boardsInPage(page: ExtractedPage): AtsBoard[] {
	return detectSources({
		text: [page.finalUrl, ...page.requests, page.html].join("\n"),
		origin: new URL(page.finalUrl).origin,
	});
}

async function firstValid(
	candidates: AtsBoard[],
): Promise<AtsBoard | undefined> {
	let failure: unknown;
	for (const candidate of candidates) {
		try {
			if (await ATS[candidate.ats].source.probe(candidate.slug))
				return candidate;
		} catch (error) {
			failure ??= error;
		}
	}
	if (failure) throw failure;
	return undefined;
}

/** Discover and verify one board without writing to the database. */
export async function discoverBoard(
	url: string,
): Promise<AtsBoard | undefined> {
	const direct = await firstValid(
		detectSources({ text: url, origin: new URL(url).origin }),
	);
	if (direct) return direct;
	return firstValid(boardsInPage(await extractPage(url)));
}
