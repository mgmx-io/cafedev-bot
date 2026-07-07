import { BOT_URL } from "../constants";
import { useBoards } from "../hooks/use-boards";

export function BoardList() {
	const { data, isPending, isError } = useBoards();
	if (isPending) return <p className="text-muted-foreground">Loading…</p>;
	if (isError)
		return (
			<p className="text-muted-foreground">Couldn't load. Refresh the page.</p>
		);
	if (data.length === 0)
		return (
			<p className="text-muted-foreground">
				<a
					className="text-foreground underline underline-offset-4"
					href={BOT_URL}
					target="_blank"
					rel="noreferrer"
				>
					Ask the agent
				</a>{" "}
				to follow a company's board and it shows up here.
			</p>
		);
	return (
		<ul className="divide-y">
			{data.map((b) => (
				<li
					key={b.id}
					className="flex items-center justify-between py-2 text-sm"
				>
					<span className="font-medium">{b.slug}</span>
					<span className="text-muted-foreground">{b.ats}</span>
				</li>
			))}
		</ul>
	);
}
