import { useEffect, useState } from "react";

import { AdminLoginPage } from "@/features/admin/AdminLoginPage";
import { AdminWorkspace } from "@/features/admin/AdminWorkspace";
import { LandingPage } from "@/features/landing/LandingPage";
import { StudentWorkspace } from "@/features/student/StudentWorkspace";
import { PrintableTeacherReport } from "@/features/teacher/print/PrintableTeacherReport";
import { TeacherReport } from "@/features/teacher/report/TeacherReport";
import { TeacherWorkspace } from "@/features/teacher/TeacherWorkspace";

function currentPathname() {
  return window.location.pathname;
}

type Route =
  | "/teacher"
  | "/teacher/lesson-plan"
  | "/teacher/report"
  | "/teacher/report/print"
  | "/student"
  | "/admin/login"
  | "/admin";

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

  if (pathname === "/teacher/report") {
    return <TeacherReport onNavigate={navigate} />;
  }

  if (pathname === "/teacher/report/print") {
    return <PrintableTeacherReport />;
  }

  if (pathname === "/student") {
    return <StudentWorkspace />;
  }

  if (pathname === "/admin/login") {
    return <AdminLoginPage onNavigate={navigate} />;
  }

  if (pathname === "/admin") {
    return <AdminWorkspace onNavigate={navigate} />;
  }

  return <LandingPage onNavigate={navigate} />;
}
