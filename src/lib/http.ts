const TIMEOUT_MS = 15_000;

export function request(url: string, init?: RequestInit): Promise<Response> {
	return fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
}
