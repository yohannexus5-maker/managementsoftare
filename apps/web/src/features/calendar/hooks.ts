import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";

export interface CalendarEventDto {
  id: string;
  type: "MILESTONE" | "MEETING" | "SITE_VISIT" | "LEAVE" | "RFI_DUE";
  title: string;
  date: string;
  projectId?: string;
  projectName?: string;
}

export function useCalendarEvents(start: Date, end: Date) {
  return useQuery({
    queryKey: ["calendar", start.toISOString(), end.toISOString()],
    queryFn: async () =>
      (
        await api.get<{ events: CalendarEventDto[] }>("/calendar", {
          params: { start: start.toISOString(), end: end.toISOString() },
        })
      ).data.events,
  });
}
