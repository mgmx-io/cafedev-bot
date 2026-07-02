import { expect, test } from "bun:test";
import { pagedSource } from "@/jobs/source";

// Workday-style wrap-around: past the total the server re-serves the first
// page instead of returning an empty one. The source must stop anyway.
test("pagedSource stops on a page with no new ids", async () => {
	globalThis.fetch = (async (_url: string, init: RequestInit) => {
		const { offset } = JSON.parse(init.body as string);
		const ids = offset < 4 ? [offset, offset + 1] : [0, 1];
		return Response.json({ jobs: ids.map((id) => ({ id })) });
	}) as typeof fetch;

	const source = pagedSource({
		request: (_slug, offset) => ({
			url: "https://ats.test/jobs",
			init: { method: "POST", body: JSON.stringify({ offset }) },
		}),
		start: 0,
		step: 2,
		select: (r) => r.jobs,
		map: (p) => ({ id: String(p.id), title: "t", url: `https://x/${p.id}` }),
	});

	const postings = await source("acme");
	expect(postings.map((p) => p.id)).toEqual(["0", "1", "2", "3"]);
});
