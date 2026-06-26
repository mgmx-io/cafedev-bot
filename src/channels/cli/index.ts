import { handleIncoming } from "@/chat/handle";

for await (const line of console) {
	if (!line.trim()) continue;
	const { text } = await handleIncoming({
		channel: "cli",
		channelUserId: "local",
		text: line,
	});
	console.log(text);
}
