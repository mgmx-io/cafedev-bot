import type { BoardCheck } from "@shared/jobs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { del, get } from "../api";

export function useBoardOpenings() {
	return useQuery({
		queryKey: ["board-openings"],
		queryFn: () => get<BoardCheck>("/api/boards/openings"),
		// scrapea los ATS en vivo: cambiar de tab no debe repetirlo cada vez
		staleTime: 5 * 60 * 1000,
	});
}

export function useUnfollowBoard() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => del(`/api/boards/${id}/follow`),
		// optimista y sin refetch en éxito: no vale re-scrapear los ATS por un unfollow
		onMutate: async (id) => {
			await queryClient.cancelQueries({ queryKey: ["board-openings"] });
			queryClient.setQueryData<BoardCheck>(
				["board-openings"],
				(prev) =>
					prev && { ...prev, boards: prev.boards.filter((b) => b.id !== id) },
			);
		},
		onError: () =>
			queryClient.invalidateQueries({ queryKey: ["board-openings"] }),
	});
}
