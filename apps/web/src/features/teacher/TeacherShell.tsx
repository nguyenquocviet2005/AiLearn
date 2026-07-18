import { useEffect, useState, type ReactNode } from "react";

import "./teacher.css";

export type TeacherRoute =
  | "/teacher"
  | "/teacher/classes"
  | "/teacher/prepare"
  | "/teacher/insights"
  | "/teacher/students"
  | "/teacher/lesson-plan"
  | "/teacher/teaching"
  | "/teacher/after-class"
  | "/teacher/interventions"
  | "/teacher/resources"
  | "/teacher/report";

const navigation: Array<{
  href: TeacherRoute;
  icon: string;
  label: string;
  ariaLabel?: string;
}> = [
  {
    href: "/teacher",
    icon: "⌂",
    label: "Hôm nay",
    ariaLabel: "Tổng quan lớp",
  },
  { href: "/teacher/classes", icon: "▦", label: "Lớp học" },
  { href: "/teacher/prepare", icon: "◇", label: "Chuẩn bị bài" },
  { href: "/teacher/insights", icon: "◎", label: "Phân tích lớp" },
  { href: "/teacher/students", icon: "◉", label: "Học sinh" },
  { href: "/teacher/lesson-plan", icon: "≡", label: "Kế hoạch bài dạy" },
  { href: "/teacher/teaching", icon: "▶", label: "Chế độ giảng dạy" },
  { href: "/teacher/after-class", icon: "✓", label: "Sau giờ học" },
  { href: "/teacher/interventions", icon: "+", label: "Can thiệp" },
  { href: "/teacher/resources", icon: "□", label: "Học liệu" },
  {
    href: "/teacher/report",
    icon: "◫",
    label: "Báo cáo",
    ariaLabel: "Báo cáo can thiệp",
  },
];

const mobilePrimaryRoutes = new Set<TeacherRoute>([
  "/teacher",
  "/teacher/insights",
  "/teacher/lesson-plan",
  "/teacher/teaching",
]);

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
  const [compactNavigation, setCompactNavigation] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= 900,
  );
  useEffect(() => {
    const updateNavigation = () =>
      setCompactNavigation(window.innerWidth <= 900);
    window.addEventListener("resize", updateNavigation);
    return () => window.removeEventListener("resize", updateNavigation);
  }, []);
  const connectionCopy = {
    loading: "Đang kết nối API",
    connected: "API đã kết nối",
    degraded: "Kết nối một phần",
    error: "API đang gián đoạn",
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

        {!compactNavigation && (
          <nav className="teacher-navigation" aria-label="Điều hướng giáo viên">
            {navigation.map((item) => (
              <a
                aria-label={item.ariaLabel}
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
        )}

        {compactNavigation && (
          <nav
            className="teacher-mobile-navigation"
            aria-label="Điều hướng giáo viên trên thiết bị nhỏ"
          >
            {navigation
              .filter((item) => mobilePrimaryRoutes.has(item.href))
              .map((item) => (
                <a
                  aria-current={currentRoute === item.href ? "page" : undefined}
                  href={item.href}
                  key={item.href}
                  onClick={(event) => {
                    event.preventDefault();
                    onNavigate(item.href);
                  }}
                >
                  <span aria-hidden="true">{item.icon}</span>
                  <span>{item.label}</span>
                </a>
              ))}
            <details>
              <summary>
                <span aria-hidden="true">•••</span>
                <span>Thêm</span>
              </summary>
              <div>
                {navigation
                  .filter((item) => !mobilePrimaryRoutes.has(item.href))
                  .map((item) => (
                    <a
                      aria-current={
                        currentRoute === item.href ? "page" : undefined
                      }
                      href={item.href}
                      key={item.href}
                      onClick={(event) => {
                        event.preventDefault();
                        onNavigate(item.href);
                      }}
                    >
                      <span aria-hidden="true">{item.icon}</span>
                      {item.label}
                    </a>
                  ))}
              </div>
            </details>
          </nav>
        )}

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
          <div>
            <span className="demo-badge">Dữ liệu demo</span>
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
