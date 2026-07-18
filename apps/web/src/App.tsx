import { useEffect, useState } from "react";

import { LandingPage } from "@/features/landing/LandingPage";
import { StudentWorkspace } from "@/features/student/StudentWorkspace";
import { TeacherWorkspace } from "@/features/teacher/TeacherWorkspace";

function currentPathname() {
  return window.location.pathname;
}

type Route = "/teacher" | "/teacher/lesson-plan" | "/student";

export default function App() {
  const [pathname, setPathname] = useState(currentPathname);

  useEffect(() => {
    function handlePopState() {
      setPathname(currentPathname());
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function navigate(path: Route) {
    window.history.pushState({}, "", path);
    setPathname(path);
    window.scrollTo({ top: 0 });
  }

  if (pathname === "/teacher" || pathname === "/teacher/lesson-plan") {
    return (
      <TeacherWorkspace
        view={pathname === "/teacher" ? "overview" : "lesson-plan"}
        onNavigate={navigate}
      />
    );
  }

  if (pathname === "/student") {
    return <StudentWorkspace />;
  }

  return <LandingPage onNavigate={navigate} />;
}
