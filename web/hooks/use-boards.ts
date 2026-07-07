import type { BoardCheck } from "@shared/jobs";
import { useQuery } from "@tanstack/react-query";
import { get } from "../api";

export function useBoardOpenings() {
	return useQuery({
		queryKey: ["board-openings"],
		queryFn: () => get<BoardCheck>("/api/boards/openings"),
		// scrapea los ATS en vivo: cambiar de tab no debe repetirlo cada vez
		staleTime: 5 * 60 * 1000,
	});
}
