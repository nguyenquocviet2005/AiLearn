import { TeacherRepositoryError } from "@/lib/adapters/teacher-repository";

export function teacherReportErrorMessage(error: unknown): string {
  if (error instanceof TeacherRepositoryError) {
    if (error.kind === "configuration") {
      return "API báo cáo can thiệp chưa được cấu hình cho bản triển khai này.";
    }
    if (error.kind === "unavailable") {
      return "API báo cáo can thiệp đang không khả dụng. Vui lòng thử lại sau.";
    }
  }
  return "Không thể tải dữ liệu báo cáo can thiệp.";
}
