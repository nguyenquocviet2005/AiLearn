import type { InterventionReportV1 } from "@ailearn/schemas";

import { TeacherRepositoryError } from "@/lib/adapters/teacher-repository";
import { ApiConfigurationError, getApiBaseUrl } from "@/lib/api-base-url";

export interface TeacherReportRepository {
  getReport(): Promise<InterventionReportV1>;
}

export function createHttpTeacherReportRepository(
  resolveBaseUrl: () => string = getApiBaseUrl,
): TeacherReportRepository {
  return {
    async getReport() {
      let apiBaseUrl: string;
      try {
        apiBaseUrl = resolveBaseUrl();
      } catch (error) {
        if (error instanceof ApiConfigurationError) {
          throw new TeacherRepositoryError("configuration", error.message);
        }
        throw error;
      }

      let response: Response;
      try {
        response = await fetch(`${apiBaseUrl}/api/v1/reports/report_demo_01`);
      } catch {
        throw new TeacherRepositoryError(
          "unavailable",
          "Teacher report API request failed.",
        );
      }

      if (!response.ok) {
        throw new TeacherRepositoryError(
          "response",
          "Teacher report data request was rejected.",
        );
      }
      return (await response.json()) as InterventionReportV1;
    },
  };
}

export const httpTeacherReportRepository = createHttpTeacherReportRepository();
