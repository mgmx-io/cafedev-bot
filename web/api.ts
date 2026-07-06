export async function get<T>(url: string): Promise<T> {
	const r = await fetch(url);
	if (!r.ok) throw new Error(`${url}: ${r.status}`);
	return r.json();
}
