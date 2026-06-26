import { createMiddleware } from "hono/factory";
import { auth } from "@/lib/auth";

export const requireAuth = createMiddleware<{ Variables: { userId: string } }>(
	async (c, next) => {
		const session = await auth.api.getSession({ headers: c.req.raw.headers });
		if (session) {
			c.set("userId", session.user.id);
			return next();
		}
		const { headers, response } = await auth.api.signInSocial({
			body: { provider: "google", callbackURL: c.req.url },
			returnHeaders: true,
		});
		if (!response.url) return c.text("No se pudo iniciar el login", 500);
		for (const cookie of headers.getSetCookie()) {
			c.header("set-cookie", cookie, { append: true });
		}
		return c.redirect(response.url);
	},
);
