import { db } from "@server/lib/db";
import { r2 } from "@server/lib/r2";

export type Artifact = {
	id: string;
	filename: string;
	sha256: string;
	size: number;
};

type StoredArtifact = {
	filename: string;
	object_key: string;
	content_type: string;
};

type SaveArtifact = {
	userId: string;
	kind: string;
	filename: string;
	contentType: string;
	data: Uint8Array;
};

/** Upload an immutable artifact to R2 and persist its ownership and metadata. */
export async function saveArtifact({
	userId,
	kind,
	filename,
	contentType,
	data,
}: SaveArtifact): Promise<Artifact> {
	const id = crypto.randomUUID();
	const objectKey = `artifacts/${id}`;
	const sha256 = new Bun.CryptoHasher("sha256").update(data).digest("hex");

	await r2.write(objectKey, data, { type: contentType });
	try {
		db.run(
			`INSERT INTO artifacts
			 (id, user_id, kind, filename, object_key, content_type, sha256, size)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			[
				id,
				userId,
				kind,
				filename,
				objectKey,
				contentType,
				sha256,
				data.byteLength,
			],
		);
	} catch (error) {
		await r2
			.delete(objectKey)
			.catch((cleanupError) =>
				console.error(
					`artifact cleanup failed for ${objectKey}:`,
					cleanupError,
				),
			);
		throw error;
	}

	return { id, filename, sha256, size: data.byteLength };
}

/** Read one of the user's artifacts for a browser upload. */
export async function readArtifact(
	userId: string,
	id: string,
): Promise<{ filename: string; contentType: string; data: Uint8Array } | null> {
	const artifact = db
		.query<StoredArtifact, [string, string]>(
			"SELECT filename, object_key, content_type FROM artifacts WHERE id = ? AND user_id = ?",
		)
		.get(id, userId);
	if (!artifact) return null;
	const data = new Uint8Array(await r2.file(artifact.object_key).arrayBuffer());
	return {
		filename: artifact.filename,
		contentType: artifact.content_type,
		data,
	};
}
