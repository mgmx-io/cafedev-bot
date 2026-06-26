import { Hono } from "hono";
import { identity } from "@/identity/routes";
import { PORT } from "@/lib/env";

const app = new Hono();

app.get("/health", (c) => c.text("ok"));
app.route("/api", identity);

export default { port: PORT, fetch: app.fetch };
