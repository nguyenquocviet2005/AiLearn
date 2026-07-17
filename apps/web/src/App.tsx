import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TeacherWorkspace } from "@/features/teacher/TeacherWorkspace";
import { getSystemStatus, type SystemStatus } from "@/lib/api";

type StatusState =
  | { kind: "loading" }
  | { kind: "ready"; data: SystemStatus }
  | { kind: "error" };

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function PlatformStatus({
  onOpenTeacherWorkspace,
}: {
  onOpenTeacherWorkspace: () => void;
}) {
  const [status, setStatus] = useState<StatusState>({ kind: "loading" });

  async function refreshStatus() {
    setStatus({ kind: "loading" });
    try {
      setStatus({ kind: "ready", data: await getSystemStatus() });
    } catch {
      setStatus({ kind: "error" });
    }
  }

  useEffect(() => {
    void refreshStatus();
  }, []);

  return (
    <main className="shell">
      <section className="intro" aria-labelledby="page-title">
        <p className="eyebrow">AiLearn / platform foundation</p>
        <h1 id="page-title">A clear starting point for the work ahead.</h1>
        <p className="lede">
          This is an intentionally small connection between the interface, API,
          and platform infrastructure. Product workflows remain to be designed
          with the team.
        </p>
      </section>

      <Card className="status-card" aria-live="polite">
        <div>
          <p className="eyebrow">System connection</p>
          <h2>Platform status</h2>
        </div>

        {status.kind === "loading" && (
          <p className="status-copy">Checking the API connection…</p>
        )}

        {status.kind === "ready" && (
          <div className="status-ready">
            <span
              className={`signal signal-${status.data.database.status}`}
              aria-hidden="true"
            />
            <div>
              <p className="status-copy">
                Supabase is <strong>{status.data.database.status}</strong>.
              </p>
              <p className="timestamp">
                Checked {formatTimestamp(status.data.database.checked_at)}
              </p>
            </div>
          </div>
        )}

        {status.kind === "error" && (
          <div className="status-error">
            <p className="status-copy">
              The platform status is currently unavailable.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => void refreshStatus()}
            >
              Try again
            </Button>
          </div>
        )}

        <a
          className="teacher-entry"
          href="/teacher"
          onClick={(event) => {
            event.preventDefault();
            onOpenTeacherWorkspace();
          }}
        >
          Open teacher workspace
        </a>
      </Card>
    </main>
  );
}

function currentPathname() {
  return window.location.pathname;
}

export default function App() {
  const [pathname, setPathname] = useState(currentPathname);

  useEffect(() => {
    function handlePopState() {
      setPathname(currentPathname());
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function navigate(path: "/teacher" | "/teacher/lesson-plan") {
    window.history.pushState({}, "", path);
    setPathname(path);
  }

  if (pathname === "/teacher" || pathname === "/teacher/lesson-plan") {
    return (
      <TeacherWorkspace
        view={pathname === "/teacher" ? "overview" : "lesson-plan"}
        onNavigate={navigate}
      />
    );
  }

  return <PlatformStatus onOpenTeacherWorkspace={() => navigate("/teacher")} />;
}
