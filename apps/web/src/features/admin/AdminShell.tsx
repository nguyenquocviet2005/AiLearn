import type { ReactNode } from "react";

import "./admin.css";

export function AdminShell({
  children,
  email,
  onLogout,
}: {
  children: ReactNode;
  email: string;
  onLogout: () => void;
}) {
  return (
    <div className="admin-app">
      <a className="admin-skip-link" href="#admin-main">
        Đi tới nội dung chính
      </a>

      <aside className="admin-sidebar" aria-label="Không gian quản trị">
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

        <div className="admin-role dashboard-rail-identity">
          <span className="admin-role-avatar" aria-hidden="true">
            QT
          </span>
          <div>
            <strong>Quản trị viên</strong>
            <small>{email}</small>
          </div>
        </div>

        <nav className="admin-navigation" aria-label="Điều hướng quản trị">
          <a aria-current="page" href="/admin">
            <span className="dashboard-nav-icon" aria-hidden="true">
              ▦
            </span>
            <span>Tổng quan</span>
          </a>
        </nav>

        <button className="admin-logout" onClick={onLogout} type="button">
          <span aria-hidden="true">↩</span>
          Đăng xuất
        </button>
      </aside>

      <main className="admin-shell admin-main" id="admin-main" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
