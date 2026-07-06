import { createRoot } from "react-dom/client";
import { auth } from "./auth";
import { Dashboard } from "./dashboard";
import { Landing } from "./landing";

function App() {
	const { data: session, isPending } = auth.useSession();
	if (isPending) return null;
	return session ? <Dashboard name={session.user.name} /> : <Landing />;
}

const root = document.getElementById("root");
if (root) createRoot(root).render(<App />);
