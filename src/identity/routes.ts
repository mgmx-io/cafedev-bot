import { readFileSync } from "node:fs";
import { Hono } from "hono";
import { auth } from "@/lib/auth";
import { confirmLink } from "./service";

const confirmPage = readFileSync(`${import.meta.dir}/link.html`, "utf8");

export const identity = new Hono();

// Better Auth (web login) — default basePath /api/auth
identity.on(["POST", "GET"], "/auth/*", (c) => auth.handler(c.req.raw));

// Magic-link landing.
identity.get("/link/:token", async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session) {
		// no session → bounce straight to Google, come back here once logged in
		const res = await auth.api.signInSocial({
			body: { provider: "google", callbackURL: c.req.url },
		});
		if (!res.url) return c.text("No se pudo iniciar el login", 500);
		return c.redirect(res.url);
	}
	// logged in → serve the confirm page; binding happens on POST (prefetch-safe)
	return c.html(confirmPage);
});

identity.post("/link/:token", async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session) return c.json({ error: "unauthorized" }, 401);
	if (!confirmLink(c.req.param("token"), session.user.id)) {
		return c.json({ error: "invalid_or_expired" }, 400);
	}
	return c.json({ linked: true });
});
