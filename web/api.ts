export async function get<T>(url: string): Promise<T> {
	const r = await fetch(url);
	if (!r.ok) throw new Error(`${url}: ${r.status}`);
	return r.json();
}

export async function patch(url: string, body: unknown): Promise<void> {
	const r = await fetch(url, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
	if (!r.ok) throw new Error(`${url}: ${r.status}`);
}
