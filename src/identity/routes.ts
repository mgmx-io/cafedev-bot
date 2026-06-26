import { Hono } from "hono";
import { auth } from "@/lib/auth";

export const identity = new Hono();

identity.on(["POST", "GET"], "/auth/*", (c) => auth.handler(c.req.raw));
