import { type Application, STATUSES } from "@shared/jobs";
import { cn } from "@web/lib/utils";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { BOT_URL } from "../constants";
import {
	useApplications,
	useDeleteApplication,
	useSetStatus,
} from "../hooks/use-applications";
import { SendToChat } from "./send-to-chat";
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
import { badgeVariants } from "./ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
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
	const { mutate: deleteApplication } = useDeleteApplication();
	const [toDelete, setToDelete] = useState<Application | null>(null);
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
		<>
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
										className={badgeVariants({
											variant: "secondary",
											className: "capitalize",
										})}
									>
										{a.status}
										<ChevronDown />
									</DropdownMenuTrigger>
									<DropdownMenuContent align="start">
										{STATUSES.map((s) => (
											<DropdownMenuItem
												key={s}
												className={cn(
													"capitalize",
													s === a.status && "bg-accent text-accent-foreground",
												)}
												onSelect={() => setStatus({ id: a.id, status: s })}
											>
												{s}
											</DropdownMenuItem>
										))}
										<DropdownMenuSeparator />
										<DropdownMenuItem
											variant="destructive"
											onSelect={() => setToDelete(a)}
										>
											Delete
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</TableCell>
							<TableCell className="hidden text-muted-foreground sm:table-cell">
								{fmtDate(a.created_at)}
							</TableCell>
							<TableCell className="text-right">
								<SendToChat url={a.url} />
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
			<AlertDialog
				open={toDelete !== null}
				onOpenChange={(open) => !open && setToDelete(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete this job?</AlertDialogTitle>
						<AlertDialogDescription>
							“{toDelete?.title}” will be removed from your list.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							onClick={() => toDelete && deleteApplication(toDelete.id)}
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
