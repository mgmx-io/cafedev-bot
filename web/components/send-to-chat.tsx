import { Send } from "lucide-react";
import { BOT_URL } from "../constants";
import { Button } from "./ui/button";

export function SendToChat({ url }: { url: string }) {
	return (
		<Button asChild size="icon-sm" variant="ghost">
			<a
				aria-label="Send to chat"
				href={`${BOT_URL}?text=${encodeURIComponent(url)}`}
				target="_blank"
				rel="noreferrer"
			>
				<Send />
			</a>
		</Button>
	);
}
