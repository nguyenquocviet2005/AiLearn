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

const sidebarNavigation: Array<{
  href: TeacherRoute;
  icon: string;
  label: string;
  ariaLabel?: string;
}> = [
  {
    href: "/teacher",
    icon: "⌂",
    label: "Tổng quan",
    ariaLabel: "Tổng quan lớp",
  },
  { href: "/teacher/analytics", icon: "◔", label: "Phân tích lớp" },
];

export function TeacherShell({
  children,
  connectionStatus = "connected",
  currentRoute,
  onNavigate,
  toolbarAction,
}: {
  children: ReactNode;
  connectionStatus?: "loading" | "connected" | "degraded" | "error";
  currentRoute: TeacherRoute;
  onNavigate: (path: TeacherRoute) => void;
  toolbarAction?: ReactNode;
}) {
  const connectionCopy = {
    loading: "Đang kết nối dữ liệu",
    connected: "Dữ liệu đã kết nối",
    degraded: "Kết nối một phần",
    error: "Kết nối đang gián đoạn",
  }[connectionStatus];
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
            <small>Lớp 7A · Mốc kiểm tra 2</small>
          </div>
        </div>

        <nav className="teacher-navigation" aria-label="Điều hướng giáo viên">
          {sidebarNavigation.map((item) => (
            <a
              aria-current={currentRoute === item.href ? "page" : undefined}
              aria-label={item.ariaLabel}
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

        <div
          className={`teacher-sync-card is-${connectionStatus}`}
          aria-label="Trạng thái đồng bộ"
        >
          <span className="teacher-sync-dot" aria-hidden="true" />
          <div>
            <strong>{connectionCopy}</strong>
            <small>
              {connectionStatus === "connected"
                ? "Đồng bộ gần nhất: 2 phút trước"
                : "Dữ liệu đã lưu trên trình duyệt vẫn an toàn"}
            </small>
          </div>
        </div>
      </aside>

      <main
        className="teacher-shell teacher-main"
        id="teacher-main"
        tabIndex={-1}
      >
        <div className="teacher-product-topbar">
          <div className="teacher-topbar-status">
            <span className="demo-badge">Dữ liệu minh hoạ</span>
            <span className={`connection-badge is-${connectionStatus}`}>
              <i />
              {connectionCopy}
            </span>
          </div>
          {toolbarAction}
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
