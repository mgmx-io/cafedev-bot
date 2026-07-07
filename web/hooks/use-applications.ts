import type { Application, Status } from "@shared/jobs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, patch } from "../api";

export function useApplications() {
	return useQuery({
		queryKey: ["applications"],
		queryFn: () => get<Application[]>("/api/applications"),
	});
}

export function useSetStatus() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, status }: { id: number; status: Status }) =>
			patch(`/api/applications/${id}/status`, { status }),
		// optimista; si el PATCH falla, el refetch restaura la verdad del server
		onMutate: async ({ id, status }) => {
			await queryClient.cancelQueries({ queryKey: ["applications"] });
			queryClient.setQueryData<Application[]>(["applications"], (prev) =>
				prev?.map((a) => (a.id === id ? { ...a, status } : a)),
			);
		},
		onError: () =>
			queryClient.invalidateQueries({ queryKey: ["applications"] }),
	});
}
