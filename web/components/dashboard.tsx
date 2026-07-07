import { CircleUserRound, Sparkles } from "lucide-react";
import { auth } from "../auth";
import { BOT_URL } from "../constants";
import { ApplicationList } from "./application-list";
import { BoardList } from "./board-list";
import { Button } from "./ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export function Dashboard({ name }: { name: string }) {
	return (
		<>
			<header className="border-b">
				<div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
					<span className="font-semibold">☕ CafeDev</span>
					<nav className="flex items-center gap-2">
						<Button asChild size="sm">
							<a href={BOT_URL} target="_blank" rel="noreferrer">
								<Sparkles />
								Agent
							</a>
						</Button>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button size="icon-sm" variant="ghost" aria-label="Account">
									<CircleUserRound />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuLabel>{name}</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={() => auth.signOut()}>
									Sign out
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</nav>
				</div>
			</header>
			<main className="mx-auto max-w-3xl px-4 py-8">
				<Tabs defaultValue="applications">
					<TabsList className="mb-4">
						<TabsTrigger value="applications">Applications</TabsTrigger>
						<TabsTrigger value="boards">Boards</TabsTrigger>
					</TabsList>
					<TabsContent value="applications">
						<ApplicationList />
					</TabsContent>
					<TabsContent value="boards">
						<BoardList />
					</TabsContent>
				</Tabs>
			</main>
		</>
	);
}
