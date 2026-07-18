import type { ReactNode } from "react";

type AppHeaderProps = {
  context: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function AppHeader({ context, actions, className }: AppHeaderProps) {
  const classes = ["app-island", className].filter(Boolean).join(" ");

  return (
    <header className="app-island-shell">
      <div className={classes}>
        <a
          className="app-island-brand"
          href="/"
          aria-label="AiLearn - trang chủ"
        >
          <img src="/brand/ailearn-mascot.webp" alt="" />
          <span>AiLearn</span>
        </a>
        <div className="app-island-context">{context}</div>
        {actions && <div className="app-island-actions">{actions}</div>}
      </div>
    </header>
  );
}
