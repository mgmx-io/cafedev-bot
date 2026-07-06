import { BOT_URL } from "../constants";
import { useBoards } from "../hooks/use-boards";

export function BoardList() {
	const { data, isPending, isError } = useBoards();
	if (isPending) return <p>Cargando…</p>;
	if (isError) return <p>No se pudo cargar. Recargá la página.</p>;
	if (data.length === 0)
		return (
			<p>
				<a href={BOT_URL}>Pedile al agente</a> que siga el board de una empresa
				y lo ves acá.
			</p>
		);
	return (
		<ul>
			{data.map((b) => (
				<li key={b.id}>
					{b.slug} <small>({b.ats})</small>
				</li>
			))}
		</ul>
	);
}
