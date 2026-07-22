import { authRoutes } from "@server/auth/routes";
import { chat } from "@server/channels/mobile/routes";
import { channelLinks } from "@server/channels/shared/link-routes";
import { telegram } from "@server/channels/telegram/routes";
import { startPolling } from "@server/jobs/poll";
import { jobs } from "@server/jobs/routes";
import { PORT } from "@server/lib/env";
import spa from "@web/index.html";
import { Hono } from "hono";

startPolling();

const app = new Hono();

app.get("/health", (c) => c.json({ status: "ok" }));
app.route("/api", authRoutes);
app.route("/api", channelLinks);
app.route("/api", chat);
app.route("/api", jobs);
app.route("/telegram", telegram);

export default {
	port: PORT,
	routes: { "/": spa },
	fetch: app.fetch,
};
