import { useQuery } from "@tanstack/react-query";
import type { Board } from "@/jobs/companies";
import { get } from "../api";

export function useBoards() {
	return useQuery({
		queryKey: ["boards"],
		queryFn: () => get<Board[]>("/api/boards"),
	});
}
