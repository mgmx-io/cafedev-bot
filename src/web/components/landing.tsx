import { login } from "../auth";

export function Landing() {
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
