import { betterAuth } from "better-auth";
import { db } from "@/lib/db";
import { BETTER_AUTH_SECRET, BETTER_AUTH_URL } from "@/lib/env";

export const auth = betterAuth({
	database: db,
	secret: BETTER_AUTH_SECRET,
	baseURL: BETTER_AUTH_URL,
});
