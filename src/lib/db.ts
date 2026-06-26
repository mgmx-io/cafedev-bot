import { Database } from "bun:sqlite";
import { DB_PATH } from "./env";

export const db = new Database(DB_PATH);
db.run("PRAGMA journal_mode = WAL");
