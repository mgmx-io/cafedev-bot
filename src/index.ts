import { Hono } from "hono";
import { PORT } from "@/lib/env";

const app = new Hono();

app.get("/health", (c) => c.text("ok"));

export default { port: PORT, fetch: app.fetch };
