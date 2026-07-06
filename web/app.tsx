import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { auth } from "./auth";
import { Dashboard } from "./components/dashboard";
import { Landing } from "./components/landing";

const queryClient = new QueryClient();

export function App() {
	const { data: session, isPending } = auth.useSession();
	if (isPending) return null;
	return (
		<QueryClientProvider client={queryClient}>
			{session ? <Dashboard name={session.user.name} /> : <Landing />}
		</QueryClientProvider>
	);
}
