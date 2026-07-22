import { auth } from "@server/lib/auth";
import { Hono } from "hono";

export const authRoutes = new Hono();

authRoutes.on(["POST", "GET"], "/auth/*", (c) => auth.handler(c.req.raw));
