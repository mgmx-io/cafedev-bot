import { auth } from "@server/lib/auth";
import { BETTER_AUTH_URL } from "@server/lib/env";
import { createMiddleware } from "hono/factory";

export const requireAuth = createMiddleware<{ Variables: { userId: string } }>(
	async (c, next) => {
		const session = await auth.api.getSession({ headers: c.req.raw.headers });
		if (session) {
			c.set("userId", session.user.id);
			return next();
		}
		const { headers, response } = await auth.api.signInSocial({
			body: {
				provider: "google",
				callbackURL: BETTER_AUTH_URL + new URL(c.req.url).pathname,
			},
			returnHeaders: true,
		});
		if (!response.url) return c.text("No se pudo iniciar el login", 500);
		for (const cookie of headers.getSetCookie()) {
			c.header("set-cookie", cookie, { append: true });
		}
		return c.redirect(response.url);
	},
);
