import type { InterventionReportV1 } from "@ailearn/schemas";

export interface TeacherReportRepository {
  getReport(): Promise<InterventionReportV1>;
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export const httpTeacherReportRepository: TeacherReportRepository = {
  async getReport() {
    const response = await fetch(`${apiBaseUrl}/api/v1/reports/report_demo_01`);
    if (!response.ok) {
      throw new Error("Teacher report service is unavailable.");
    }
    return (await response.json()) as InterventionReportV1;
  },
};
