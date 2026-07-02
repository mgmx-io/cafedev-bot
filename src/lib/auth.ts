import { betterAuth } from "better-auth";
import { db } from "@/lib/db";
import {
	BETTER_AUTH_SECRET,
	BETTER_AUTH_URL,
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET,
} from "@/lib/env";

export const auth = betterAuth({
	database: db,
	secret: BETTER_AUTH_SECRET,
	baseURL: BETTER_AUTH_URL,
	account: { skipStateCookieCheck: true },
	socialProviders: {
		google: {
			clientId: GOOGLE_CLIENT_ID,
			clientSecret: GOOGLE_CLIENT_SECRET,
		},
	},
});
