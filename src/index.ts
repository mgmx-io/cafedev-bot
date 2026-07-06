import { Hono } from "hono";
import { telegram } from "@/channels/telegram/routes";
import { identity } from "@/identity/routes";
import { PORT } from "@/lib/env";
import spa from "@/web/index.html";

const app = new Hono();

app.get("/health", (c) => c.text("ok"));
app.route("/api", identity);
app.route("/telegram", telegram);

export default {
	port: PORT,
	routes: { "/app": spa, "/app/*": spa },
	fetch: app.fetch,
};
