import { Database } from "bun:sqlite";

export const db = new Database(process.env.DB_PATH);
db.run("PRAGMA journal_mode = WAL");
