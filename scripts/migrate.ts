import { readdirSync, readFileSync } from "node:fs";
import { db } from "../src/lib/db";

const MIGRATIONS = import.meta.dir + "/../migrations";

db.run(`CREATE TABLE IF NOT EXISTS _migrations (
  name       TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`);

const done = new Set(
  db.query<{ name: string }, []>("SELECT name FROM _migrations").all().map((r) => r.name),
);
const insert = db.query("INSERT INTO _migrations (name) VALUES (?)");

const apply = db.transaction((file: string) => {
  db.run(readFileSync(`${MIGRATIONS}/${file}`, "utf8"));
  insert.run(file);
});

const files = readdirSync(MIGRATIONS).filter((f) => f.endsWith(".sql")).sort();
for (const file of files) {
  if (done.has(file)) continue;
  apply(file);
  console.log("applied", file);
}
console.log(`migrations up to date (${files.length})`);
