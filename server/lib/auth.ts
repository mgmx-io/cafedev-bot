import { expo } from "@better-auth/expo";
import { db } from "@server/lib/db";
import {
	BETTER_AUTH_SECRET,
	BETTER_AUTH_URL,
	EXPO_APP_SCHEME,
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET,
} from "@server/lib/env";
import { betterAuth } from "better-auth";

export const auth = betterAuth({
	database: db,
	secret: BETTER_AUTH_SECRET,
	baseURL: BETTER_AUTH_URL,
	trustedOrigins: [`${EXPO_APP_SCHEME}://`],
	plugins: [expo()],
	socialProviders: {
		google: {
			clientId: GOOGLE_CLIENT_ID,
			clientSecret: GOOGLE_CLIENT_SECRET,
		},
	},
});
