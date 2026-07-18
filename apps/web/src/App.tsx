import { useEffect, useState } from "react";

import { LandingPage } from "@/features/landing/LandingPage";
import { StudentWorkspace } from "@/features/student/StudentWorkspace";
import { PrintableTeacherReport } from "@/features/teacher/print/PrintableTeacherReport";
import { TeacherProductWorkspace } from "@/features/teacher/product/TeacherProductWorkspace";
import { TeacherReport } from "@/features/teacher/report/TeacherReport";
import type { TeacherRoute } from "@/features/teacher/TeacherShell";
import { TeacherWorkspace } from "@/features/teacher/TeacherWorkspace";

function currentPathname() {
  return window.location.pathname;
}

type Route = TeacherRoute | "/teacher/report/print" | "/student";

const teacherProductRoutes = new Set<TeacherRoute>([
  "/teacher",
  "/teacher/classes",
  "/teacher/prepare",
  "/teacher/insights",
  "/teacher/students",
  "/teacher/teaching",
  "/teacher/after-class",
  "/teacher/interventions",
  "/teacher/resources",
]);

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

  if (teacherProductRoutes.has(pathname as TeacherRoute)) {
    return (
      <TeacherProductWorkspace
        onNavigate={navigate}
        route={
          pathname as Exclude<
            TeacherRoute,
            "/teacher/lesson-plan" | "/teacher/report"
          >
        }
      />
    );
  }

  if (pathname === "/teacher/lesson-plan") {
    return <TeacherWorkspace view="lesson-plan" onNavigate={navigate} />;
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

  return <LandingPage onNavigate={navigate} />;
}
