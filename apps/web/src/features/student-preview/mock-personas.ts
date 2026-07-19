import type {
  Representation,
  RemediationState,
  StepKind,
  StudentDiagnosticProfileV1,
} from "@ailearn/schemas";

import type {
  AssessmentItemPublic,
  ExitTicket,
} from "@/lib/adapters/student-types";

/**
 * Frontend-only mock data for the student-flow design-review prototype
 * (`/student-preview`). Content is copied from the real seeds
 * (`data/seeds/{items,demo-personas}.json`,
 * `packages/content/intervention-templates.json`) so the prototype reads
 * authentically, but nothing here is wired to a real engine — every
 * transition is scripted per persona. No network calls, no backend.
 */

export const MOCK_LESSON_ID = "lesson_g7_inverse_proportion_01";

export interface ScriptedStep {
  id: string;
  kind: StepKind;
  state: RemediationState;
  representation: Representation;
  title: string;
  body: string;
  checkpointQuestion: string;
  isGradable: boolean;
  acceptedAnswers: string[];
}

export interface MockPersonaScript {
  id: string;
  label: string;
  studentId: string;
  displayName: string;
  readinessItems: AssessmentItemPublic[];
  /** Whether the initial readiness pass abstains (routes to a probe item). */
  abstains: boolean;
  probeItem?: AssessmentItemPublic;
  initialProfile: StudentDiagnosticProfileV1;
  /** Profile used once a probe (if any) resolves the abstention. */
  resolvedProfile: StudentDiagnosticProfileV1;
  steps: ScriptedStep[];
  /** After 2 consecutive wrong self-report attempts, escalate to the teacher. */
  escalatesOnRepeatedFailure: boolean;
  exitTicket: ExitTicket;
  exitTicketCorrectLabel: string;
}

function nowIso(): string {
  return "2026-07-19T09:00:00Z";
}

const EXIT_TICKET: ExitTicket = {
  id: "exit_inverse_relation",
  question:
    "Khi số người cùng làm một công việc tăng lên, thời gian hoàn thành thường thay đổi thế nào?",
  options: ["Tăng lên", "Giảm xuống"],
};
const EXIT_TICKET_CORRECT_LABEL = "Giảm xuống";

const REPAIR_TABLE_STEP: Omit<ScriptedStep, "id"> = {
  kind: "worked_example",
  state: "REPAIR",
  representation: "table",
  title: "Phân biệt tỉ lệ thuận và tỉ lệ nghịch bằng bảng",
  body: `So sánh hai tình huống trên cùng một bảng:

| | Tỉ lệ THUẬN | Tỉ lệ NGHỊCH |
|---|---|---|
| Công thức | y = k·x | x·y = k |
| Khi x tăng | y **tăng** | y **giảm** |
| Đại lượng không đổi | Thương y/x = k | Tích x·y = k |
| Ví dụ | 1 quyển vở 5.000đ → 3 quyển 15.000đ | 12 công nhân 6 ngày → 6 công nhân 12 ngày |

**Cách kiểm tra nhanh:** lấy tích x·y ở mọi cặp giá trị.
Nếu các tích **bằng nhau** → tỉ lệ nghịch. Nếu thương y/x bằng nhau → tỉ lệ thuận.`,
  checkpointQuestion:
    "Bảng: x = 2, 4, 8 và y = 12, 6, 3. Tích x·y ở cả ba cặp bằng bao nhiêu? Hai đại lượng này tỉ lệ thuận hay nghịch?",
  isGradable: true,
  acceptedAnswers: [
    "tỉ lệ nghịch",
    "nghịch",
    "24, tỉ lệ nghịch",
    "24 tỉ lệ nghịch",
    "tích bằng 24, tỉ lệ nghịch",
  ],
};

const GUIDED_STEP: Omit<ScriptedStep, "id"> = {
  kind: "guided_problem",
  state: "REPAIR",
  representation: "text",
  title: "Cùng làm một bài có hướng dẫn",
  body: "12 công nhân hoàn thành một công việc trong 6 ngày. Nếu chỉ có 4 công nhân (cùng năng suất), họ cần bao nhiêu ngày? Gợi ý: tích (số công nhân) × (số ngày) không đổi.",
  checkpointQuestion: "Em đã tự làm được bước này chưa?",
  isGradable: false,
  acceptedAnswers: [],
};

const PRACTICE_STEP: Omit<ScriptedStep, "id"> = {
  kind: "independent_problem",
  state: "PRACTICE",
  representation: "text",
  title: "Tự làm một bài",
  body: "Một đội 8 người dự kiến làm xong việc trong 15 ngày. Nếu muốn hoàn thành trong 10 ngày, cần thêm bao nhiêu người (cùng năng suất)? Không có gợi ý lần này — em thử tự giải nhé.",
  checkpointQuestion: "Em đã tự làm được bước này chưa?",
  isGradable: false,
  acceptedAnswers: [],
};

const TRANSFER_STEP: Omit<ScriptedStep, "id"> = {
  kind: "near_transfer",
  state: "TRANSFER",
  representation: "text",
  title: "Thử một tình huống mới",
  body: "Một ô tô đi từ A đến B với vận tốc 60 km/h hết 3 giờ. Nếu đi với vận tốc 45 km/h thì mất bao lâu? Bài này hơi khác một chút, xem em áp dụng được không nhé.",
  checkpointQuestion: "Em đã tự làm được bước này chưa?",
  isGradable: false,
  acceptedAnswers: [],
};

function stepsFor(prefix: string): ScriptedStep[] {
  return [
    { id: `${prefix}_worked_example`, ...REPAIR_TABLE_STEP },
    { id: `${prefix}_guided_problem`, ...GUIDED_STEP },
    { id: `${prefix}_independent_problem`, ...PRACTICE_STEP },
    { id: `${prefix}_near_transfer`, ...TRANSFER_STEP },
  ];
}

function profile(
  studentId: string,
  status: StudentDiagnosticProfileV1["readiness_status"],
  confidence: number,
  rootCauseSkillId: string | null,
): StudentDiagnosticProfileV1 {
  return {
    schema_version: "1",
    student_id: studentId,
    lesson_id: MOCK_LESSON_ID,
    target_skill_id: "skill_word_problem_work_rate",
    readiness_status: status,
    confidence,
    root_causes: rootCauseSkillId
      ? [
          {
            skill_id: rootCauseSkillId,
            rank: 1,
            supporting_evidence_ids: [`ev_mock_${studentId}`],
            contradicting_evidence_ids: [],
          },
        ]
      : [],
    generated_at: nowIso(),
  };
}

const READINESS_ITEMS: AssessmentItemPublic[] = [
  {
    item_id: "item_inv_prop_01",
    skill_ids: ["skill_ratio_proportion_basics"],
    form: "Dạng 1.1",
    stem: "Từ tỉ lệ thức 3/4 = x/12, giá trị của x là:",
    options: [{ label: "9" }, { label: "16" }, { label: "8" }, { label: "36" }],
  },
  {
    item_id: "item_inv_prop_03",
    skill_ids: ["skill_direct_proportion"],
    form: "Dạng 1.1",
    stem: "Cho y tỉ lệ thuận với x theo hệ số 4. Khi x = 3 thì y bằng:",
    options: [
      { label: "12" },
      { label: "4/3" },
      { label: "7" },
      { label: "3/4" },
    ],
  },
  {
    item_id: "item_inv_prop_16",
    skill_ids: ["skill_word_problem_work_rate"],
    form: "Dạng 2.1",
    stem: "12 công nhân hoàn thành một công việc trong 6 ngày. Hỏi 9 công nhân (cùng năng suất) hoàn thành công việc đó trong bao nhiêu ngày?",
    options: [
      { label: "8 ngày" },
      { label: "4.5 ngày" },
      { label: "3 ngày" },
      { label: "18 ngày" },
    ],
  },
];

const PROBE_ITEM: AssessmentItemPublic = {
  item_id: "item_inv_prop_12",
  skill_ids: ["skill_distinguish_direct_inverse"],
  form: "Dạng 1.2",
  stem: "Quan hệ nào sau đây là tỉ lệ NGHỊCH?",
  options: [
    { label: "Số công nhân và số ngày hoàn thành cùng một công việc" },
    { label: "Số sản phẩm và tổng tiền phải trả (giá cố định)" },
    { label: "Quãng đường đi được và thời gian (vận tốc không đổi)" },
    { label: "Cạnh hình vuông và chu vi" },
  ],
};

export const MOCK_PERSONAS: MockPersonaScript[] = [
  {
    id: "foundational-gap",
    label: "Củng cố nền tảng",
    studentId: "stu_preview_foundation_01",
    displayName: "Bạn An",
    readinessItems: READINESS_ITEMS,
    abstains: false,
    initialProfile: profile(
      "stu_preview_foundation_01",
      "needs_support",
      0.86,
      "skill_ratio_proportion_basics",
    ),
    resolvedProfile: profile(
      "stu_preview_foundation_01",
      "needs_support",
      0.86,
      "skill_ratio_proportion_basics",
    ),
    steps: stepsFor("foundation"),
    escalatesOnRepeatedFailure: false,
    exitTicket: EXIT_TICKET,
    exitTicketCorrectLabel: EXIT_TICKET_CORRECT_LABEL,
  },
  {
    id: "insufficient-evidence",
    label: "Cần thêm bằng chứng",
    studentId: "stu_preview_insufficient_01",
    displayName: "Bạn Dũng",
    readinessItems: READINESS_ITEMS,
    abstains: true,
    probeItem: PROBE_ITEM,
    initialProfile: profile(
      "stu_preview_insufficient_01",
      "abstained",
      0.31,
      null,
    ),
    resolvedProfile: profile(
      "stu_preview_insufficient_01",
      "needs_support",
      0.79,
      "skill_distinguish_direct_inverse",
    ),
    steps: stepsFor("insufficient"),
    escalatesOnRepeatedFailure: false,
    exitTicket: EXIT_TICKET,
    exitTicketCorrectLabel: EXIT_TICKET_CORRECT_LABEL,
  },
  {
    id: "passing-transfer",
    label: "Áp dụng được tình huống mới",
    studentId: "stu_preview_transfer_01",
    displayName: "Bạn Hà",
    readinessItems: READINESS_ITEMS,
    abstains: false,
    initialProfile: profile(
      "stu_preview_transfer_01",
      "needs_support",
      0.84,
      "skill_inverse_proportion_definition",
    ),
    resolvedProfile: profile(
      "stu_preview_transfer_01",
      "needs_support",
      0.84,
      "skill_inverse_proportion_definition",
    ),
    steps: stepsFor("transfer"),
    escalatesOnRepeatedFailure: false,
    exitTicket: EXIT_TICKET,
    exitTicketCorrectLabel: EXIT_TICKET_CORRECT_LABEL,
  },
  {
    id: "teacher-escalation",
    label: "Cần cô hỗ trợ",
    studentId: "stu_preview_escalation_01",
    displayName: "Bạn Lan",
    readinessItems: READINESS_ITEMS,
    abstains: false,
    initialProfile: profile(
      "stu_preview_escalation_01",
      "needs_support",
      0.73,
      "skill_direct_proportion",
    ),
    resolvedProfile: profile(
      "stu_preview_escalation_01",
      "needs_support",
      0.73,
      "skill_direct_proportion",
    ),
    steps: stepsFor("escalation"),
    escalatesOnRepeatedFailure: true,
    exitTicket: EXIT_TICKET,
    exitTicketCorrectLabel: EXIT_TICKET_CORRECT_LABEL,
  },
];

export function findPersonaByStudentId(
  studentId: string,
): MockPersonaScript | undefined {
  return MOCK_PERSONAS.find((persona) => persona.studentId === studentId);
}

export function findPersonaById(
  personaId: string,
): MockPersonaScript | undefined {
  return MOCK_PERSONAS.find((persona) => persona.id === personaId);
}
