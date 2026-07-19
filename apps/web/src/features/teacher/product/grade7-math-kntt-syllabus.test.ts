import { describe, expect, it } from "vitest";

import {
  GRADE7_MATH_KNTT_CHAPTERS,
  GRADE7_MATH_KNTT_LESSON_TOTAL,
  getCurrentGrade7MathKnttLesson,
} from "./grade7-math-kntt-syllabus";

describe("grade 7 Kết nối tri thức curriculum map", () => {
  it("maps the current inverse-proportion lesson to chapter VI", () => {
    const current = getCurrentGrade7MathKnttLesson();

    expect(current.chapter).toMatchObject({
      number: 6,
      title: "Tỉ lệ thức và đại lượng tỉ lệ",
    });
    expect(current.lesson).toMatchObject({
      number: 23,
      title: "Đại lượng tỉ lệ nghịch",
    });
  });

  it("keeps a complete, ordered and unique lesson index", () => {
    const lessons = GRADE7_MATH_KNTT_CHAPTERS.flatMap(
      (chapter) => chapter.lessons,
    );

    expect(lessons).toHaveLength(37);
    expect(GRADE7_MATH_KNTT_LESSON_TOTAL).toBe(37);
    expect(new Set(lessons.map((lesson) => lesson.id)).size).toBe(37);
    expect(lessons.map((lesson) => lesson.number)).toEqual(
      Array.from({ length: 37 }, (_, index) => index + 1),
    );
  });
});
