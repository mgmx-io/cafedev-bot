import { telegram } from "@server/channels/telegram/routes";
import { identity } from "@server/identity/routes";
import { jobs } from "@server/jobs/routes";
import { PORT } from "@server/lib/env";
import spa from "@web/index.html";
import { Hono } from "hono";

const app = new Hono();

app.get("/health", (c) => c.text("ok"));
app.route("/api", identity);
app.route("/api", jobs);
app.route("/telegram", telegram);

export default {
	port: PORT,
	routes: { "/": spa },
	fetch: app.fetch,
};
