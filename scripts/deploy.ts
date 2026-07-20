#!/usr/bin/env bun
import { $ } from "bun";

const SERVICE = "cafedev-bot";

const getMainPid = async () =>
	Number(
		(
			await $`systemctl show -p MainPID ${SERVICE} --value`.quiet().text()
		).trim(),
	);

console.log("→ git pull");
await $`git pull --ff-only`;

console.log("→ bun install");
await $`bun install --frozen-lockfile --production`;

console.log("→ install browser");
await $`bunx playwright install chromium`;

console.log("→ migrate");
await $`bun scripts/migrate.ts`;

console.log("→ restart service");
const oldPid = await getMainPid();
if (!Number.isInteger(oldPid) || oldPid <= 0) {
	throw new Error(`${SERVICE} has no running main process`);
}

console.log(` old PID: ${oldPid}`);
const kill = Bun.spawn(["/usr/bin/kill", "-TERM", String(oldPid)], {
	stdout: "inherit",
	stderr: "inherit",
});
const killExitCode = await kill.exited;
if (killExitCode !== 0) {
	throw new Error(`/usr/bin/kill exited with code ${killExitCode}`);
}

let newPid = 0;
for (let i = 0; i < 40; i++) {
	await Bun.sleep(500);
	newPid = await getMainPid();
	if (newPid > 0 && newPid !== oldPid) break;
}

if (newPid <= 0 || newPid === oldPid) {
	throw new Error(`${SERVICE} did not replace PID ${oldPid} within 20s`);
}

console.log(` new PID: ${newPid}`);

console.log("→ health check");
for (let i = 1; i <= 15; i++) {
	const ok = await fetch("http://127.0.0.1:3300/health")
		.then((r) => r.ok)
		.catch(() => false);
	if (ok) {
		console.log(` OK (after ${i}s)`);
		const commit = (await $`git rev-parse --short HEAD`.quiet().text()).trim();
		console.log(` deployed commit: ${commit}`);
		process.exit(0);
	}
	await Bun.sleep(1000);
}
console.log(" FAILED after 15s");
process.exit(1);
