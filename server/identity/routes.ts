import { auth } from "@server/lib/auth";
import { requireAuth } from "@server/lib/auth-guard";
import { Hono } from "hono";
import { confirmLink } from "./service";

export const identity = new Hono();

// Better Auth (web login) — default basePath /api/auth
identity.on(["POST", "GET"], "/auth/*", (c) => auth.handler(c.req.raw));

// Magic-link landing: requireAuth bounces to Google if needed, else binds.
identity.get("/link/:token", requireAuth, (c) => {
	const linked = confirmLink(c.req.param("token"), c.get("userId"));
	if (linked) return c.redirect("/");
	return c.text("Link inválido o vencido.", 400);
});
