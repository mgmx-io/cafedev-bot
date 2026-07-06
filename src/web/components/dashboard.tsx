import { auth } from "../auth";
import { BOT_URL } from "../constants";
import { ApplicationList } from "./application-list";
import { BoardList } from "./board-list";

export function Dashboard({ name }: { name: string }) {
	return (
		<>
			<header>
				<span>☕ CafeDev</span>
				<nav>
					<a href={BOT_URL}>Abrir chat</a>
					<span>{name}</span>
					<button type="button" onClick={() => auth.signOut()}>
						Salir
					</button>
				</nav>
			</header>
			<main>
				<section>
					<h2>Postulaciones</h2>
					<ApplicationList />
				</section>
				<section>
					<h2>Empresas que seguís</h2>
					<BoardList />
				</section>
			</main>
		</>
	);
}
