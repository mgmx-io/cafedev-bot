import { LangfuseSpanProcessor } from "@langfuse/otel";
import { LangfuseVercelAiSdkIntegration } from "@langfuse/vercel-ai-sdk";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY } from "@server/lib/env";
import { registerTelemetry } from "ai";

// ponytail: no keys -> telemetry off, app runs normally.
// CLI is one-shot so its spans may not flush before exit; fine for the dev server.
if (LANGFUSE_PUBLIC_KEY && LANGFUSE_SECRET_KEY) {
	new NodeSDK({ spanProcessors: [new LangfuseSpanProcessor()] }).start();
	registerTelemetry(new LangfuseVercelAiSdkIntegration());
}
