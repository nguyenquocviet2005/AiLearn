import { type ReactNode } from "react";

import "./teacher.css";

export type TeacherRoute =
  | "/teacher"
  | "/teacher/classes"
  | "/teacher/analytics"
  | "/teacher/prepare"
  | "/teacher/insights"
  | "/teacher/students"
  | "/teacher/lesson-plan"
  | "/teacher/teaching"
  | "/teacher/after-class"
  | "/teacher/interventions"
  | "/teacher/resources"
  | "/teacher/report";

export function TeacherShell({
  children,
}: {
  children: ReactNode;
  connectionStatus?: "loading" | "connected" | "degraded" | "error";
  currentRoute: TeacherRoute;
  onNavigate: (path: TeacherRoute) => void;
  toolbarAction?: ReactNode;
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

        <div className="teacher-sidebar-note">
          <span className="companion-presence">
            <img src="/brand/ailearn-mascot.webp" alt="" />
          </span>
          <div>
            <strong>Quyết định thuộc về giáo viên</strong>
            <p>
              AiLearn đề xuất từ minh chứng; giáo viên quyết định bước tiếp
              theo.
            </p>
          </div>
        </div>
      </aside>

      <main
        className="teacher-shell teacher-main"
        id="teacher-main"
        tabIndex={-1}
      >
        <div className="teacher-product-topbar">
          <span className="teacher-profile">
            <b>TH</b>
            <span>
              Cô Nguyễn Thu Hà<small>Trường THCS Nguyễn Du</small>
            </span>
          </span>
        </div>
        {children}
      </main>
    </div>
  );
}
