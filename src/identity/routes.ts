import { Hono } from "hono";
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/auth-guard";
import { confirmLink } from "./service";

export const identity = new Hono();

// Better Auth (web login) — default basePath /api/auth
identity.on(["POST", "GET"], "/auth/*", (c) => auth.handler(c.req.raw));

// Magic-link landing: requireAuth bounces to Google if needed, else binds.
identity.get("/link/:token", requireAuth, (c) => {
	const linked = confirmLink(c.req.param("token"), c.get("userId"));
	if (linked) return c.text("¡Vinculado! Volvé al chat.");
	return c.text("Link inválido o vencido.", 400);
});
