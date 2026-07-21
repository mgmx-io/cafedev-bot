const FLOAT_BYTES = Float32Array.BYTES_PER_ELEMENT;

/** Serialize an embedding as compact float32 bytes for SQLite BLOB storage. */
export function encodeEmbedding(values: readonly number[]): Uint8Array {
	if (!values.length) throw new Error("embedding must not be empty");
	if (values.some((value) => !Number.isFinite(value)))
		throw new Error("embedding values must be finite");

	const floats = Float32Array.from(values);
	return new Uint8Array(floats.buffer);
}

/** Deserialize a SQLite BLOB into its float32 embedding. */
export function decodeEmbedding(bytes: Uint8Array): Float32Array {
	if (!bytes.byteLength || bytes.byteLength % FLOAT_BYTES !== 0)
		throw new Error("invalid embedding blob");

	// SQLite may return a view with an arbitrary byte offset; copy before casting.
	const copy = bytes.slice();
	return new Float32Array(copy.buffer);
}

/** Cosine similarity for two equal-length, non-zero embeddings. */
export function cosineSimilarity(
	a: ArrayLike<number>,
	b: ArrayLike<number>,
): number {
	if (!a.length || a.length !== b.length)
		throw new Error("embeddings must have the same non-zero dimensions");

	let dot = 0;
	let normA = 0;
	let normB = 0;
	for (let i = 0; i < a.length; i++) {
		const av = a[i];
		const bv = b[i];
		dot += av * bv;
		normA += av * av;
		normB += bv * bv;
	}
	if (!normA || !normB) throw new Error("embeddings must have non-zero norms");

	// Floating-point arithmetic can exceed the mathematical bounds by an epsilon.
	return Math.max(-1, Math.min(1, dot / Math.sqrt(normA * normB)));
}
