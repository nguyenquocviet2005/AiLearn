import { useEffect, useState } from "react";

import { StudentPreviewWorkspace } from "@/features/student-preview/StudentPreviewWorkspace";
import { PrintableTeacherReport } from "@/features/teacher/print/PrintableTeacherReport";
import { TeacherReport } from "@/features/teacher/report/TeacherReport";
import type { TeacherRoute } from "@/features/teacher/TeacherShell";
import { TeacherWorkspace } from "@/features/teacher/TeacherWorkspace";

import {
  mockTeacherReportRepository,
  mockTeacherWorkspaceRepository,
  resetPrototypeMockState,
} from "./mock-repositories";
import "./prototype.css";

export type PrototypeStepId =
  | "intro"
  | "teacher-overview"
  | "teacher-plan"
  | "student"
  | "report"
  | "print";

const STEPS: Array<{
  id: Exclude<PrototypeStepId, "print">;
  index: string;
  label: string;
  hint: string;
}> = [
  {
    id: "intro",
    index: "00",
    label: "Tổng quan",
    hint: "Vòng khép kín",
  },
  {
    id: "teacher-overview",
    index: "01",
    label: "Tổng quan lớp",
    hint: "Ưu tiên & nhóm",
  },
  {
    id: "teacher-plan",
    index: "02",
    label: "Kế hoạch",
    hint: "Sửa · duyệt · xuất bản",
  },
  {
    id: "student",
    index: "03",
    label: "Học sinh",
    hint: "Sẵn sàng · lộ trình",
  },
  {
    id: "report",
    index: "04",
    label: "Báo cáo",
    hint: "Kết quả can thiệp",
  },
];

type PrototypeFlowProps = {
  onExit?: () => void;
};

export function PrototypeFlow({ onExit }: PrototypeFlowProps) {
  const [step, setStep] = useState<PrototypeStepId>("intro");

  useEffect(() => {
    resetPrototypeMockState();
  }, []);

  function goHome() {
    if (onExit) {
      onExit();
      return;
    }
    window.history.pushState({}, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  function handleTeacherNavigate(path: TeacherRoute) {
    if (path === "/teacher/lesson-plan") {
      setStep("teacher-plan");
      return;
    }
    if (path === "/teacher/report") {
      setStep("report");
      return;
    }
    // Other teacher product routes stay on the overview step in this prototype.
    setStep("teacher-overview");
  }

  const stepIndex = STEPS.findIndex((item) => item.id === step);
  const canGoBack = step !== "intro" && step !== "print";
  const canGoNext = step !== "report" && step !== "print";

  function goNext() {
    if (step === "intro") setStep("teacher-overview");
    else if (step === "teacher-overview") setStep("teacher-plan");
    else if (step === "teacher-plan") setStep("student");
    else if (step === "student") setStep("report");
  }

  function goBack() {
    if (step === "teacher-overview") setStep("intro");
    else if (step === "teacher-plan") setStep("teacher-overview");
    else if (step === "student") setStep("teacher-plan");
    else if (step === "report") setStep("student");
    else if (step === "print") setStep("report");
  }

  return (
    <div className="prototype-app">
      <header className="prototype-banner">
        <div className="prototype-banner-top">
          <a
            className="prototype-brand"
            href="/"
            onClick={(event) => {
              event.preventDefault();
              goHome();
            }}
          >
            <img src="/brand/ailearn-mascot.webp" alt="" />
            <span>AiLearn prototype</span>
          </a>
          <span className="prototype-badge">Mock data · không gọi API</span>
          <div className="prototype-banner-actions">
            <button
              className="prototype-button prototype-button-ghost"
              disabled={!canGoBack}
              onClick={goBack}
              type="button"
            >
              Quay lại
            </button>
            <button
              className="prototype-button prototype-button-primary"
              disabled={!canGoNext}
              onClick={goNext}
              type="button"
            >
              Bước tiếp
            </button>
          </div>
        </div>

        <ol className="prototype-steps" aria-label="Các bước prototype">
          {STEPS.map((item) => (
            <li key={item.id}>
              <button
                aria-current={
                  item.id === step || (step === "print" && item.id === "report")
                    ? "step"
                    : undefined
                }
                onClick={() => setStep(item.id)}
                type="button"
              >
                <strong>{item.index}</strong>
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ol>
      </header>

      <div className="prototype-stage" data-step={step}>
        {step === "intro" && (
          <section
            className="prototype-intro"
            aria-labelledby="proto-intro-title"
          >
            <p className="prototype-kicker">Design review · Frontend only</p>
            <h1 id="proto-intro-title">
              Đi hết vòng học khép kín bằng dữ liệu giả lập.
            </h1>
            <p>
              Prototype này dùng cùng màn hình giáo viên và học sinh thật, nhưng
              mọi dữ liệu chạy trong bộ nhớ. Dùng để rà soát bố cục, tương tác,
              responsive và trình tự trước khi gắn backend.
            </p>
            <ol className="prototype-loop">
              <li>
                <strong>1</strong>
                <div>
                  <span>Tổng quan lớp</span>
                  <p>40 học sinh · ưu tiên dạy · nhóm can thiệp tạm thời.</p>
                </div>
              </li>
              <li>
                <strong>2</strong>
                <div>
                  <span>Kế hoạch 45 phút</span>
                  <p>Chỉnh thời lượng, lưu phiên bản, phê duyệt và xuất bản.</p>
                </div>
              </li>
              <li>
                <strong>3</strong>
                <div>
                  <span>Trải nghiệm học sinh</span>
                  <p>
                    Bài sẵn sàng, lộ trình sửa hổng, phiếu cuối — theo persona.
                  </p>
                </div>
              </li>
              <li>
                <strong>4</strong>
                <div>
                  <span>Báo cáo can thiệp</span>
                  <p>Phân biệt vận dụng độc lập với vẫn cần hỗ trợ.</p>
                </div>
              </li>
            </ol>
            <button
              className="prototype-button prototype-button-primary"
              onClick={() => setStep("teacher-overview")}
              type="button"
            >
              Bắt đầu từ tổng quan lớp
            </button>
          </section>
        )}

        {step === "teacher-overview" && (
          <TeacherWorkspace
            repository={mockTeacherWorkspaceRepository}
            view="overview"
            onNavigate={handleTeacherNavigate}
          />
        )}

        {step === "teacher-plan" && (
          <TeacherWorkspace
            repository={mockTeacherWorkspaceRepository}
            view="lesson-plan"
            onNavigate={handleTeacherNavigate}
          />
        )}

        {step === "student" && <StudentPreviewWorkspace />}

        {step === "report" && (
          <TeacherReport
            repository={mockTeacherReportRepository}
            onNavigate={(path) => {
              if (path === "/teacher/report/print") {
                setStep("print");
                return;
              }
              handleTeacherNavigate(path);
            }}
          />
        )}

        {step === "print" && (
          <div>
            <div className="prototype-print-note">
              <p className="prototype-kicker">Bản in giả lập</p>
              <p>
                Đây là bản in dùng mock repository — không gọi API. Dùng nút
                Quay lại để về báo cáo tương tác.
              </p>
              <button
                className="prototype-button"
                onClick={() => setStep("report")}
                type="button"
              >
                Về báo cáo
              </button>
            </div>
            <PrintableTeacherReport
              planRepository={mockTeacherWorkspaceRepository}
              reportRepository={mockTeacherReportRepository}
            />
          </div>
        )}
      </div>

      {stepIndex >= 0 && (
        <span className="prototype-sr-only" aria-live="polite">
          Đang ở bước {STEPS[stepIndex]?.label}
        </span>
      )}
    </div>
  );
}
