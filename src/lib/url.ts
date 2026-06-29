// Canonicalize a pasted job URL so the same job dedupes to one row.
// ponytail: denylist only tracking noise — job-id params (gh_jid, jobId) must survive.
const TRACKING =
	/^(utm_|gh_src$|ref$|source$|src$|fbclid$|gclid$|mc_|_hs|igshid$|trk$)/i;

export function normalizeUrl(raw: string): string {
	const u = new URL(raw);
	u.hash = "";
	u.hostname = u.hostname.toLowerCase();
	for (const key of [...u.searchParams.keys()]) {
		if (TRACKING.test(key)) u.searchParams.delete(key);
	}
	u.searchParams.sort(); // stable order: ?a&b === ?b&a
	return u.toString();
}
