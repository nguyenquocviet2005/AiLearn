import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AdminAuthRepositoryError,
  httpAdminAuthRepository,
  type AdminAuthRepository,
} from "@/lib/adapters/admin-auth-repository";
import "./admin.css";
import { writeAdminSession } from "./admin-session-storage";

export type AdminRoute = "/admin/login" | "/admin";

function loginErrorMessage(error: unknown): string {
  if (error instanceof AdminAuthRepositoryError) {
    if (error.kind === "configuration") {
      return "API quản trị chưa được cấu hình cho bản triển khai này.";
    }
    if (error.kind === "unavailable") {
      return "Không thể kết nối tới API quản trị. Hãy kiểm tra kết nối và thử lại.";
    }
  }
  // Deliberately generic: never reveal whether the email or the password was wrong.
  return "Email hoặc mật khẩu không đúng.";
}

export function AdminLoginPage({
  onNavigate,
  repository = httpAdminAuthRepository,
}: {
  onNavigate: (path: AdminRoute) => void;
  repository?: AdminAuthRepository;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const session = await repository.login(email, password);
      writeAdminSession({
        token: session.token,
        expiresAt: session.expires_at,
      });
      onNavigate("/admin");
    } catch (caught) {
      setError(loginErrorMessage(caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="admin-login-shell">
      <Card className="admin-login-card">
        <p className="admin-kicker">AiLearn / quản trị</p>
        <h1>Đăng nhập quản trị viên</h1>
        <form onSubmit={(event) => void handleSubmit(event)}>
          <label htmlFor="admin-login-email">
            Email
            <input
              autoComplete="username"
              id="admin-login-email"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
          <label htmlFor="admin-login-password">
            Mật khẩu
            <input
              autoComplete="current-password"
              id="admin-login-password"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          {error && (
            <p className="admin-inline-error" role="alert">
              {error}
            </p>
          )}
          <Button disabled={pending} type="submit">
            {pending ? "Đang đăng nhập…" : "Đăng nhập"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
