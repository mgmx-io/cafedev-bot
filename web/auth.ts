import { createAuthClient } from "better-auth/react";

export const auth = createAuthClient();

export function login() {
	auth.signIn.social({ provider: "google", callbackURL: "/" });
}
