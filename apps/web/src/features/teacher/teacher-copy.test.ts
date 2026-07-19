import { describe, expect, it } from "vitest";

import { teacherFacingText } from "./teacher-copy";

describe("teacherFacingText", () => {
  it("turns a diagnostic priority rationale into teacher-facing Vietnamese", () => {
    expect(
      teacherFacingText(
        "Xác nhận ưu tiên số 1 trước khi dạy: score=0.5892; prevalence=0.1000 (4/40); downstream_impact=0.9167; lesson_urgency=0.8500; diagnostic_confidence=1.0000",
      ),
    ).toBe(
      "4/40 học sinh · ảnh hưởng 92% chuỗi tiên quyết · mức cấp thiết 85%",
    );
  });
});
