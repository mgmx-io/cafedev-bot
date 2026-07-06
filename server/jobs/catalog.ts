import {
	htmlSource,
	jsonSource,
	pagedSource,
	type Source,
} from "@server/jobs/source";

export type Ats = { match: RegExp[]; source: Source };

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
		match: [
			/greenhouse\.io\/embed\/job_board\?(?:[^"'\s]*&)?for=([\w-]+)/i,
			/boards-api\.greenhouse\.io\/v1\/boards\/([\w-]+)/i,
			/(?:boards|job-boards)\.(?:eu\.)?greenhouse\.io\/([\w-]+)/i,
		],
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
		match: [
			/jobs\.lever\.co\/([\w-]+)/i,
			/api\.lever\.co\/v0\/postings\/([\w-]+)/i,
		],
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
		match: [
			/jobs\.ashbyhq\.com\/([\w-]+)/i,
			/api\.ashbyhq\.com\/posting-api\/job-board\/([\w-]+)/i,
		],
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
		match: [/apply\.workable\.com\/([\w-]+)/i],
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
		match: [/([\w-]+)\.recruitee\.com/i],
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
		match: [/([\w-]+)\.breezy\.hr/i],
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
		match: [/([\w-]+(?:\.[a-z]{2})?)\.teamtailor\.com/i],
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
		match: [/([\w-]+)\.bamboohr\.com/i],
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
		match: [
			/careers\.smartrecruiters\.com\/([\w-]+)/i,
			/api\.smartrecruiters\.com\/v1\/companies\/([\w-]+)/i,
			/jobs\.smartrecruiters\.com\/(?:oneclick-ui\/company\/)?([\w-]+)/i,
		],
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
		match: [
			/([\w-]+)\.(wd\d+)\.myworkdayjobs\.com\/(?:[a-z]{2}-[a-z]{2}\/)?([\w-]+)/i,
			/([\w-]+)\.(wd\d+)\.myworkdayjobs\.com\/[\w-]+\/([\w-]+)/i,
		],
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
		match: [/getonbrd\.com\/companies\/([\w-]+)/i],
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
		match: [/([\w-]+)\.hiringroom\.com/i],
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
		match: [/([\w-]+)\.peopleforce\.io/i],
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

/** Detect the ATS + canonical slug for a pasted job URL, if it matches the catalog. */
export function detectSource(
	url: string,
): { ats: AtsName; slug: string } | null {
	for (const [ats, def] of Object.entries(ATS)) {
		for (const re of def.match) {
			const m = url.match(re);
			const slug = m?.slice(1).filter(Boolean).join("/");
			if (slug) return { ats: ats as AtsName, slug };
		}
	}
	return null;
}
