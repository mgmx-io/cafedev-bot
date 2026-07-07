import { STATUSES } from "@shared/jobs";
import { ChevronDown, Send } from "lucide-react";
import { BOT_URL } from "../constants";
import { useApplications, useSetStatus } from "../hooks/use-applications";
import { badgeVariants } from "./ui/badge";
import { Button } from "./ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "./ui/table";

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

// UTC fijo: la fecha guardada no debe correrse un día según el huso del viewer
const fmtDate = (d: string) =>
	new Date(d.slice(0, 10)).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
		timeZone: "UTC",
	});

export function ApplicationList() {
	const { data, isPending, isError } = useApplications();
	const { mutate: setStatus } = useSetStatus();
	if (isPending) return <p className="text-muted-foreground">Loading…</p>;
	if (isError)
		return (
			<p className="text-muted-foreground">Couldn't load. Refresh the page.</p>
		);
	if (data.length === 0)
		return (
			<p className="text-muted-foreground">
				Nothing here yet.{" "}
				<a
					className="text-foreground underline underline-offset-4"
					href={BOT_URL}
					target="_blank"
					rel="noreferrer"
				>
					Send the agent a job link
				</a>{" "}
				and it shows up on its own.
			</p>
		);
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Role</TableHead>
					<TableHead>Status</TableHead>
					<TableHead className="hidden sm:table-cell">Date</TableHead>
					<TableHead />
				</TableRow>
			</TableHeader>
			<TableBody>
				{data.map((a) => (
					<TableRow key={a.id}>
						<TableCell className="whitespace-normal">
							<a
								className="line-clamp-2 font-medium hover:underline sm:line-clamp-none"
								href={a.url}
								target="_blank"
								rel="noreferrer"
							>
								{a.title}
							</a>
						</TableCell>
						<TableCell>
							<DropdownMenu>
								<DropdownMenuTrigger
									className={badgeVariants({ variant: "secondary" })}
								>
									{cap(a.status)}
									<ChevronDown />
								</DropdownMenuTrigger>
								<DropdownMenuContent align="start">
									{STATUSES.map((s) => (
										<DropdownMenuItem
											key={s}
											className={
												s === a.status ? "bg-accent text-accent-foreground" : ""
											}
											onSelect={() => setStatus({ id: a.id, status: s })}
										>
											{cap(s)}
										</DropdownMenuItem>
									))}
								</DropdownMenuContent>
							</DropdownMenu>
						</TableCell>
						<TableCell className="hidden text-muted-foreground sm:table-cell">
							{fmtDate(a.created_at)}
						</TableCell>
						<TableCell className="text-right">
							<Button asChild size="icon-sm" variant="ghost">
								<a
									aria-label="Send to chat"
									href={`${BOT_URL}?text=${encodeURIComponent(a.url)}`}
									target="_blank"
									rel="noreferrer"
								>
									<Send />
								</a>
							</Button>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}
