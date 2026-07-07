import { login } from "../auth";
import { Button } from "./ui/button";

export function Landing() {
	return (
		<>
			<header className="border-b">
				<div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
					<span className="font-semibold">☕ CafeDev</span>
					<Button size="sm" onClick={login}>
						Log in
					</Button>
				</div>
			</header>
			<main className="mx-auto max-w-3xl px-4">
				<section className="py-16 text-center sm:py-24">
					<h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
						Your career agent, on Telegram
					</h1>
					<p className="mx-auto mt-4 max-w-xl text-muted-foreground">
						Send it a job link and it tells you whether it's worth applying. It
						tailors your CV to each posting and keeps track of all your
						applications.
					</p>
					<Button className="mt-8" size="lg" onClick={login}>
						See my dashboard
					</Button>
				</section>
				<section className="pb-16">
					<h2 className="mb-4 text-lg font-semibold">How it works</h2>
					<ol className="list-decimal space-y-2 pl-5 text-muted-foreground">
						<li>
							Chat with the agent on Telegram, like you would with anyone.
						</li>
						<li>
							Send it postings you're interested in: it scores them against your
							profile.
						</li>
						<li>
							Follow companies and track your applications from the dashboard.
						</li>
					</ol>
				</section>
			</main>
			<footer className="border-t py-6 text-center text-sm text-muted-foreground">
				<small>CafeDev</small>
			</footer>
		</>
	);
}
