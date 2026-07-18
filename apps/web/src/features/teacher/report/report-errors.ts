import { TeacherRepositoryError } from "@/lib/adapters/teacher-repository";

export function teacherReportErrorMessage(error: unknown): string {
  if (error instanceof TeacherRepositoryError) {
    if (error.kind === "configuration") {
      return "The intervention report API is not configured for this deployment.";
    }
    if (error.kind === "unavailable") {
      return "The intervention report API is unavailable. Try again later.";
    }
  }
  return "The intervention report data could not be loaded.";
}
