function required(name: string): string {
	const value = process.env[name];
	if (!value) throw new Error(`Missing env var: ${name}`);
	return value;
}

export const DB_PATH = required("DB_PATH");
export const PORT = Number(required("PORT"));
