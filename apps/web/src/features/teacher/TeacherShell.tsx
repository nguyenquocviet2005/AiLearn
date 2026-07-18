import type { ReactNode } from "react";

import "./teacher.css";

export type TeacherRoute =
  "/teacher" | "/teacher/lesson-plan" | "/teacher/report";

const navigation: Array<{ href: TeacherRoute; label: string }> = [
  { href: "/teacher", label: "Class overview" },
  { href: "/teacher/lesson-plan", label: "Lesson plan" },
  { href: "/teacher/report", label: "Intervention report" },
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
        Skip to teacher content
      </a>
      <header className="teacher-header">
        <a className="teacher-brand" href="/" aria-label="AiLearn home">
          <img src="/brand/ailearn-logo.webp" alt="AiLearn" />
        </a>
        <div className="teacher-product-label">
          <span>Teacher workspace</span>
          <small>Checkpoint 2 demo</small>
        </div>
        <nav aria-label="Teacher workspace navigation">
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
              {item.label}
            </a>
          ))}
        </nav>
      </header>
      <main className="teacher-shell" id="teacher-main" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
