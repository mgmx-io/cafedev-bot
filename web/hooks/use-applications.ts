import type { Application } from "@shared/jobs";
import { useQuery } from "@tanstack/react-query";
import { get } from "../api";

export function useApplications() {
	return useQuery({
		queryKey: ["applications"],
		queryFn: () => get<Application[]>("/api/applications"),
	});
}
