import type { ReactNode } from "react";

import "./teacher.css";

export type TeacherRoute =
  "/teacher" | "/teacher/lesson-plan" | "/teacher/report";

const navigation: Array<{
  href: TeacherRoute;
  icon: string;
  label: string;
}> = [
  { href: "/teacher", icon: "▦", label: "Tổng quan lớp" },
  { href: "/teacher/lesson-plan", icon: "≡", label: "Kế hoạch bài dạy" },
  { href: "/teacher/report", icon: "◫", label: "Báo cáo can thiệp" },
];

export function TeacherShell({
  children,
  currentRoute,
  onNavigate,
}: {
  children: ReactNode;
  currentRoute: TeacherRoute;
  onNavigate: (path: TeacherRoute) => void;
}) {
  return (
    <div className="teacher-app">
      <a className="teacher-skip-link" href="#teacher-main">
        Đi tới nội dung chính
      </a>

      <aside className="teacher-sidebar" aria-label="Không gian giáo viên">
        <a
          className="dashboard-rail-brand"
          href="/"
          aria-label="AiLearn - trang chủ"
        >
          <span className="rail-firefly" aria-hidden="true">
            <img src="/brand/ailearn-mascot.webp" alt="" />
          </span>
          <span>AiLearn</span>
        </a>

        <div className="teacher-role dashboard-rail-identity">
          <span className="teacher-role-avatar" aria-hidden="true">
            GV
          </span>
          <div>
            <strong>Không gian giáo viên</strong>
            <small>Lớp 7A · Checkpoint 2</small>
          </div>
        </div>

        <nav className="teacher-navigation" aria-label="Điều hướng giáo viên">
          {navigation.map((item) => (
            <a
              aria-current={currentRoute === item.href ? "page" : undefined}
              href={item.href}
              key={item.href}
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
          <span className="companion-presence">
            <img src="/brand/ailearn-mascot.webp" alt="" />
          </span>
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

      <main
        className="teacher-shell teacher-main"
        id="teacher-main"
        tabIndex={-1}
      >
        {children}
      </main>
    </div>
  );
}
