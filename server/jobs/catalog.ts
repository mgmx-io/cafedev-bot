import {
	htmlSource,
	jsonSource,
	pagedSource,
	type Source,
} from "@server/jobs/source";

export type DiscoveryInput = { text: string; origin: string };
export type Discover = (input: DiscoveryInput) => string[];
export type Ats = { discover: Discover; source: Source };

function slugsFrom(text: string, patterns: RegExp[]): string[] {
	return patterns.flatMap((pattern) => {
		const flags = pattern.flags.includes("g")
			? pattern.flags
			: `${pattern.flags}g`;
		return [...text.matchAll(new RegExp(pattern.source, flags))]
			.map((match) => match.slice(1).filter(Boolean).join("/"))
			.filter(Boolean);
	});
}

const fromUrls =
	(...patterns: RegExp[]): Discover =>
	({ text }) =>
		slugsFrom(text, patterns);

const fromOrigin =
	(evidence: RegExp, path: string): Discover =>
	({ text, origin }) =>
		evidence.test(text) ? [new URL(path, origin).toString()] : [];

const combine =
	(...detectors: Discover[]): Discover =>
	(input) =>
		detectors.flatMap((detect) => detect(input));

// Workday slugs are composite: "tenant/dc/site". Parse in one place.
const wd = (slug: string) => {
	const [tenant, dc, site] = slug.split("/");
	return {
		tenant,
		dc,
		site,
		base: `https://${tenant}.${dc}.myworkdayjobs.com`,
	};
};

export const ATS = {
	// ─── jsonSource: single GET returning an array ───────────────────────────
	greenhouse: {
		discover: fromUrls(
			/greenhouse\.io\/embed\/job_board\?(?:[^"'\s]*&)?for=([\w-]+)/i,
			/boards-api\.greenhouse\.io\/v1\/boards\/([\w-]+)/i,
			/(?:boards|job-boards)\.(?:eu\.)?greenhouse\.io\/([\w-]+)/i,
		),
		source: jsonSource({
			url: (slug) =>
				`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`,
			select: (r) => r.jobs,
			map: (p) => ({
				id: String(p.id),
				title: p.title,
				url: p.absolute_url,
			}),
		}),
	},

	lever: {
		discover: fromUrls(
			/jobs\.lever\.co\/([\w-]+)/i,
			/api\.lever\.co\/v0\/postings\/([\w-]+)/i,
		),
		source: jsonSource({
			url: (slug) => `https://api.lever.co/v0/postings/${slug}?mode=json`,
			select: (r) => r,
			map: (p) => ({
				id: String(p.id),
				title: p.text,
				url: p.hostedUrl ?? p.applyUrl,
			}),
		}),
	},

	ashby: {
		discover: fromUrls(
			/jobs\.ashbyhq\.com\/([\w-]+)/i,
			/api\.ashbyhq\.com\/posting-api\/job-board\/([\w-]+)/i,
		),
		source: jsonSource({
			url: (slug) => `https://api.ashbyhq.com/posting-api/job-board/${slug}`,
			select: (r) => r.jobs,
			map: (p) => ({
				id: String(p.id),
				title: p.title,
				url: p.jobUrl ?? p.applyUrl,
			}),
		}),
	},

	workable: {
		discover: fromUrls(/apply\.workable\.com\/([\w-]+)/i),
		source: jsonSource({
			url: (slug) =>
				`https://apply.workable.com/api/v1/widget/accounts/${slug}?details=true`,
			select: (r) => r.jobs,
			map: (p) => ({
				id: String(p.shortcode ?? p.code),
				title: p.title,
				url: p.url ?? p.shortlink,
			}),
		}),
	},

	recruitee: {
		discover: fromUrls(/([\w-]+)\.recruitee\.com/i),
		source: jsonSource({
			url: (slug) => `https://${slug}.recruitee.com/api/offers/`,
			select: (r) => r.offers,
			map: (p) => ({
				id: String(p.id),
				title: p.title,
				url: p.careers_url,
			}),
		}),
	},

	breezy: {
		discover: fromUrls(/([\w-]+)\.breezy\.hr/i),
		source: jsonSource({
			url: (slug) => `https://${slug}.breezy.hr/json?verbose=true`,
			select: (r) => r,
			map: (p) => ({
				id: String(p.id),
				title: p.name,
				url: p.url,
			}),
		}),
	},

	teamtailor: {
		discover: combine(
			fromUrls(
				/https?:\/\/((?!(?:app|www)\.)[\w-]+(?:\.[a-z]{2})?)\.teamtailor\.com/i,
			),
			fromOrigin(/teamtailor-cdn\.com/i, "/jobs.json"),
		),
		source: jsonSource({
			url: (slug) => `https://${slug}.teamtailor.com/jobs.json`,
			select: (r) => r.items,
			map: (p) => ({
				id: String(p.id),
				title: p.title,
				url: p.url,
			}),
		}),
	},

	bamboohr: {
		discover: fromUrls(/([\w-]+)\.bamboohr\.com/i),
		source: jsonSource({
			url: (slug) => `https://${slug}.bamboohr.com/careers/list`,
			select: (r) => r.result,
			map: (p, slug) => ({
				id: String(p.id),
				title: p.jobOpeningName,
				url: `https://${slug}.bamboohr.com/careers/${p.id}`,
			}),
		}),
	},

	// ─── pagedSource: cursor pagination (start/step) ─────────────────────────
	smartrecruiters: {
		discover: fromUrls(
			/careers\.smartrecruiters\.com\/([\w-]+)/i,
			/api\.smartrecruiters\.com\/v1\/companies\/([\w-]+)/i,
			/jobs\.smartrecruiters\.com\/(?:oneclick-ui\/company\/)?([\w-]+)/i,
		),
		source: pagedSource({
			request: (slug, offset) => ({
				url: `https://api.smartrecruiters.com/v1/companies/${slug}/postings?limit=100&offset=${offset}&country=ar`,
				init: {},
			}),
			start: 0,
			step: 100,
			select: (r) => r.content,
			map: (p, slug) => ({
				id: String(p.id),
				title: p.name,
				url: `https://jobs.smartrecruiters.com/${slug}/${p.id}`,
			}),
		}),
	},

	workday: {
		discover: fromUrls(
			/([\w-]+)\.(wd\d+)\.myworkdayjobs\.com\/(?:[a-z]{2}-[a-z]{2}\/)?([\w-]+)/i,
			/([\w-]+)\.(wd\d+)\.myworkdayjobs\.com\/[\w-]+\/([\w-]+)/i,
		),
		source: pagedSource({
			request: (slug, offset) => {
				const { tenant, site, base } = wd(slug);
				return {
					url: `${base}/wday/cxs/${tenant}/${site}/jobs`,
					init: {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							appliedFacets: {},
							searchText: "",
							limit: 20,
							offset,
						}),
					},
				};
			},
			start: 0,
			step: 20,
			select: (r) => r.jobPostings,
			map: (p, slug) => {
				const { site, base } = wd(slug);
				return {
					id: p.externalPath,
					title: p.title,
					url: `${base}/${site}${p.externalPath}`,
				};
			},
		}),
	},

	getonbrd: {
		discover: fromUrls(/getonbrd\.com\/companies\/([\w-]+)/i),
		source: pagedSource({
			request: (slug, page) => ({
				url: `https://www.getonbrd.com/api/v0/companies/${slug}/jobs?per_page=120&page=${page}`,
				init: {},
			}),
			start: 1,
			step: 1,
			select: (r) => r.data,
			map: (p) => ({
				id: p.id,
				title: p.attributes?.title,
				url: p.links?.public_url,
			}),
		}),
	},

	// ─── htmlSource: scrape listing page with a regex ────────────────────────
	hiringroom: {
		discover: fromUrls(/([\w-]+)\.hiringroom\.com/i),
		source: htmlSource({
			url: (slug) => `https://${slug}.hiringroom.com/jobs`,
			item: /\/jobs\/get_vacancy\/([a-f0-9]{24})"[\s\S]*?name__vacancy">\s*([^<]+?)\s*<\/h4>/g,
			map: (m, slug) => ({
				id: m[1],
				title: m[2],
				url: `https://${slug}.hiringroom.com/jobs/get_vacancy/${m[1]}`,
			}),
		}),
	},

	peopleforce: {
		discover: fromUrls(/([\w-]+)\.peopleforce\.io/i),
		source: htmlSource({
			url: (slug) => `https://${slug}.peopleforce.io/careers`,
			item: /\/careers\/v\/(\d+)-([^"#?]+)"/g,
			map: (m, slug) => ({
				id: m[1],
				title: m[2].replace(/-/g, " "),
				url: `https://${slug}.peopleforce.io/careers/v/${m[1]}-${m[2]}`,
			}),
		}),
	},
} satisfies Record<string, Ats>;

export type AtsName = keyof typeof ATS;
export type AtsBoard = { ats: AtsName; slug: string };

/** Detect every ATS board referenced by the supplied evidence. */
export function detectSources(input: DiscoveryInput): AtsBoard[] {
	const boards: AtsBoard[] = [];
	const seen = new Set<string>();
	for (const [ats, def] of Object.entries(ATS)) {
		for (const slug of def.discover(input)) {
			const key = `${ats}:${slug}`;
			if (seen.has(key)) continue;
			seen.add(key);
			boards.push({ ats: ats as AtsName, slug });
		}
	}
	return boards;
}
