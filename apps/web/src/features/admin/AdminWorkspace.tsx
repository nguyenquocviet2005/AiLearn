import { useEffect, useState } from "react";

import {
  httpAdminAuthRepository,
  type AdminAuthRepository,
} from "@/lib/adapters/admin-auth-repository";
import type { AdminRoute } from "./AdminLoginPage";
import { AdminShell } from "./AdminShell";
import {
  clearAdminSession,
  isExpired,
  readAdminSession,
} from "./admin-session-storage";

type WorkspaceState =
  | { kind: "loading" }
  | { kind: "unauthenticated" }
  | { kind: "ready"; email: string };

export function AdminWorkspace({
  onNavigate,
  repository = httpAdminAuthRepository,
}: {
  onNavigate: (path: AdminRoute) => void;
  repository?: AdminAuthRepository;
}) {
  const [state, setState] = useState<WorkspaceState>({ kind: "loading" });

  useEffect(() => {
    let active = true;
    const stored = readAdminSession();
    if (!stored || isExpired(stored)) {
      clearAdminSession();
      if (active) setState({ kind: "unauthenticated" });
      return;
    }
    void repository.getSession(stored.token).then(
      (profile) => {
        if (active) setState({ kind: "ready", email: profile.email });
      },
      () => {
        clearAdminSession();
        if (active) setState({ kind: "unauthenticated" });
      },
    );
    return () => {
      active = false;
    };
  }, [repository]);

  useEffect(() => {
    if (state.kind === "unauthenticated") onNavigate("/admin/login");
  }, [state.kind, onNavigate]);

  async function handleLogout() {
    const stored = readAdminSession();
    clearAdminSession();
    if (stored) {
      try {
        await repository.logout(stored.token);
      } catch {
        // Best-effort: the frontend has already discarded the session either way.
      }
    }
    onNavigate("/admin/login");
  }

  if (state.kind === "loading") {
    return (
      <p className="admin-loading" aria-live="polite" aria-busy="true">
        Đang xác thực phiên đăng nhập…
      </p>
    );
  }

  if (state.kind === "unauthenticated") {
    return null;
  }

  return (
    <AdminShell email={state.email} onLogout={() => void handleLogout()}>
      <section className="admin-content" aria-labelledby="admin-page-title">
        <p className="admin-kicker">Quản trị hệ thống</p>
        <h1 id="admin-page-title">Chào mừng đến khu vực quản trị.</h1>
        <p className="admin-lede">
          Các module quản lý nội dung, học sinh và bằng chứng sẽ được bổ sung ở
          giai đoạn tiếp theo.
        </p>
      </section>
    </AdminShell>
  );
}
