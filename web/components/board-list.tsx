import type { BoardOpenings } from "@shared/jobs";
import { X } from "lucide-react";
import { useState } from "react";
import { BOT_URL } from "../constants";
import { useBoardOpenings, useUnfollowBoard } from "../hooks/use-boards";
import { SendToChat } from "./send-to-chat";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "./ui/accordion";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";

export function BoardList() {
	const { data, isPending, isError } = useBoardOpenings();
	const { mutate: unfollowBoard } = useUnfollowBoard();
	const [toUnfollow, setToUnfollow] = useState<BoardOpenings | null>(null);
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
						<div className="flex items-center pl-2 hover:bg-muted/50">
							<Button
								aria-label="Unfollow"
								size="icon-sm"
								variant="ghost"
								className="text-muted-foreground"
								onClick={() => setToUnfollow(b)}
							>
								<X />
							</Button>
							<AccordionTrigger className="rounded-none pr-4 pl-2">
								<span className="font-semibold">
									{b.slug}{" "}
									<span className="font-normal text-muted-foreground">
										· {b.ats} · {b.postings.length} openings
									</span>
								</span>
							</AccordionTrigger>
						</div>
						<AccordionContent>
							{b.postings.length === 0 ? (
								<p className="px-2 text-muted-foreground text-sm">
									No openings right now.
								</p>
							) : (
								<ul className="divide-y">
									{b.postings.map((p) => (
										<li
											key={p.url}
											className="flex items-center justify-between gap-2 px-2 py-2 text-sm transition-colors hover:bg-muted/50"
										>
											<a
												className="line-clamp-2 hover:underline"
												href={p.url}
												target="_blank"
												rel="noreferrer"
											>
												{p.title}
											</a>
											<SendToChat url={p.url} />
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
			<AlertDialog
				open={toUnfollow !== null}
				onOpenChange={(open) => !open && setToUnfollow(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Unfollow {toUnfollow?.slug}?</AlertDialogTitle>
						<AlertDialogDescription>
							Its openings stop showing up here. You can always ask the agent to
							follow it again.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							onClick={() => toUnfollow && unfollowBoard(toUnfollow.id)}
						>
							Unfollow
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
