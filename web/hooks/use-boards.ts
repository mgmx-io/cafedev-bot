import type { Board } from "@shared/jobs";
import { useQuery } from "@tanstack/react-query";
import { get } from "../api";

export function useBoards() {
	return useQuery({
		queryKey: ["boards"],
		queryFn: () => get<Board[]>("/api/boards"),
	});
}
