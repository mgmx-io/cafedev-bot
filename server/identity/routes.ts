import { auth } from "@server/lib/auth";
import { BETTER_AUTH_URL } from "@server/lib/env";
import { Hono } from "hono";
import { confirmLink } from "./service";

export const identity = new Hono();

// Better Auth (web login) — default basePath /api/auth
identity.on(["POST", "GET"], "/auth/*", (c) => auth.handler(c.req.raw));

identity.get("/link/:token", async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session) {
		const { headers, response } = await auth.api.signInSocial({
			body: {
				provider: "google",
				callbackURL: new URL(new URL(c.req.url).pathname, BETTER_AUTH_URL).href,
			},
			returnHeaders: true,
		});
		if (!response.url) return c.text("No se pudo iniciar el login", 500);
		for (const cookie of headers.getSetCookie()) {
			c.header("set-cookie", cookie, { append: true });
		}
		return c.redirect(response.url);
	}

	const linked = confirmLink(c.req.param("token"), session.user.id);
	if (linked) return c.redirect("/");
	return c.text("Link inválido o vencido.", 400);
});
