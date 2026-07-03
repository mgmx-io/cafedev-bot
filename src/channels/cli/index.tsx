import { render, Static, Text, useInput, usePaste } from "ink";
import { Fragment, useRef, useState } from "react";
import { registerDocumentDelivery } from "@/chat/deliver";
import { handleIncoming } from "@/chat/handle";

registerDocumentDelivery("cli", async (_user, filename, data) => {
	const path = `data/${filename}`;
	await Bun.write(path, data);
	return path;
});

function Chat() {
	const [log, setLog] = useState<{ id: number; line: string }[]>([]);
	const [input, setInput] = useState("");
	const id = useRef(0);
	usePaste((t) => setInput((v) => v + t));
	useInput((char, key) => {
		if (key.return) submit();
		else if (key.backspace || key.delete) setInput((v) => v.slice(0, -1));
		else if (char && !key.ctrl) setInput((v) => v + char);
	});

	const add = (line: string) =>
		setLog((l) => [...l, { id: id.current++, line }]);

	async function submit() {
		const content = input.trim();
		setInput("");
		if (!content) return;
		add(`[usr] ${content}`);
		add(" ");
		const { text } = await handleIncoming({
			channel: "cli",
			channelUserId: "local",
			content,
		});
		add(`[bot] ${text}`);
	}

	return (
		<Fragment>
			<Static items={log}>{(t) => <Text key={t.id}>{t.line}</Text>}</Static>
			<Text>{`> ${input}`}</Text>
		</Fragment>
	);
}

render(<Chat />);
