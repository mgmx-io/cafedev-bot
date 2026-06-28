import {
	type AtsRequest,
	htmlSource,
	jsonSource,
	pagedSource,
	type Source,
	sitemapSource,
} from "@/jobs/source";

export type DetailRoute = (slug: string, externalId: string) => AtsRequest;

export type Ats = { match: RegExp[]; source: Source; detail?: DetailRoute };

const get = (url: string): AtsRequest => ({ url, init: { method: "GET" } });

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
			/boards-api\.greenhouse\.io\/v1\/boards\/([\w-]+)/i,
			/(?:boards|job-boards)\.(?:eu\.)?greenhouse\.io\/([\w-]+)/i,
			/greenhouse\.io\/embed\/job_board\?(?:[^"'\s]*&)?for=([\w-]+)/i,
		],
		source: jsonSource({
			url: (slug) =>
				`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`,
			select: (r) => r.jobs,
			map: (p) => ({
				externalId: String(p.id),
				url: p.absolute_url ?? null,
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
				externalId: String(p.id),
				url: p.hostedUrl ?? p.applyUrl ?? null,
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
				externalId: String(p.id),
				url: p.jobUrl ?? p.applyUrl ?? null,
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
				externalId: String(p.shortcode ?? p.code),
				url: p.url ?? p.shortlink ?? null,
			}),
		}),
	},

	recruitee: {
		match: [/([\w-]+)\.recruitee\.com/i],
		source: jsonSource({
			url: (slug) => `https://${slug}.recruitee.com/api/offers/`,
			select: (r) => r.offers,
			map: (p) => ({
				externalId: String(p.id),
				url: p.careers_url ?? null,
			}),
		}),
	},

	breezy: {
		match: [/([\w-]+)\.breezy\.hr/i],
		source: jsonSource({
			url: (slug) => `https://${slug}.breezy.hr/json?verbose=true`,
			select: (r) => r,
			map: (p) => ({
				externalId: String(p.id),
				url: p.url ?? null,
			}),
		}),
	},

	teamtailor: {
		match: [/([\w-]+)\.teamtailor\.com/i],
		source: jsonSource({
			url: (slug) => `https://${slug}.teamtailor.com/jobs.json`,
			select: (r) => r.items,
			map: (p) => ({
				externalId: String(p.id),
				url: p.url ?? null,
			}),
		}),
	},

	bamboohr: {
		match: [/([\w-]+)\.bamboohr\.com/i],
		source: jsonSource({
			url: (slug) => `https://${slug}.bamboohr.com/careers/list`,
			select: (r) => r.result,
			map: (p, slug) => ({
				externalId: String(p.id),
				url: `https://${slug}.bamboohr.com/careers/${p.id}`,
			}),
		}),
		// list endpoint carries no description; the /detail JSON does
		detail: (slug, id) =>
			get(`https://${slug}.bamboohr.com/careers/${id}/detail`),
	},

	// ─── pagedSource: cursor pagination (start/step) ─────────────────────────
	smartrecruiters: {
		match: [
			/careers\.smartrecruiters\.com\/([\w-]+)/i,
			/api\.smartrecruiters\.com\/v1\/companies\/([\w-]+)/i,
			/jobs\.smartrecruiters\.com\/(?:oneclick-ui\/company\/)?([\w-]+)/i,
		],
		source: pagedSource({
			request: (slug, offset) =>
				get(
					`https://api.smartrecruiters.com/v1/companies/${slug}/postings?limit=100&offset=${offset}&country=ar`,
				),
			start: 0,
			step: 100,
			select: (r) => r.content,
			map: (p, slug) => ({
				externalId: String(p.id),
				url: `https://jobs.smartrecruiters.com/${slug}/${p.id}`,
			}),
		}),
		detail: (slug, id) =>
			get(
				`https://api.smartrecruiters.com/v1/companies/${slug}/postings/${id}`,
			),
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
					externalId: p.externalPath,
					url: `${base}/${site}${p.externalPath}`,
				};
			},
		}),
		detail: (slug, externalId) => {
			const { tenant, site, base } = wd(slug);
			return get(`${base}/wday/cxs/${tenant}/${site}${externalId}`);
		},
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
				externalId: p.id,
				url: p.links?.public_url ?? null,
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
				externalId: m[1],
				url: `https://${slug}.hiringroom.com/jobs/get_vacancy/${m[1]}`,
			}),
		}),
		detail: (slug, id) =>
			get(`https://${slug}.hiringroom.com/jobs/get_vacancy/${id}`),
	},

	peopleforce: {
		match: [/([\w-]+)\.peopleforce\.io/i],
		source: htmlSource({
			url: (slug) => `https://${slug}.peopleforce.io/careers`,
			item: /\/careers\/v\/(\d+)-([^"#?]+)"/g,
			map: (m, slug) => ({
				externalId: m[1],
				url: `https://${slug}.peopleforce.io/careers/v/${m[1]}-${m[2]}`,
			}),
		}),
		detail: (slug, id) => get(`https://${slug}.peopleforce.io/careers/v/${id}`),
	},

	// ─── sitemapSource: parse sitemap.xml ────────────────────────────────────
	successfactors: {
		match: [/rmkcdn\.successfactors\.com/i],
		source: sitemapSource({
			loc: /\/job\/([^/]+)\/(\d+)\/?$/,
		}),
		detail: (slug, id) => get(`https://${slug}/job/x/${id}/`),
	},
} satisfies Record<string, Ats>;
