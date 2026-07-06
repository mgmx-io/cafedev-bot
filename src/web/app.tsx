import { createAuthClient } from "better-auth/react";
import { createRoot } from "react-dom/client";

const auth = createAuthClient();

function login() {
	auth.signIn.social({ provider: "google", callbackURL: "/" });
}

function Landing() {
	return (
		<>
			<header>
				<span>☕ CafeDev</span>
				<nav>
					<button type="button" onClick={login}>
						Ingresar
					</button>
				</nav>
			</header>
			<main>
				<section>
					<h1>Tu agente de carrera, por Telegram</h1>
					<p>
						Le mandás un link de un trabajo y te dice si vale la pena aplicar.
						Arma tu CV a medida de cada aviso y lleva el registro de todas tus
						postulaciones.
					</p>
					<button type="button" onClick={login}>
						Ver mi dashboard
					</button>
				</section>
				<section>
					<h2>Cómo funciona</h2>
					<ol>
						<li>
							Charlás con el agente por Telegram, como con cualquier persona.
						</li>
						<li>
							Le pasás avisos que te interesan: los analiza contra tu perfil.
						</li>
						<li>Seguí empresas y mirá tus postulaciones desde el dashboard.</li>
					</ol>
				</section>
			</main>
			<footer>
				<small>CafeDev</small>
			</footer>
		</>
	);
}

function Dashboard({ name }: { name: string }) {
	return (
		<>
			<header>
				<span>☕ CafeDev</span>
				<nav>
					<span>{name}</span>
					<button type="button" onClick={() => auth.signOut()}>
						Salir
					</button>
				</nav>
			</header>
			<main>
				<p>Acá van tus postulaciones y boards.</p>
			</main>
		</>
	);
}

function App() {
	const { data: session, isPending } = auth.useSession();
	if (isPending) return null;
	return session ? <Dashboard name={session.user.name} /> : <Landing />;
}

const root = document.getElementById("root");
if (root) createRoot(root).render(<App />);
