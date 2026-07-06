import { useApplications } from "../hooks/use-applications";

const STATUS: Record<string, string> = {
	considering: "Evaluando",
	applied: "Aplicado",
	interviewing: "Entrevistas",
	offer: "Oferta",
	rejected: "Rechazado",
	withdrawn: "Retirado",
};
const FIT: Record<string, string> = {
	apply: "Aplicar",
	stretch: "Ambicioso",
	skip: "Pasar",
};

export function ApplicationList() {
	const { data, isPending, isError } = useApplications();
	if (isPending) return <p>Cargando…</p>;
	if (isError) return <p>No se pudo cargar. Recargá la página.</p>;
	if (data.length === 0)
		return (
			<p>
				Todavía no hay nada acá. Mandale el link de un trabajo al agente por
				Telegram y aparece solo.
			</p>
		);
	return (
		<table>
			<thead>
				<tr>
					<th>Puesto</th>
					<th>Estado</th>
					<th>Veredicto</th>
					<th>Fecha</th>
				</tr>
			</thead>
			<tbody>
				{data.map((a) => (
					<tr key={a.id}>
						<td>
							<a href={a.url}>{a.title}</a>
						</td>
						<td>{STATUS[a.status] ?? a.status}</td>
						<td>{a.fit ? (FIT[a.fit] ?? a.fit) : "—"}</td>
						<td>{a.created_at.slice(0, 10)}</td>
					</tr>
				))}
			</tbody>
		</table>
	);
}
