import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { StudentDiagnosticProfileV1 } from "@ailearn/schemas";

import type { StudentRepository } from "@/lib/adapters/student-repository";
import type {
  AssessmentItemPublic,
  ExitTicketResponse,
  RemediationResponse,
  StartSessionResponse,
} from "@/lib/adapters/student-types";

import { StudentWorkspace } from "./StudentWorkspace";
import { saveToCache } from "@/lib/offline/content-cache";

const ITEMS: AssessmentItemPublic[] = [
  {
    item_id: "item_1",
    skill_ids: ["skill_ratio_proportion_basics"],
    form: "mcq",
    stem: "Question one?",
    options: [{ label: "A" }, { label: "B" }],
  },
  {
    item_id: "item_2",
    skill_ids: ["skill_fraction_multiplication"],
    form: "mcq",
    stem: "Question two?",
    options: [{ label: "C" }, { label: "D" }],
  },
];

const SESSION: StartSessionResponse = {
  session_id: "sess_1",
  student_id: "stu_g7_001",
  lesson_id: "lesson_g7_inverse_proportion_01",
  target_skill_id: "skill_word_problem_work_rate",
  items: ITEMS,
};

const NEEDS_SUPPORT_PROFILE: StudentDiagnosticProfileV1 = {
  schema_version: "1",
  student_id: "stu_g7_001",
  lesson_id: "lesson_g7_inverse_proportion_01",
  target_skill_id: "skill_word_problem_work_rate",
  readiness_status: "needs_support",
  confidence: 0.8,
  root_causes: [
    {
      skill_id: "skill_ratio_proportion_basics",
      rank: 1,
      supporting_evidence_ids: ["ev_1"],
      contradicting_evidence_ids: [],
    },
  ],
  generated_at: "2026-07-19T10:50:00Z",
};

const ABSTAINED_PROFILE: StudentDiagnosticProfileV1 = {
  ...NEEDS_SUPPORT_PROFILE,
  readiness_status: "abstained",
  root_causes: [],
};

function remediationResponse(
  overrides: Partial<RemediationResponse> = {},
): RemediationResponse {
  return {
    path: {
      schema_version: "1",
      id: "path_1",
      student_id: "stu_g7_001",
      target_skill_id: "skill_word_problem_work_rate",
      current_state: "REPAIR",
      representation: "text",
      steps: [
        {
          id: "step_1_worked_example",
          kind: "worked_example",
          state: "REPAIR",
          completed: false,
        },
        {
          id: "step_1_guided_problem",
          kind: "guided_problem",
          state: "REPAIR",
          completed: false,
        },
        {
          id: "step_1_independent_problem",
          kind: "independent_problem",
          state: "PRACTICE",
          completed: false,
        },
        {
          id: "step_1_near_transfer",
          kind: "near_transfer",
          state: "TRANSFER",
          completed: false,
        },
        {
          id: "step_1_result",
          kind: "result",
          state: "TRANSFER",
          completed: false,
        },
      ],
      updated_at: "2026-07-19T11:00:00Z",
      root_cause_skill_id: "skill_ratio_proportion_basics",
    },
    current_step_kind: "worked_example",
    is_complete: false,
    transfer_outcome: null,
    escalation_reason: null,
    content: {
      template_id: "tpl_1",
      title: "Ví dụ mẫu",
      body: "Đây là một ví dụ mẫu.",
      checkpoint_question: "2 + 2 = ?",
      checkpoint_answer: "4",
      representation: "text",
      source: "template",
    },
    ...overrides,
  };
}

function fakeRepository(
  overrides: Partial<StudentRepository> = {},
): StudentRepository {
  return {
    startReadinessSession: vi.fn().mockResolvedValue(SESSION),
    submitReadinessResponse: vi.fn().mockResolvedValue({
      evidence_event: {},
      remaining_item_ids: [],
      session_complete: false,
    }),
    getDiagnosticProfile: vi.fn().mockResolvedValue(NEEDS_SUPPORT_PROFILE),
    startRemediationSession: vi.fn().mockResolvedValue(remediationResponse()),
    submitRemediationAttempt: vi.fn().mockResolvedValue(
      remediationResponse({
        current_step_kind: "guided_problem",
        content: {
          template_id: "tpl_2",
          title: "Bài có hướng dẫn",
          body: "Bài có hướng dẫn.",
          checkpoint_question: "3 + 3 = ?",
          checkpoint_answer: "6",
          representation: "text",
          source: "template",
        },
      }),
    ),
    confirmEvidence: vi.fn(),
    submitExitTicket: vi.fn(),
    listDemoPersonas: vi.fn().mockResolvedValue([]),
    resetDemo: vi.fn(),
    ...overrides,
  } as unknown as StudentRepository;
}

async function answerReadinessItem(
  user: ReturnType<typeof userEvent.setup>,
  optionLabel: string,
): Promise<void> {
  await user.click(
    screen.getByRole("radio", { name: new RegExp(optionLabel) }),
  );
  await user.click(screen.getByRole("button", { name: "Em giải thích được" }));
  await user.click(screen.getByRole("button", { name: "Gửi câu trả lời" }));
}

beforeEach(() => {
  localStorage.clear();
});

describe("StudentWorkspace", () => {
  it("renders the AiLearn brand shell and updates primary navigation state", async () => {
    const user = userEvent.setup();
    render(<StudentWorkspace repository={fakeRepository()} />);

    expect(
      within(screen.getByRole("banner")).getByRole("img", {
        name: "AiLearn",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Hôm nay/ })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await user.click(screen.getByRole("button", { name: /Lộ trình của em/ }));

    expect(
      screen.getByRole("button", { name: /Lộ trình của em/ }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      screen.getByText(
        "Lộ trình sẽ xuất hiện sau khi em hoàn thành bài chuẩn bị.",
      ),
    ).toBeInTheDocument();
  });

  it("completes readiness and remediation without ever rendering a raw skill id", async () => {
    const repository = fakeRepository();
    const user = userEvent.setup();

    render(<StudentWorkspace repository={repository} />);

    await user.click(screen.getByRole("button", { name: /Bắt đầu bài ngắn/ }));

    expect(await screen.findByText("Question one?")).toBeInTheDocument();
    const submitButton = screen.getByRole("button", {
      name: "Gửi câu trả lời",
    });
    expect(submitButton).toBeDisabled();

    await answerReadinessItem(user, "A");

    expect(await screen.findByText("Question two?")).toBeInTheDocument();
    await answerReadinessItem(user, "C");

    // Readiness complete -> diagnosing -> remediation, tab switches automatically.
    expect(
      await screen.findByRole("heading", { name: "Ví dụ mẫu" }),
    ).toBeInTheDocument();
    expect(repository.getDiagnosticProfile).toHaveBeenCalledWith(
      "stu_g7_001",
      "lesson_g7_inverse_proportion_01",
    );
    expect(repository.startRemediationSession).toHaveBeenCalledWith(
      NEEDS_SUPPORT_PROFILE,
    );

    // AC2: no technical root-cause / skill id text anywhere on screen.
    expect(document.body.textContent).not.toMatch(/skill_/);
    expect(document.body.textContent).not.toContain("root_cause");

    // Grade the checkpoint against the (server-only) checkpoint_answer.
    const answerInput = screen.getByLabelText("Câu trả lời của em");
    await user.type(answerInput, "4");
    await user.click(screen.getByRole("button", { name: "Kiểm tra" }));

    await waitFor(() => {
      expect(repository.submitRemediationAttempt).toHaveBeenCalledWith(
        "stu_g7_001",
        "step_1_worked_example",
        true,
        expect.any(String),
      );
    });
    expect(await screen.findByText("Bài có hướng dẫn.")).toBeInTheDocument();
  });

  it("requires both an option and a confidence level before enabling submit", async () => {
    const repository = fakeRepository();
    const user = userEvent.setup();
    render(<StudentWorkspace repository={repository} />);
    await user.click(screen.getByRole("button", { name: /Bắt đầu bài ngắn/ }));
    await screen.findByText("Question one?");

    const submitButton = screen.getByRole("button", {
      name: "Gửi câu trả lời",
    });
    expect(submitButton).toBeDisabled();

    await user.click(screen.getByRole("radio", { name: /A/ }));
    expect(submitButton).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Em chưa chắc" }));
    expect(submitButton).toBeEnabled();
  });

  it("shows a representation-changed note after an attempt switches representation", async () => {
    const repository = fakeRepository({
      submitRemediationAttempt: vi.fn().mockResolvedValue(
        remediationResponse({
          path: {
            ...remediationResponse().path,
            representation: "table",
          },
          current_step_kind: "worked_example",
          content: {
            template_id: "tpl_table",
            title: "Ví dụ dạng bảng",
            body: "Xem bảng dưới đây.",
            checkpoint_question: "5 + 5 = ?",
            checkpoint_answer: "10",
            representation: "table",
            source: "template",
          },
        }),
      ),
    });
    const user = userEvent.setup();
    render(<StudentWorkspace repository={repository} />);

    await user.click(screen.getByRole("button", { name: /Bắt đầu bài ngắn/ }));
    await answerReadinessItem(user, "A");
    await answerReadinessItem(user, "C");

    await screen.findByRole("heading", { name: "Ví dụ mẫu" });
    const answerInput = screen.getByLabelText("Câu trả lời của em");
    await user.type(answerInput, "wrong");
    await user.click(screen.getByRole("button", { name: "Kiểm tra" }));

    expect(await screen.findByText(/Đã đổi sang/)).toBeInTheDocument();
  });

  it("shows the confirmation disambiguation screen for an abstained profile", async () => {
    const probeSession: StartSessionResponse = {
      ...SESSION,
      session_id: "sess_probe",
      items: [ITEMS[0]],
    };
    const repository = fakeRepository({
      getDiagnosticProfile: vi.fn().mockResolvedValue(ABSTAINED_PROFILE),
      startReadinessSession: vi
        .fn()
        .mockResolvedValueOnce(SESSION)
        .mockResolvedValueOnce(probeSession),
      startRemediationSession: vi.fn().mockResolvedValue(
        remediationResponse({
          path: {
            ...remediationResponse().path,
            current_state: "CONFIRMATION",
          },
          current_step_kind: "worked_example",
        }),
      ),
    });
    const user = userEvent.setup();
    render(<StudentWorkspace repository={repository} />);

    await user.click(screen.getByRole("button", { name: /Bắt đầu bài ngắn/ }));
    await answerReadinessItem(user, "A");
    await answerReadinessItem(user, "C");

    expect(
      await screen.findByText(
        "Hệ thống cần thêm một câu để hiểu em đang vướng ở đâu.",
      ),
    ).toBeInTheDocument();
  });

  it("does not duplicate a queued response after the network recovers", async () => {
    const submitReadinessResponse = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue({
        evidence_event: {},
        remaining_item_ids: [],
        session_complete: false,
      });
    const repository = fakeRepository({ submitReadinessResponse });
    const user = userEvent.setup();
    render(<StudentWorkspace repository={repository} />);

    await user.click(screen.getByRole("button", { name: /Bắt đầu bài ngắn/ }));
    await answerReadinessItem(user, "A");

    // First flush attempt failed; the write stays queued (visible via the sync badge).
    await waitFor(() => {
      expect(submitReadinessResponse).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText(/Đang chờ đồng bộ/)).toBeInTheDocument();

    // Manual retry via the sync badge succeeds and does not resend.
    const syncButton = screen.getByRole("button", { name: /Đang chờ đồng bộ/ });
    await user.click(syncButton);

    await waitFor(() => {
      expect(submitReadinessResponse).toHaveBeenCalledTimes(2);
    });
    await screen.findByText("Đã đồng bộ");

    // Clicking the (now "synced") badge again must not resend the same write.
    await user.click(syncButton);
    expect(submitReadinessResponse).toHaveBeenCalledTimes(2);
  });

  it("resumes readiness progress from the cache after a simulated reload", async () => {
    const repository = fakeRepository();
    const user = userEvent.setup();
    const { unmount } = render(<StudentWorkspace repository={repository} />);

    await user.click(screen.getByRole("button", { name: /Bắt đầu bài ngắn/ }));
    await answerReadinessItem(user, "A");
    await screen.findByText("Question two?");

    unmount(); // simulates losing the in-memory React tree

    render(<StudentWorkspace repository={repository} />);
    await user.click(
      screen.getByRole("button", { name: /Tiếp tục bài của em/ }),
    );

    expect(
      await within(screen.getByRole("main")).findByText("Question two?"),
    ).toBeInTheDocument();
    expect(repository.startReadinessSession).toHaveBeenCalledOnce();
  });

  it("lists cached content in the help tab so it stays reachable offline", async () => {
    const repository = fakeRepository();
    const user = userEvent.setup();
    render(<StudentWorkspace repository={repository} />);

    await user.click(screen.getByRole("button", { name: /Bắt đầu bài ngắn/ }));
    await screen.findByText("Question one?");

    await user.click(screen.getByRole("button", { name: /Trợ giúp/ }));
    await user.click(
      screen.getByRole("button", { name: /Kiểm tra bài đã lưu/ }),
    );

    expect(
      await screen.findByText("readiness-progress:stu_g7_001"),
    ).toBeInTheDocument();
  });

  it("records the exit ticket after a completed remediation path", async () => {
    const completed = remediationResponse({
      is_complete: true,
      transfer_outcome: true,
      current_step_kind: "result",
      exit_ticket: {
        id: "exit_inverse_relation",
        question: "Khi số người tăng lên thì thời gian thay đổi thế nào?",
        options: ["Tăng lên", "Giảm xuống"],
      },
    });
    const exitTicketResult: ExitTicketResponse = {
      outcome: {
        kind: "transfer_passed",
        recorded_at: "2026-07-18T11:00:00Z",
        message: "Em đã áp dụng được kiến thức vào một tình huống mới.",
        reclassified_profile: null,
      },
      remediation: completed,
    };
    const submitExitTicket = vi.fn().mockResolvedValue(exitTicketResult);
    const repository = fakeRepository({ submitExitTicket });
    saveToCache("remediation-progress:stu_g7_001", {
      remediation: completed,
      profile: NEEDS_SUPPORT_PROFILE,
    });
    const user = userEvent.setup();

    render(<StudentWorkspace repository={repository} />);
    await user.click(
      screen.getByRole("button", { name: "Xem lộ trình của em" }),
    );

    expect(
      await screen.findByText(
        "Khi số người tăng lên thì thời gian thay đổi thế nào?",
      ),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "Giảm xuống" }));
    await user.click(screen.getByRole("button", { name: "Gửi bài cuối" }));

    await waitFor(() => {
      expect(submitExitTicket).toHaveBeenCalledWith(
        "stu_g7_001",
        "exit_inverse_relation",
        "Giảm xuống",
        expect.any(String),
      );
    });
    expect(
      await screen.findByText(
        "Em đã áp dụng được kiến thức vào một tình huống mới.",
      ),
    ).toBeInTheDocument();
  });

  it("resets a selected seeded persona into its remediation path", async () => {
    const persona = {
      id: "foundational-gap",
      label: "Củng cố nền tảng",
      student_id: "stu_demo_foundation_01",
      display_name: "Bạn An",
      profile: {
        ...NEEDS_SUPPORT_PROFILE,
        student_id: "stu_demo_foundation_01",
      },
    };
    const repository = fakeRepository({
      listDemoPersonas: vi.fn().mockResolvedValue([persona]),
      resetDemo: vi.fn().mockResolvedValue({ persona }),
    });
    const user = userEvent.setup();

    render(<StudentWorkspace repository={repository} />);
    await screen.findByRole("combobox", { name: "Tình huống demo" });
    await user.click(screen.getByRole("button", { name: "Đặt lại" }));

    await waitFor(() => {
      expect(repository.resetDemo).toHaveBeenCalledWith("foundational-gap");
    });
    expect(repository.startRemediationSession).toHaveBeenCalledWith(
      persona.profile,
    );
    expect(await screen.findByText("Bạn An")).toBeInTheDocument();
  });

  it("keeps an offline exit ticket pending and resolves its original submission", async () => {
    const completed = remediationResponse({
      is_complete: true,
      transfer_outcome: true,
      current_step_kind: "result",
      exit_ticket: {
        id: "exit_inverse_relation",
        question: "Bài cuối?",
        options: ["Tăng lên", "Giảm xuống"],
      },
    });
    const exitTicketResult: ExitTicketResponse = {
      outcome: {
        kind: "transfer_passed",
        recorded_at: "2026-07-18T11:00:00Z",
        message: "Đã ghi nhận bài cuối.",
        reclassified_profile: null,
      },
      remediation: completed,
    };
    const submitExitTicket = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue(exitTicketResult);
    const repository = fakeRepository({ submitExitTicket });
    saveToCache("remediation-progress:stu_g7_001", {
      remediation: completed,
      profile: NEEDS_SUPPORT_PROFILE,
    });
    const user = userEvent.setup();

    render(<StudentWorkspace repository={repository} />);
    await user.click(
      screen.getByRole("button", { name: "Xem lộ trình của em" }),
    );
    await user.click(screen.getByRole("radio", { name: "Giảm xuống" }));
    await user.click(screen.getByRole("button", { name: "Gửi bài cuối" }));

    expect(
      await screen.findByText(
        "Đã lưu bài cuối trên máy. Đang chờ kết nối để gửi đi...",
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Đang chờ đồng bộ/ }));

    await waitFor(() => {
      expect(submitExitTicket).toHaveBeenCalledTimes(2);
    });
    expect(
      await screen.findByText("Đã ghi nhận bài cuối."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Gửi bài cuối" }),
    ).not.toBeInTheDocument();
  });
});
