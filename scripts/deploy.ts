#!/usr/bin/env bun
import { $ } from "bun";

console.log("→ git pull");
await $`git pull --ff-only`;

console.log("→ bun install");
await $`bun install --frozen-lockfile --production`;

console.log("→ install browser");
await $`bun run browser:install`;

console.log("→ migrate");
await $`bun scripts/migrate.ts`;

console.log("→ restart service");
const pid = (
	await $`systemctl show -p MainPID cafedev-bot --value`.text()
).trim();
if (pid !== "0") {
	await $`kill -TERM ${pid}`;
}

console.log("→ health check");
for (let i = 1; i <= 15; i++) {
	const ok = await fetch("http://127.0.0.1:3300/health")
		.then((r) => r.ok)
		.catch(() => false);
	if (ok) {
		console.log(` OK (after ${i}s)`);
		process.exit(0);
	}
	await Bun.sleep(1000);
}
console.log(" FAILED after 15s");
process.exit(1);
