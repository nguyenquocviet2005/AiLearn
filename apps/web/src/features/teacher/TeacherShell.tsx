import type { ReactNode } from "react";

export type TeacherRoute =
  | "/teacher"
  | "/teacher/lesson-plan"
  | "/teacher/report"
  | "/teacher/report/print";

type TeacherSection = "overview" | "lesson-plan" | "report";

const teacherNavigation: Array<{
  id: TeacherSection;
  href: Exclude<TeacherRoute, "/teacher/report/print">;
  icon: string;
  label: string;
}> = [
  { id: "overview", href: "/teacher", icon: "▦", label: "Tổng quan lớp" },
  {
    id: "lesson-plan",
    href: "/teacher/lesson-plan",
    icon: "≡",
    label: "Kế hoạch bài dạy",
  },
  {
    id: "report",
    href: "/teacher/report",
    icon: "◫",
    label: "Báo cáo can thiệp",
  },
];

export function TeacherShell({
  current,
  onNavigate,
  children,
}: {
  current: TeacherSection;
  onNavigate: (path: TeacherRoute) => void;
  children: ReactNode;
}) {
  return (
    <div className="teacher-app">
      <a className="dashboard-skip-link" href="#teacher-main">
        Đi tới nội dung chính
      </a>

      <aside className="teacher-sidebar" aria-label="Không gian giáo viên">
        <a
          className="dashboard-brand"
          href="/"
          aria-label="AiLearn - trang chủ"
        >
          <img src="/brand/ailearn-logo.webp" alt="AiLearn" />
        </a>

        <div className="teacher-role">
          <span className="teacher-role-avatar" aria-hidden="true">
            GV
          </span>
          <div>
            <strong>Không gian giáo viên</strong>
            <small>Lớp 7A · Toán học</small>
          </div>
        </div>

        <nav className="teacher-navigation" aria-label="Điều hướng giáo viên">
          {teacherNavigation.map((item) => (
            <a
              key={item.id}
              aria-current={current === item.id ? "page" : undefined}
              href={item.href}
              onClick={(event) => {
                event.preventDefault();
                onNavigate(item.href);
              }}
            >
              <span className="dashboard-nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="teacher-sidebar-note">
          <img src="/brand/ailearn-mascot.webp" alt="" />
          <div>
            <strong>Quyết định thuộc về giáo viên</strong>
            <p>AiLearn chỉ đề xuất từ bằng chứng học tập đã ghi nhận.</p>
          </div>
        </div>

        <a className="teacher-switch-workspace" href="/student">
          <span aria-hidden="true">↗</span>
          Mở trải nghiệm học sinh
        </a>
      </aside>

      <main id="teacher-main" className="teacher-main">
        {children}
      </main>
    </div>
  );
}
