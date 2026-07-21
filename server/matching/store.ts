import { db } from "@server/lib/db";
import { decodeEmbedding, encodeEmbedding } from "@server/matching/vector";

export type StoredEmbedding = {
	summary: string;
	embedding: Float32Array;
};

type EmbeddingRow = {
	summary: string;
	embedding: Uint8Array;
};

export type JobMatch = {
	job_id: number;
	similarity: number;
};

function unpack(row: EmbeddingRow | null): StoredEmbedding | null {
	return row
		? { summary: row.summary, embedding: decodeEmbedding(row.embedding) }
		: null;
}

export function getJobEmbedding(jobId: number): StoredEmbedding | null {
	return unpack(
		db
			.query<EmbeddingRow, [number]>(
				"SELECT summary, embedding FROM job_embeddings WHERE job_id = ?",
			)
			.get(jobId),
	);
}

export function getUserEmbedding(userId: string): StoredEmbedding | null {
	return unpack(
		db
			.query<EmbeddingRow, [string]>(
				"SELECT summary, embedding FROM user_embeddings WHERE user_id = ?",
			)
			.get(userId),
	);
}

export function saveJobEmbedding(
	jobId: number,
	summary: string,
	embedding: readonly number[],
): void {
	db.transaction(() => {
		db.run("DELETE FROM job_matches WHERE job_id = ?", [jobId]);
		db.run(
			`INSERT INTO job_embeddings (job_id, summary, embedding) VALUES (?, ?, ?)
			 ON CONFLICT (job_id) DO UPDATE SET
			 summary = excluded.summary, embedding = excluded.embedding`,
			[jobId, summary, encodeEmbedding(embedding)],
		);
	})();
}

export function saveUserEmbedding(
	userId: string,
	summary: string,
	embedding: readonly number[],
): void {
	db.transaction(() => {
		db.run("DELETE FROM job_matches WHERE user_id = ?", [userId]);
		db.run(
			`INSERT INTO user_embeddings (user_id, summary, embedding) VALUES (?, ?, ?)
			 ON CONFLICT (user_id) DO UPDATE SET
			 summary = excluded.summary, embedding = excluded.embedding`,
			[userId, summary, encodeEmbedding(embedding)],
		);
	})();
}

export function invalidateJobEmbedding(jobId: number): void {
	db.transaction(() => {
		db.run("DELETE FROM job_matches WHERE job_id = ?", [jobId]);
		db.run("DELETE FROM job_embeddings WHERE job_id = ?", [jobId]);
	})();
}

export function invalidateUserEmbedding(userId: string): void {
	db.transaction(() => {
		db.run("DELETE FROM job_matches WHERE user_id = ?", [userId]);
		db.run("DELETE FROM user_embeddings WHERE user_id = ?", [userId]);
	})();
}

export function saveJobMatch(
	userId: string,
	jobId: number,
	similarity: number,
): void {
	if (!Number.isFinite(similarity) || similarity < -1 || similarity > 1)
		throw new Error("similarity must be between -1 and 1");

	db.run(
		`INSERT INTO job_matches (user_id, job_id, similarity) VALUES (?, ?, ?)
		 ON CONFLICT (user_id, job_id) DO UPDATE SET similarity = excluded.similarity`,
		[userId, jobId, similarity],
	);
}

export function listJobMatches(userId: string, limit: number): JobMatch[] {
	if (!Number.isInteger(limit) || limit <= 0)
		throw new Error("limit must be a positive integer");

	return db
		.query<JobMatch, [string, number]>(
			`SELECT job_id, similarity FROM job_matches
			 WHERE user_id = ? ORDER BY similarity DESC LIMIT ?`,
		)
		.all(userId, limit);
}
