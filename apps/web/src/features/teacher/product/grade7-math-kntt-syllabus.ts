export type Grade7Lesson = {
  id: string;
  number: number;
  title: string;
};

export type Grade7Chapter = {
  id: string;
  number: number;
  semester: 1 | 2;
  title: string;
  lessons: Grade7Lesson[];
};

/**
 * Lesson/chapter index only. This is not a reproduction of textbook prose,
 * exercises, illustrations, or publisher learning material.
 *
 * Source: NXB Giáo dục Việt Nam's teacher training guide for Toán 7,
 * Kết nối tri thức với cuộc sống. The UI exposes the source so teachers know
 * this is a curriculum map, not an assessment result for every lesson.
 */
export const GRADE7_MATH_KNTT_SOURCE =
  "https://medialib.qlgd.edu.vn/Uploads/THU_VIEN/shn/2/37/UserFiles/1.-Toan-7-d876f79e-f1eb-4de6-822f-80caa5e52a52.pdf";

export const GRADE7_MATH_KNTT_CHAPTERS: Grade7Chapter[] = [
  {
    id: "rational-numbers",
    number: 1,
    semester: 1,
    title: "Số hữu tỉ",
    lessons: [
      { id: "lesson-01", number: 1, title: "Tập hợp các số hữu tỉ" },
      {
        id: "lesson-02",
        number: 2,
        title: "Cộng, trừ, nhân, chia số hữu tỉ",
      },
      {
        id: "lesson-03",
        number: 3,
        title: "Lũy thừa với số mũ tự nhiên của số hữu tỉ",
      },
      {
        id: "lesson-04",
        number: 4,
        title: "Thứ tự thực hiện phép tính. Quy tắc chuyển vế",
      },
    ],
  },
  {
    id: "real-numbers",
    number: 2,
    semester: 1,
    title: "Số thực",
    lessons: [
      {
        id: "lesson-05",
        number: 5,
        title: "Làm quen với số thập phân vô hạn tuần hoàn",
      },
      {
        id: "lesson-06",
        number: 6,
        title: "Số vô tỉ. Căn bậc hai số học",
      },
      { id: "lesson-07", number: 7, title: "Tập hợp các số thực" },
    ],
  },
  {
    id: "angles-parallel-lines",
    number: 3,
    semester: 1,
    title: "Góc và đường thẳng song song",
    lessons: [
      {
        id: "lesson-08",
        number: 8,
        title: "Góc ở vị trí đặc biệt. Tia phân giác của một góc",
      },
      {
        id: "lesson-09",
        number: 9,
        title: "Hai đường thẳng song song và dấu hiệu nhận biết",
      },
      {
        id: "lesson-10",
        number: 10,
        title: "Tiên đề Euclid. Tính chất của hai đường thẳng song song",
      },
      {
        id: "lesson-11",
        number: 11,
        title: "Định lí và chứng minh định lí",
      },
    ],
  },
  {
    id: "congruent-triangles",
    number: 4,
    semester: 1,
    title: "Tam giác bằng nhau",
    lessons: [
      {
        id: "lesson-12",
        number: 12,
        title: "Tổng các góc trong một tam giác",
      },
      {
        id: "lesson-13",
        number: 13,
        title: "Hai tam giác bằng nhau. Trường hợp bằng nhau thứ nhất",
      },
      {
        id: "lesson-14",
        number: 14,
        title: "Trường hợp bằng nhau thứ hai và thứ ba của tam giác",
      },
      {
        id: "lesson-15",
        number: 15,
        title: "Các trường hợp bằng nhau của tam giác vuông",
      },
      {
        id: "lesson-16",
        number: 16,
        title: "Tam giác cân. Đường trung trực của đoạn thẳng",
      },
    ],
  },
  {
    id: "data",
    number: 5,
    semester: 1,
    title: "Thu thập và biểu diễn dữ liệu",
    lessons: [
      {
        id: "lesson-17",
        number: 17,
        title: "Thu thập và phân loại dữ liệu",
      },
      { id: "lesson-18", number: 18, title: "Biểu đồ hình quạt tròn" },
      { id: "lesson-19", number: 19, title: "Biểu đồ đoạn thẳng" },
    ],
  },
  {
    id: "proportions",
    number: 6,
    semester: 2,
    title: "Tỉ lệ thức và đại lượng tỉ lệ",
    lessons: [
      { id: "lesson-20", number: 20, title: "Tỉ lệ thức" },
      {
        id: "lesson-21",
        number: 21,
        title: "Tính chất của dãy tỉ số bằng nhau",
      },
      {
        id: "lesson-22",
        number: 22,
        title: "Đại lượng tỉ lệ thuận",
      },
      {
        id: "lesson-23",
        number: 23,
        title: "Đại lượng tỉ lệ nghịch",
      },
    ],
  },
  {
    id: "algebraic-expressions",
    number: 7,
    semester: 2,
    title: "Biểu thức đại số và đa thức một biến",
    lessons: [
      { id: "lesson-24", number: 24, title: "Biểu thức đại số" },
      { id: "lesson-25", number: 25, title: "Đa thức một biến" },
      {
        id: "lesson-26",
        number: 26,
        title: "Cộng, trừ đa thức một biến",
      },
      {
        id: "lesson-27",
        number: 27,
        title: "Phép nhân đa thức một biến",
      },
      {
        id: "lesson-28",
        number: 28,
        title: "Phép chia đa thức một biến",
      },
    ],
  },
  {
    id: "probability",
    number: 8,
    semester: 2,
    title: "Làm quen với biến cố và xác suất của biến cố",
    lessons: [
      { id: "lesson-29", number: 29, title: "Làm quen với biến cố" },
      {
        id: "lesson-30",
        number: 30,
        title: "Làm quen với xác suất của biến cố",
      },
    ],
  },
  {
    id: "triangle-relations",
    number: 9,
    semester: 2,
    title: "Quan hệ giữa các yếu tố trong một tam giác",
    lessons: [
      {
        id: "lesson-31",
        number: 31,
        title: "Quan hệ giữa góc và cạnh đối diện trong một tam giác",
      },
      {
        id: "lesson-32",
        number: 32,
        title: "Quan hệ giữa đường vuông góc và đường xiên",
      },
      {
        id: "lesson-33",
        number: 33,
        title: "Quan hệ giữa ba cạnh của một tam giác",
      },
      {
        id: "lesson-34",
        number: 34,
        title: "Sự đồng quy của ba đường trung tuyến, ba đường phân giác",
      },
      {
        id: "lesson-35",
        number: 35,
        title: "Sự đồng quy của ba đường trung trực, ba đường cao",
      },
    ],
  },
  {
    id: "solids",
    number: 10,
    semester: 2,
    title: "Một số hình khối trong thực tiễn",
    lessons: [
      {
        id: "lesson-36",
        number: 36,
        title: "Hình hộp chữ nhật và hình lập phương",
      },
      {
        id: "lesson-37",
        number: 37,
        title: "Hình lăng trụ đứng tam giác và hình lăng trụ đứng tứ giác",
      },
    ],
  },
];

export const CURRENT_GRADE7_MATH_KNTT_LESSON_ID = "lesson-23";

export function getCurrentGrade7MathKnttLesson() {
  for (const chapter of GRADE7_MATH_KNTT_CHAPTERS) {
    const lesson = chapter.lessons.find(
      (item) => item.id === CURRENT_GRADE7_MATH_KNTT_LESSON_ID,
    );
    if (lesson) return { chapter, lesson };
  }
  throw new Error("Không tìm thấy bài học hiện tại trong tiến trình Toán 7.");
}

export const GRADE7_MATH_KNTT_LESSON_TOTAL = GRADE7_MATH_KNTT_CHAPTERS.reduce(
  (total, chapter) => total + chapter.lessons.length,
  0,
);
