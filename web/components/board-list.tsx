import { Send } from "lucide-react";
import { BOT_URL } from "../constants";
import { useBoardOpenings } from "../hooks/use-boards";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "./ui/accordion";
import { Button } from "./ui/button";

export function BoardList() {
	const { data, isPending, isError } = useBoardOpenings();
	if (isPending)
		return <p className="text-muted-foreground">Checking boards…</p>;
	if (isError)
		return (
			<p className="text-muted-foreground">Couldn't load. Refresh the page.</p>
		);
	if (data.boards.length === 0 && data.failed.length === 0)
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
		<div>
			<Accordion type="multiple">
				{data.boards.map((b) => (
					<AccordionItem
						key={`${b.ats}/${b.slug}`}
						value={`${b.ats}/${b.slug}`}
					>
						<AccordionTrigger>
							<span className="font-semibold">
								{b.slug}{" "}
								<span className="font-normal text-muted-foreground">
									· {b.ats} · {b.postings.length} openings
								</span>
							</span>
						</AccordionTrigger>
						<AccordionContent>
							{b.postings.length === 0 ? (
								<p className="text-muted-foreground text-sm">
									No openings right now.
								</p>
							) : (
								<ul className="divide-y">
									{b.postings.map((p) => (
										<li
											key={p.url}
											className="flex items-center justify-between gap-2 py-2 text-sm"
										>
											<a
												className="line-clamp-2 hover:underline"
												href={p.url}
												target="_blank"
												rel="noreferrer"
											>
												{p.title}
											</a>
											<Button asChild size="icon-sm" variant="ghost">
												<a
													aria-label="Send to chat"
													href={`${BOT_URL}?text=${encodeURIComponent(p.url)}`}
													target="_blank"
													rel="noreferrer"
												>
													<Send />
												</a>
											</Button>
										</li>
									))}
								</ul>
							)}
						</AccordionContent>
					</AccordionItem>
				))}
			</Accordion>
			{data.failed.length > 0 && (
				<p className="text-muted-foreground text-sm">
					Couldn't check: {data.failed.join(", ")}
				</p>
			)}
		</div>
	);
}
