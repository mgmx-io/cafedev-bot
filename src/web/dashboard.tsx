import { auth } from "./auth";

export function Dashboard({ name }: { name: string }) {
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
