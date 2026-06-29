import { request } from "@/lib/http";

export type Posting = { id: string; url: string; title: string; raw: string };

export type AtsRequest = { url: string; init: RequestInit };

export type Source = (slug: string) => Promise<Posting[]>;

// biome-ignore lint/suspicious/noExplicitAny: ATS responses have no static shape
type Payload = any;

type Extracted = { id: string; url?: string; title?: string };

type Map = (item: Payload, slug: string) => Extracted;

type Pages = (slug: string) => AsyncGenerator<Payload[]>;

function resolveUrl(slug: string, template: (slug: string) => string): string {
	return slug.startsWith("https://") ? slug : template(slug);
}

function okOr404(res: Response, slug: string): boolean {
	if (res.status === 404) return false;
	if (!res.ok) throw new Error(`${slug}: HTTP ${res.status}`);
	return true;
}

function slugToTitle(slug: string): string {
	let decoded: string;
	try {
		decoded = decodeURIComponent(slug);
	} catch {
		decoded = slug;
	}
	return decoded.replaceAll("-", " ");
}

// turns item-pages into deduped Postings; each factory below = a `pages` generator + a `map`
function source(map: Map, pages: Pages): Source {
	return async (slug) => {
		const seen = new Set<string>();
		const out: Posting[] = [];
		for await (const items of pages(slug)) {
			for (const item of items) {
				const job = map(item, slug);
				if (!job.id || !job.url) continue;
				if (seen.has(job.id)) continue;
				seen.add(job.id);
				out.push({
					id: job.id,
					url: job.url,
					title: job.title ?? "",
					raw: JSON.stringify(item),
				});
			}
		}
		return out;
	};
}

export function jsonSource(shape: {
	url: (slug: string) => string;
	select: (res: Payload) => unknown[];
	map: Map;
}): Source {
	return source(shape.map, async function* (slug) {
		const res = await request(resolveUrl(slug, shape.url));
		if (!okOr404(res, slug)) return;
		const items = shape.select(await res.json());
		if (Array.isArray(items)) yield items;
	});
}

export function htmlSource(shape: {
	url: (slug: string) => string;
	item: RegExp;
	map: (m: RegExpMatchArray, slug: string) => Extracted;
}): Source {
	return source(shape.map, async function* (slug) {
		const res = await request(resolveUrl(slug, shape.url));
		if (!okOr404(res, slug)) return;
		yield [...(await res.text()).matchAll(shape.item)];
	});
}

export function sitemapSource(shape: { path?: string; loc: RegExp }): Source {
	const path = shape.path ?? "/sitemap.xml";
	type Entry = { url: string; id: string; title: string };
	return source(
		(e: Entry) => ({
			id: e.id,
			url: e.url,
			title: e.title,
		}),
		async function* (slug) {
			const res = await request(`https://${slug}${path}`);
			if (!okOr404(res, slug)) return;
			const xml = await res.text();
			yield [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].flatMap(
				([, block]) => {
					const loc = block.match(/<loc>\s*([^<\s]+)/)?.[1];
					const m = loc?.match(shape.loc);
					if (!loc || !m) return [];
					return [{ url: loc, id: m[2], title: slugToTitle(m[1]) }];
				},
			);
		},
	);
}

// cursor pagination; `start`/`step` fit offset- and page-based APIs, stops on first empty page
export function pagedSource(shape: {
	request: (slug: string, cursor: number) => AtsRequest;
	start: number;
	step: number;
	select: (res: Payload) => unknown[];
	map: Map;
}): Source {
	return source(shape.map, async function* (slug) {
		for (let cursor = shape.start; ; cursor += shape.step) {
			const { url, init } = shape.request(slug, cursor);
			const res = await request(url, init);
			if (cursor === shape.start && !okOr404(res, slug)) return;
			if (!res.ok) return;
			const items = shape.select(await res.json());
			if (!items?.length) return;
			yield items;
		}
	});
}
