import { render, Static, Text, useInput, usePaste } from "ink";
import { Fragment, useRef, useState } from "react";
import { registerDelivery } from "@/chat/deliver";
import { handleIncoming } from "@/chat/handle";

let print: (line: string) => void;

registerDelivery("cli", {
	message: async ({ text }) => print(`[bot] ${text}`),
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
	print = add;

	async function submit() {
		const content = input.trim();
		setInput("");
		if (!content) return;
		add(`[usr] ${content}`);
		add(" ");
		await handleIncoming({ channel: "cli", channelUserId: "local", content });
	}

	return (
		<Fragment>
			<Static items={log}>{(t) => <Text key={t.id}>{t.line}</Text>}</Static>
			<Text>{`> ${input}`}</Text>
		</Fragment>
	);
}

render(<Chat />);
