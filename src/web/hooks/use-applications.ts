import { useQuery } from "@tanstack/react-query";
import type { Application } from "@/jobs/applications";
import { get } from "../api";

export function useApplications() {
	return useQuery({
		queryKey: ["applications"],
		queryFn: () => get<Application[]>("/api/applications"),
	});
}
