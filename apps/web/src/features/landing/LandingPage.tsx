import "./landing.css";

import { AppHeader } from "@/components/navigation/AppHeader";

type WorkspaceRoute = "/teacher" | "/student";

type LandingPageProps = {
  onNavigate: (path: WorkspaceRoute) => void;
};

const learningInputs = [
  { glyph: "▶", label: "Video & bài giảng", delay: "0s" },
  { glyph: "Aa", label: "Tài liệu học tập", delay: "1.5s" },
  { glyph: "✓", label: "Bài kiểm tra đã có", delay: "3s" },
  { glyph: "✦", label: "Soạn bài trước giờ", delay: "4.5s" },
];

const learningOutcomes = [
  { glyph: "↗", title: "Điểm số", detail: "Tăng đúng kỹ năng" },
  { glyph: "↓", title: "Lỗ hổng", detail: "Được thu hẹp" },
  { glyph: "✓", title: "Chuyển giao", detail: "Hiểu trong tình huống mới" },
];

const learningLoop = [
  {
    number: "01",
    label: "Thu nhận",
    title: "Mã hóa dấu\u00a0vết học tập",
    description:
      "Mỗi lượt xem, câu trả lời và tài liệu được gắn với kỹ năng, lần thử và mức tự tin.",
    output: "Hồ sơ minh chứng",
    signal: "≡",
  },
  {
    number: "02",
    label: "Định vị",
    title: "Tìm đúng chỗ vướng",
    description:
      "Mẫu sai được đối chiếu với đồ thị kỹ năng; hệ thống hỏi thêm khi chưa đủ chắc chắn.",
    output: "Lỗ hổng gốc + độ tin cậy",
    signal: "◎",
  },
  {
    number: "03",
    label: "Can thiệp",
    title: "Chọn cách\u00a0học vừa đủ",
    description:
      "AiLearn đề xuất nhóm nhu cầu và đường học; giáo viên chỉnh sửa rồi quyết định.",
    output: "Giáo án đã duyệt",
    signal: "↗",
  },
  {
    number: "04",
    label: "Kiểm chứng",
    title: "Đo chuyển biến thực",
    description:
      "Bài chuyển giao so sánh trước và sau để biết học sinh tiến bộ ở đâu, còn vướng ở đâu.",
    output: "Tiến bộ có bằng chứng",
    signal: "✓",
  },
];

const technologyStages = [
  {
    number: "01",
    shortLabel: "Hiểu",
    label: "Mô hình người học",
    title: "Hiểu đúng mức độ thành thạo",
    outcome: "Cập nhật sau mỗi minh chứng, không đóng khung học sinh",
    description:
      "AiLearn ghép các câu trả lời đúng, sai và mức tự tin thành một trạng thái kỹ năng có thể cập nhật. Khi dữ liệu còn ít hoặc mâu thuẫn, hệ thống chọn hỏi thêm thay vì vội kết luận.",
  },
  {
    number: "02",
    shortLabel: "Tìm",
    label: "Chẩn đoán nguyên nhân",
    title: "Lần ngược để tìm chỗ hổng gốc",
    outcome: "Đồ thị kỹ năng + mẫu sai + bằng chứng đối chiếu",
    description:
      "Thay vì chỉ báo câu nào sai, AiLearn lần theo kiến thức tiền đề và mẫu lỗi quan niệm. Mỗi giả thuyết đều đi kèm dấu vết ủng hộ, phản bác và câu hỏi cần xác minh tiếp.",
  },
  {
    number: "03",
    shortLabel: "Vá gap",
    label: "Cá nhân hóa lộ trình",
    title: "Vá đúng gap bằng một đường học vừa đủ",
    outcome: "Xác nhận → Sửa hổng → Luyện tập → Chuyển giao",
    description:
      "Lộ trình 8-15 phút đổi cách biểu diễn khi học sinh tiếp tục vướng, lùi về kỹ năng nền khi cần và kết thúc bằng bài mới để kiểm tra việc hiểu có thực sự chuyển giao.",
  },
];

const diagnosticFlow = [
  {
    glyph: "E",
    label: "Dòng minh chứng",
    detail: "Đúng · sai · phương án chọn",
  },
  { glyph: "β", label: "Mức thành thạo", detail: "Cập nhật theo từng kỹ năng" },
  { glyph: "G", label: "Truy nguyên nhân", detail: "Skill graph · mẫu lỗi" },
  { glyph: "?", label: "Quyết định", detail: "Sẵn sàng · hỗ trợ · hỏi thêm" },
];

const teacherPriorityWeights = [
  {
    value: "40%",
    label: "Độ phổ biến",
    detail: "Số học sinh cùng vướng",
    tone: "cyan",
  },
  {
    value: "25%",
    label: "Ảnh hưởng đồ thị",
    detail: "Số kỹ năng phía sau",
    tone: "purple",
  },
  {
    value: "20%",
    label: "Cấp thiết bài học",
    detail: "Đích học hoặc tiên quyết",
    tone: "yellow",
  },
  {
    value: "15%",
    label: "Độ tin cậy",
    detail: "Trung bình chẩn đoán",
    tone: "pink",
  },
];

const remediationSequence = [
  { number: "01", label: "Ví dụ mẫu", state: "Sửa hổng" },
  { number: "02", label: "Làm có hướng dẫn", state: "Sửa hổng" },
  { number: "03", label: "Làm độc lập", state: "Luyện tập" },
  { number: "04", label: "Bài chuyển giao", state: "Vận dụng" },
  { number: "05", label: "Ghi nhận kết quả", state: "Minh chứng mới" },
];

const coreTrustProperties = [
  {
    tone: "cyan",
    tag: "Nhẹ để triển khai",
    title: "Chạy tốt trên máy cấu hình thấp",
    detail:
      "Beta-Bernoulli và toàn bộ quy tắc là mô hình xác suất dạng đóng chạy trên CPU, không huấn luyện — triển khai được trên phần cứng phổ thông ở trường, không cần GPU và không cần LLM để ra một chẩn đoán.",
    proof: "Chỉ CPU · không cần GPU",
  },
  {
    tone: "pink",
    tag: "Lớp bảo vệ nhiều tầng",
    title: "Biết khi nào nên im lặng",
    detail:
      "Dưới 5 minh chứng, lỗi không đủ nghĩa hoặc bằng chứng ủng hộ/phản bác cân bằng đều bị chặn thành “cần xác nhận thêm”; validator và giáo viên là cửa cuối.",
    proof: "Abstention · SymPy · human gate",
  },
  {
    tone: "yellow",
    tag: "Độ tin cậy hiệu chỉnh",
    title: "Mỗi chẩn đoán kèm một con số",
    detail:
      "Confidence xác định trong 0–1 dựng từ số minh chứng và tỉ lệ ủng hộ; hạ theo thang riêng khi engine chọn hỏi thêm thay vì kết luận.",
    proof: "C = 0,2 + 0,03N + 0,4·S/(S+K)",
  },
  {
    tone: "purple",
    tag: "Trace tái lập 100%",
    title: "Cùng minh chứng, cùng kết quả",
    detail:
      "Không có ngẫu nhiên: mọi giả thuyết mang ID minh chứng ủng hộ và phản bác, mọi điểm ưu tiên phơi bày từng thành phần để giáo viên truy lại.",
    proof: "Deterministic · evidence IDs",
  },
  {
    tone: "green",
    tag: "Vòng lặp học liên tục",
    title: "Cập nhật online theo dòng minh chứng",
    detail:
      "Mô hình người học cập nhật Bayesian ngay khi có minh chứng mới; kết quả bài chuyển giao được ghi lại và đưa vào chẩn đoán vòng sau — một vòng lặp khép kín.",
    proof: "Online update · closed loop",
  },
];

const runtimeTechnology = {
  pwa: [
    { name: "React", logo: "/technology/react.svg" },
    { name: "TypeScript", logo: "/technology/typescript.svg" },
    { name: "Vite", logo: "/technology/vite.svg" },
  ],
  localHub: [
    { name: "FastAPI", logo: "/technology/fastapi.svg" },
    { name: "Python", logo: "/technology/python.svg" },
  ],
  edge: [{ name: "Vercel", logo: "/technology/vercel.svg" }],
  cloudApi: [
    { name: "FastAPI", logo: "/technology/fastapi.svg" },
    { name: "Railway", logo: "/technology/railway.svg" },
    { name: "Python", logo: "/technology/python.svg" },
  ],
  data: [
    { name: "Supabase", logo: "/technology/supabase.svg" },
    { name: "PostgreSQL", logo: "/technology/postgresql.svg" },
    { name: "Neo4j", logo: "/technology/neo4j.svg" },
  ],
};

const insightGraphGroups = [
  {
    id: "learners",
    label: "Học sinh",
    nodes: [
      { label: "Hồ sơ học tập", y: 25 },
      { label: "Nhóm nhu cầu", y: 52 },
      { label: "Lịch sử kỹ năng", y: 78 },
    ],
  },
  {
    id: "evidence",
    label: "Bài & minh chứng",
    nodes: [
      { label: "Câu trả lời", y: 22 },
      { label: "Chuỗi lần thử", y: 49 },
      { label: "Mức tự tin", y: 77 },
    ],
  },
  {
    id: "errors",
    label: "Thể loại lỗi",
    nodes: [
      { label: "Nhầm khái niệm", y: 18 },
      { label: "Lỗi tính toán", y: 38 },
      { label: "Lỗi biểu diễn", y: 59 },
      { label: "Chưa đủ bằng chứng", y: 80 },
    ],
  },
  {
    id: "methods",
    label: "Cách định vị",
    nodes: [
      { label: "So khớp mẫu", y: 25 },
      { label: "Truy kỹ năng nền", y: 52 },
      { label: "Hỏi phân biệt", y: 78 },
    ],
  },
  {
    id: "actions",
    label: "Hành động",
    nodes: [
      { label: "Nhóm tạm thời", y: 25 },
      { label: "Dạy lại đúng chỗ", y: 52 },
      { label: "Lộ trình cá nhân", y: 78 },
    ],
  },
];

const insightGraphEdges = [
  { d: "M100 160 C180 160 220 140 300 140", tone: "evidence" },
  { d: "M100 160 C190 180 220 300 300 300", tone: "evidence" },
  { d: "M100 320 C180 320 220 300 300 300", tone: "evidence" },
  { d: "M100 480 C180 480 220 470 300 470", tone: "evidence" },
  { d: "M300 140 C380 140 420 120 500 120", tone: "error" },
  { d: "M300 140 C380 160 420 240 500 240", tone: "error" },
  { d: "M300 300 C380 300 420 240 500 240", tone: "error" },
  { d: "M300 300 C380 320 420 370 500 370", tone: "error" },
  { d: "M300 470 C380 470 420 370 500 370", tone: "error" },
  { d: "M300 470 C380 470 420 500 500 500", tone: "error" },
  { d: "M500 120 C580 120 620 160 700 160", tone: "method" },
  { d: "M500 120 C580 150 620 320 700 320", tone: "method" },
  { d: "M500 240 C580 240 620 160 700 160", tone: "method" },
  { d: "M500 240 C580 260 620 480 700 480", tone: "method" },
  { d: "M500 370 C580 370 620 320 700 320", tone: "method" },
  { d: "M500 370 C580 390 620 480 700 480", tone: "method" },
  { d: "M500 500 C580 500 620 480 700 480", tone: "method" },
  { d: "M700 160 C780 160 820 160 900 160", tone: "action" },
  { d: "M700 160 C780 180 820 320 900 320", tone: "action" },
  { d: "M700 320 C780 320 820 320 900 320", tone: "action" },
  { d: "M700 320 C780 350 820 480 900 480", tone: "action" },
  { d: "M700 480 C780 480 820 480 900 480", tone: "action" },
];

const insightGraphSignals = [
  {
    path: "M100 160 C180 160 220 140 300 140 C380 140 420 120 500 120 C580 120 620 160 700 160 C780 160 820 160 900 160",
    color: "#f1d94f",
    begin: "0s",
  },
  {
    path: "M100 320 C180 320 220 300 300 300 C380 320 420 370 500 370 C580 370 620 320 700 320 C780 350 820 480 900 480",
    color: "#8cebf8",
    begin: "-1.7s",
  },
  {
    path: "M100 480 C180 480 220 470 300 470 C380 470 420 500 500 500 C580 500 620 480 700 480 C780 480 820 480 900 480",
    color: "#63e6be",
    begin: "-3.2s",
  },
];

type RuntimeTechnology =
  (typeof runtimeTechnology)[keyof typeof runtimeTechnology];

function RuntimeTechnologyMarks({
  technologies,
}: {
  technologies: RuntimeTechnology;
}) {
  return (
    <ul className="landing-runtime-marks" aria-label="Công nghệ sử dụng">
      {technologies.map((technology) => (
        <li key={technology.name}>
          <img src={technology.logo} alt="" loading="lazy" />
          <span>{technology.name}</span>
        </li>
      ))}
    </ul>
  );
}

const teamMembers = [
  {
    name: "Bạch Kim Anh",
    role: "CMO",
    image: "/team/bach-kim-anh.webp",
  },
  {
    name: "Nguyễn Quốc Việt",
    role: "Vibecoder Manager",
    image: "/team/nguyen-quoc-viet.webp",
  },
  {
    name: "Nguyễn Hồng Hải",
    role: "CTO",
    image: "/team/nguyen-hong-hai.webp",
  },
  {
    name: "Vũ Trung Quân",
    role: "CEO",
    image: "/team/vu-trung-quan.webp",
  },
  {
    name: "Phạm Trọng Đông Hải",
    role: "AI Engineer",
    image: "/team/pham-trong-dong-hai.webp",
  },
  {
    name: "Phạm Quang Huy",
    role: "AI Researcher",
    image: "/team/pham-quang-huy.webp",
  },
];

function WorkspaceLink({
  children,
  className,
  onNavigate,
  route,
}: {
  children: React.ReactNode;
  className: string;
  onNavigate: LandingPageProps["onNavigate"];
  route: WorkspaceRoute;
}) {
  return (
    <a
      className={className}
      href={route}
      onClick={(event) => {
        event.preventDefault();
        onNavigate(route);
      }}
    >
      {children}
    </a>
  );
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="landing-page">
      <a className="landing-skip-link" href="#landing-main">
        Bỏ qua điều hướng
      </a>

      <AppHeader
        className="landing-island"
        context={
          <nav className="landing-nav" aria-label="Điều hướng trang giới thiệu">
            <a href="#learning-loop">Cách hoạt động</a>
            <a href="#technology">Công nghệ</a>
            <a href="#for-teachers">Giáo viên</a>
            <a href="#for-students">Học sinh</a>
            <a href="#team">Đội ngũ</a>
          </nav>
        }
        actions={
          <>
            <WorkspaceLink
              className="landing-header-link"
              onNavigate={onNavigate}
              route="/student"
            >
              Học sinh
            </WorkspaceLink>
            <WorkspaceLink
              className="landing-button landing-button-primary landing-header-button"
              onNavigate={onNavigate}
              route="/teacher"
            >
              Giáo viên
            </WorkspaceLink>
          </>
        }
      />

      <main id="landing-main">
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-hero-content">
            <p className="landing-kicker">
              Teacher-first · Evidence-led · Offline-ready
            </p>
            <h1 id="landing-title">AiLearn</h1>
            <p className="landing-hero-promise">
              Thấy đúng chỗ vướng. Dạy đúng nơi cần.
            </p>
            <p className="landing-hero-copy">
              AiLearn biến những bài làm ngắn thành bằng chứng dễ hiểu, giúp
              giáo viên biết nên dạy lại điều gì, hỗ trợ ai trước và cần kiểm
              chứng thêm ở đâu.
            </p>
            <div className="landing-hero-actions">
              <WorkspaceLink
                className="landing-button landing-button-light"
                onNavigate={onNavigate}
                route="/teacher"
              >
                Mở không gian giáo viên
              </WorkspaceLink>
              <WorkspaceLink
                className="landing-button landing-button-ghost"
                onNavigate={onNavigate}
                route="/student"
              >
                Xem trải nghiệm học sinh
              </WorkspaceLink>
            </div>
          </div>

          <div className="landing-hero-signal" aria-hidden="true">
            <span className="landing-signal-runner">
              <i />
            </span>

            <span className="landing-signal-scene signal-scene-observe">
              <i className="landing-search-glass" />
              <i className="landing-search-target target-one" />
              <i className="landing-search-target target-two" />
              <i className="landing-search-target target-three" />
            </span>
            <span className="landing-signal-scene signal-scene-trace">
              <i />
              <i />
              <i />
              <i />
            </span>
            <span className="landing-signal-scene signal-scene-adapt">
              <i />
              <i />
              <i />
              <i />
            </span>

            <span className="landing-signal-core">
              <img src="/brand/ailearn-mascot.webp" alt="" />
              <i className="firefly-tail-light" />
            </span>
            <span className="landing-signal-label signal-one">
              <b>Quan sát</b>
              <small>Quét dấu vết</small>
            </span>
            <span className="landing-signal-label signal-two">
              <b>Truy vết</b>
              <small>Lần theo nguyên nhân</small>
            </span>
            <span className="landing-signal-label signal-three">
              <b>Thích ứng</b>
              <small>Nắn lại đường học</small>
            </span>
          </div>

          <ul
            className="landing-hero-principles"
            aria-label="Nguyên tắc AiLearn"
          >
            <li>Không gắn nhãn học sinh</li>
            <li>AI đề xuất, giáo viên quyết định</li>
            <li>Chưa đồng bộ không có nghĩa là chưa đạt</li>
          </ul>
        </section>

        <section
          className="landing-loop"
          id="learning-loop"
          aria-labelledby="loop-title"
        >
          <div className="landing-section-heading">
            <p className="landing-kicker landing-kicker-dark">
              Một vòng học khép kín
            </p>
            <h2 id="loop-title">
              Mỗi đầu vào đều đi&nbsp;ra bằng một thay đổi có thể kiểm chứng.
            </h2>
            <p>
              Nội dung trước lớp đi vào dưới nhiều dạng. Qua mỗi chặng, AiLearn
              tạo ra một đầu ra mà giáo viên có thể xem, sửa và kiểm chứng.
            </p>
          </div>

          <div className="landing-loop-journey">
            <div className="landing-loop-inputs">
              <div>
                <span>Đầu vào trước lớp</span>
                <strong>Nội dung đã có</strong>
              </div>
              <ul aria-label="Nguồn học liệu đầu vào">
                {learningInputs.map((input) => (
                  <li key={input.label}>
                    <span
                      className="landing-loop-source-glyph"
                      aria-hidden="true"
                    >
                      {input.glyph}
                    </span>
                    <strong>{input.label}</strong>
                    <i
                      className="landing-loop-source-traveler"
                      style={{ animationDelay: input.delay }}
                      aria-hidden="true"
                    >
                      {input.glyph}
                    </i>
                  </li>
                ))}
              </ul>
              <small>Dữ liệu gốc, chưa vội kết luận</small>
            </div>

            <ol className="landing-learning-flow">
              {learningLoop.map((step) => (
                <li key={step.number}>
                  <div className="landing-learning-stage">
                    <span>{step.number}</span>
                    <small>{step.label}</small>
                  </div>
                  <div className="landing-learning-copy">
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </div>
                  <div className="landing-loop-output">
                    <span>Đầu ra</span>
                    <strong>{step.output}</strong>
                  </div>
                  <i className="landing-loop-transfer" aria-hidden="true">
                    <span>{step.signal}</span>
                  </i>
                </li>
              ))}
            </ol>

            <div className="landing-loop-impact" aria-label="Kết quả sau lớp">
              <div className="landing-loop-impact-heading">
                <span>Kết quả sau lớp</span>
                <strong>Thấy được điều đã đổi</strong>
              </div>
              <ul>
                {learningOutcomes.map((outcome) => (
                  <li key={outcome.title}>
                    <span aria-hidden="true">{outcome.glyph}</span>
                    <div>
                      <strong>{outcome.title}</strong>
                      <small>{outcome.detail}</small>
                    </div>
                    <i
                      className="landing-loop-result-traveler"
                      aria-hidden="true"
                    >
                      {outcome.glyph}
                    </i>
                  </li>
                ))}
              </ul>
            </div>

            <div className="landing-loop-return">
              <span className="landing-loop-return-line" aria-hidden="true">
                <i />
              </span>
              <div className="landing-loop-return-copy">
                <img src="/brand/ailearn-mascot.webp" alt="" />
                <p>
                  <strong>Kết quả trở thành minh chứng mới.</strong>
                  Vòng tiếp theo bắt đầu từ dữ liệu vừa được kiểm chứng, không
                  từ một kết luận cũ.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          className="landing-technology"
          id="technology"
          aria-labelledby="technology-title"
        >
          <div className="landing-technology-intro">
            <div>
              <p className="landing-kicker">Công nghệ đang chạy</p>
              <h2 id="technology-title">
                Không đoán mò. AiLearn lần theo từng dấu vết học tập.
              </h2>
            </div>
            <p>
              Kiến trúc hybrid nối dữ liệu chương trình, dấu vết làm bài và
              chính sách sư phạm thành một vòng khép kín: hiểu chỗ vướng, tìm
              nguyên nhân rồi đưa ra cách học để vá đúng gap.
            </p>
          </div>

          <div className="landing-tech-system">
            <aside className="landing-tech-sources" aria-label="Nguồn dữ liệu">
              <span>Nguồn vào đã định danh</span>
              <ul>
                <li>
                  <strong>Chương trình GDPT 2018</strong>
                  <small>Đồ thị kỹ năng Toán 7 và quan hệ kiến thức nền</small>
                </li>
                <li>
                  <strong>Ngân hàng câu hỏi và lỗi quan niệm</strong>
                  <small>Câu hỏi, đáp án và phương án nhiễu có mô tả rõ</small>
                </li>
                <li>
                  <strong>Dòng minh chứng học tập</strong>
                  <small>
                    Hợp đồng dữ liệu chung, dữ liệu demo được ẩn danh
                  </small>
                </li>
                <li>
                  <strong>Bộ ca kiểm thử chuẩn</strong>
                  <small>
                    Kịch bản chuẩn để kiểm tra lại chất lượng chẩn đoán
                  </small>
                </li>
              </ul>
            </aside>

            <ol className="landing-tech-engine">
              {technologyStages.map((stage) => (
                <li key={stage.title}>
                  <div className="landing-tech-node" aria-hidden="true">
                    <span>{stage.number}</span>
                    <small>{stage.shortLabel}</small>
                  </div>
                  <div className="landing-tech-copy">
                    <span>{stage.label}</span>
                    <h3>{stage.title}</h3>
                    <strong className="landing-tech-outcome">
                      {stage.outcome}
                    </strong>
                    <p>{stage.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="landing-tech-stack">
            <div className="landing-tech-stack-heading">
              <div>
                <span>Stack đang chạy</span>
                <h3>Từ trình duyệt đến hạ tầng triển khai.</h3>
              </div>
              <div>
                <p>
                  Kiến trúc hybrid giữ việc học tiếp diễn khi mạng yếu, rồi mở
                  rộng từng lớp độc lập khi số trường và lượng dữ liệu tăng.
                </p>
                <div className="landing-runtime-legend" aria-label="Chú giải">
                  <span>
                    <i aria-hidden="true" /> Mở rộng theo quy mô
                  </span>
                </div>
              </div>
            </div>

            <div
              className="landing-runtime-map"
              aria-label="Sơ đồ kiến trúc AiLearn theo từng tầng"
            >
              <article className="landing-runtime-node landing-runtime-node--wide">
                <div className="landing-runtime-copy">
                  <span className="landing-runtime-layer">
                    01 · Tầng thiết bị
                  </span>
                  <h4>Ứng dụng giáo viên và học sinh</h4>
                  <p>
                    Ứng dụng React chạy ngay trên trình duyệt. Lớp offline mở
                    rộng giữ Lesson Pack và mô hình BKT-lite cục bộ luôn sẵn
                    sàng.
                  </p>
                </div>
                <RuntimeTechnologyMarks technologies={runtimeTechnology.pwa} />
                <div className="landing-runtime-offline">
                  <span>Mở rộng offline</span>
                  <ul className="landing-runtime-details">
                    <li>Workbox</li>
                    <li>IndexedDB / Dexie</li>
                    <li>Outbox đồng bộ</li>
                    <li>Lesson Pack</li>
                    <li>BKT-lite cục bộ</li>
                  </ul>
                </div>
              </article>

              <div className="landing-runtime-branch" aria-hidden="true">
                <span>LAN khi offline · Edge khi online</span>
                <i className="landing-runtime-particle landing-runtime-particle--left" />
                <i className="landing-runtime-particle landing-runtime-particle--right" />
              </div>

              <div className="landing-runtime-pair">
                <article className="landing-runtime-node landing-runtime-node--planned">
                  <div className="landing-runtime-copy">
                    <span className="landing-runtime-layer">
                      02A · Tầng trường học
                    </span>
                    <h4>School Hub cục bộ</h4>
                    <p>
                      FastAPI, SQLite WAL, Caddy và Sync Worker chạy trong LAN;
                      lớp học không cần Internet để tiếp tục.
                    </p>
                  </div>
                  <RuntimeTechnologyMarks
                    technologies={runtimeTechnology.localHub}
                  />
                </article>

                <article className="landing-runtime-node">
                  <div className="landing-runtime-copy">
                    <span className="landing-runtime-layer">
                      02B · Tầng phân phối web
                    </span>
                    <h4>Vercel Edge</h4>
                    <p>
                      CDN đưa ứng dụng tới gần người dùng; tường lửa ứng dụng và
                      giới hạn tần suất bảo vệ lối vào công khai.
                    </p>
                  </div>
                  <RuntimeTechnologyMarks
                    technologies={runtimeTechnology.edge}
                  />
                </article>
              </div>

              <div className="landing-runtime-merge" aria-hidden="true">
                <span>Đồng bộ khi có Internet</span>
                <i className="landing-runtime-particle landing-runtime-particle--left" />
                <i className="landing-runtime-particle landing-runtime-particle--right" />
              </div>

              <article className="landing-runtime-node landing-runtime-node--cloud">
                <div className="landing-runtime-copy">
                  <span className="landing-runtime-layer">
                    03 · Tầng dịch vụ
                  </span>
                  <h4>FastAPI Cloud API</h4>
                  <p>
                    Hợp đồng Pydantic và khóa chống ghi trùng giữ mỗi lần đồng
                    bộ nhất quán; Railway có thể mở rộng thành 2 bản chạy, cân
                    bằng tải, retry và circuit breaker.
                  </p>
                </div>
                <RuntimeTechnologyMarks
                  technologies={runtimeTechnology.cloudApi}
                />
              </article>

              <div
                className="landing-runtime-branch landing-runtime-branch--data"
                aria-hidden="true"
              >
                <span>Dữ liệu đồng bộ · Tác vụ bất đồng bộ</span>
                <i className="landing-runtime-particle landing-runtime-particle--left" />
                <i className="landing-runtime-particle landing-runtime-particle--right" />
              </div>

              <div className="landing-runtime-pair landing-runtime-pair--data">
                <article className="landing-runtime-node">
                  <div className="landing-runtime-copy">
                    <span className="landing-runtime-layer">
                      04A · Tầng dữ liệu
                    </span>
                    <h4>Supabase PostgreSQL</h4>
                    <p>
                      Auth, phân quyền theo hàng, Storage, pgvector và bảng
                      Skill Graph lưu dấu vết học tập bền vững. Neo4j là nhánh
                      graph chuyên biệt khi quy mô cần đến.
                    </p>
                  </div>
                  <RuntimeTechnologyMarks
                    technologies={runtimeTechnology.data}
                  />
                </article>

                <article className="landing-runtime-node">
                  <div className="landing-runtime-copy">
                    <span className="landing-runtime-layer">
                      04B · Tầng xử lý nền
                    </span>
                    <h4>Async Workers</h4>
                    <p>
                      Redis hoặc Valkey, RQ và Python Workers xử lý lịch chạy,
                      retry cùng hàng đợi lỗi mà không chặn luồng học chính.
                    </p>
                  </div>
                  <ul className="landing-runtime-details landing-runtime-details--strong">
                    <li>Redis / Valkey</li>
                    <li>RQ</li>
                    <li>Scheduler</li>
                    <li>Hàng đợi lỗi</li>
                  </ul>
                </article>
              </div>

              <div
                className="landing-runtime-merge landing-runtime-merge--ai"
                aria-hidden="true"
              >
                <i className="landing-runtime-particle landing-runtime-particle--left" />
                <i className="landing-runtime-particle landing-runtime-particle--right" />
              </div>

              <article className="landing-runtime-node landing-runtime-node--ai">
                <div className="landing-runtime-copy">
                  <span className="landing-runtime-layer">
                    05 · Tầng trí tuệ học tập
                  </span>
                  <h4>AI Control Plane</h4>
                  <p>
                    Ba engine giữ chẩn đoán và quyết định học tập có thể kiểm
                    tra; Hybrid RAG và LLM có guardrail là lớp làm giàu nội dung
                    có thể bật độc lập.
                  </p>
                </div>
                <ol className="landing-runtime-engines">
                  <li>
                    <span>01</span>
                    <strong>Diagnostic Intelligence</strong>
                    <small>Chẩn đoán nguyên nhân gốc</small>
                  </li>
                  <li>
                    <span>02</span>
                    <strong>Teacher Orchestration</strong>
                    <small>Điều phối quyết định của giáo viên</small>
                  </li>
                  <li>
                    <span>03</span>
                    <strong>Personalized Remediation</strong>
                    <small>Cá nhân hóa lộ trình vá gap</small>
                  </li>
                </ol>
              </article>

              <div className="landing-runtime-flow" aria-hidden="true" />

              <article className="landing-runtime-control">
                <div>
                  <span className="landing-runtime-layer">
                    06 · Kiểm soát xuyên suốt
                  </span>
                  <h4>Một lớp bảo vệ cho toàn hệ thống</h4>
                </div>
                <ul>
                  <li>
                    <strong>Guardrail</strong>
                    <span>
                      Kiểm tra schema · chính sách · SymPy · giáo viên duyệt
                    </span>
                  </li>
                  <li>
                    <strong>Quan sát hệ thống</strong>
                    <span>OpenTelemetry · Grafana Cloud · Sentry</span>
                  </li>
                  <li>
                    <strong>Quản trị vận hành</strong>
                    <span>
                      Nhật ký kiểm toán · phiên bản · sao lưu · CI/CD · k6
                    </span>
                  </li>
                </ul>
              </article>
            </div>
          </div>

          <p className="landing-tech-boundary">
            <i aria-hidden="true" />
            <span>
              <strong>Ranh giới AI:</strong> chẩn đoán, xếp hạng và chuyển trạng
              thái vẫn chạy khi không có LLM. Nếu lớp làm giàu nội dung lỗi hoặc
              timeout, AiLearn quay về template cục bộ.
            </span>
          </p>

          <section className="landing-ai-core" aria-labelledby="ai-core-title">
            <div className="landing-ai-core-heading">
              <div>
                <p className="landing-kicker">
                  Lõi thuật toán có thể kiểm chứng
                </p>
                <h2 id="ai-core-title">
                  Ba engine AI ra quyết định như thế nào?
                </h2>
              </div>
              <div>
                <p>
                  Lõi AiLearn không giao quyết định học tập cho một câu trả lời
                  sinh tự do. Cùng một dòng minh chứng luôn tạo ra cùng một kết
                  quả; mọi điểm số đều có thành phần, ngưỡng và dấu vết để kiểm
                  tra lại.
                </p>
                <ul aria-label="Nguyên tắc lõi thuật toán">
                  <li>Quy tắc xác định</li>
                  <li>Dẫn nguồn bằng minh chứng</li>
                  <li>Giáo viên giữ quyền quyết định</li>
                </ul>
              </div>
            </div>

            <div className="landing-ai-properties">
              <p className="landing-ai-properties-label">
                Năm thuộc tính khiến lõi này đáng tin
              </p>
              <ul aria-label="Thuộc tính kỹ thuật của lõi AiLearn">
                {coreTrustProperties.map((property) => (
                  <li
                    className={`landing-ai-property landing-ai-property--${property.tone}`}
                    key={property.tag}
                  >
                    <span className="landing-ai-property-tag">
                      {property.tag}
                    </span>
                    <strong>{property.title}</strong>
                    <p>{property.detail}</p>
                    <code>{property.proof}</code>
                  </li>
                ))}
              </ul>
            </div>

            <ol className="landing-ai-engine-list">
              <li className="landing-ai-engine landing-ai-engine--diagnostic">
                <article>
                  <div className="landing-ai-engine-heading">
                    <span className="landing-ai-engine-number">01</span>
                    <div>
                      <p>Diagnostic Intelligence</p>
                      <h3>
                        Từ dấu vết rời rạc đến giả thuyết nguyên nhân gốc.
                      </h3>
                      <p>
                        Không chỉ đếm số câu sai. Engine cập nhật mức thành thạo
                        theo kỹ năng, đọc phương án nhiễu như một mẫu lỗi rồi
                        lần ngược quan hệ tiên quyết.
                      </p>
                    </div>
                  </div>

                  <div className="landing-ai-diagnostic-flow">
                    {diagnosticFlow.map((step, index) => (
                      <div key={step.label}>
                        <span aria-hidden="true">{step.glyph}</span>
                        <strong>{step.label}</strong>
                        <small>{step.detail}</small>
                        {index < diagnosticFlow.length - 1 ? (
                          <i aria-hidden="true" />
                        ) : null}
                      </div>
                    ))}
                  </div>

                  <div className="landing-ai-diagnostic-grid">
                    <section aria-labelledby="mastery-score-title">
                      <div className="landing-ai-subheading">
                        <span>Điểm 01</span>
                        <h4 id="mastery-score-title">Mức thành thạo</h4>
                      </div>
                      <code>
                        P(thành thạo) = (1 + số câu đúng) / (2 + tổng lần thử)
                      </code>
                      <p>
                        Prior Beta(1,1) tránh kết luận cực đoan khi dữ liệu còn
                        ít. Mỗi câu đúng tăng α, mỗi câu sai tăng β; dưới mốc
                        <strong> 0,70</strong> và có lỗi quan sát được thì kỹ
                        năng được xem là còn hổng.
                      </p>
                      <div className="landing-ai-score-example">
                        <span>Ví dụ</span>
                        <strong>3 đúng / 5 lần → 4/7 = 0,57</strong>
                        <small>Chưa đạt mốc thành thạo 0,70</small>
                      </div>
                    </section>

                    <section aria-labelledby="confidence-score-title">
                      <div className="landing-ai-subheading">
                        <span>Điểm 02</span>
                        <h4 id="confidence-score-title">
                          Độ tin cậy chẩn đoán
                        </h4>
                      </div>
                      <code>C = chặn(0,20 + 0,03N + 0,40 × S/(S + K))</code>
                      <p>
                        N là số minh chứng; S và K là số dấu vết ủng hộ và phản
                        bác nguyên nhân đứng đầu. Điểm luôn nằm trong 0–1 và bị
                        hạ theo thang riêng khi engine chọn hỏi thêm.
                      </p>
                      <div className="landing-ai-score-example">
                        <span>Ví dụ</span>
                        <strong>N=6 · S=3 · K=1 → C=0,68</strong>
                        <small>Tăng khi có thêm dữ liệu nhất quán</small>
                      </div>
                    </section>
                  </div>

                  <div className="landing-ai-rule-strip">
                    <div>
                      <span>Truy nguyên nhân</span>
                      <p>
                        Mẫu lỗi chiếm từ <strong>75%</strong> được ưu tiên; nếu
                        chưa có mẫu trội, engine xếp kỹ năng yếu theo vị trí
                        trên đồ thị và số nhánh phía sau cùng đang sai.
                      </p>
                    </div>
                    <div>
                      <span>Biết lúc chưa đủ chắc</span>
                      <p>
                        Ít hơn <strong>5 minh chứng</strong>, phương án không đủ
                        nghĩa hoặc bằng chứng ủng hộ/phản bác gần cân bằng sẽ
                        trả về <strong>cần xác nhận thêm</strong>.
                      </p>
                    </div>
                    <div>
                      <span>Ranh giới dữ liệu</span>
                      <p>
                        Mức tự tin học sinh tự khai được lưu cùng minh chứng,
                        nhưng <strong>chưa tham gia</strong> mastery hay
                        confidence trong phiên bản hiện tại.
                      </p>
                    </div>
                  </div>
                </article>
              </li>

              <li className="landing-ai-engine landing-ai-engine--teacher">
                <article>
                  <div className="landing-ai-engine-heading">
                    <span className="landing-ai-engine-number">02</span>
                    <div>
                      <p>Teacher Orchestration</p>
                      <h3>
                        Biến chẩn đoán cá nhân thành ưu tiên có thể dạy trong
                        lớp.
                      </h3>
                      <p>
                        Engine không xếp hạng học sinh. Nó xếp hạng nhu cầu dạy,
                        gom những em đang cần cùng một can thiệp và để riêng các
                        trường hợp chưa đủ bằng chứng.
                      </p>
                    </div>
                  </div>

                  <div className="landing-ai-priority-formula">
                    <code>Điểm ưu tiên = 0,40P + 0,25G + 0,20U + 0,15C</code>
                    <div className="landing-ai-weight-bar" aria-hidden="true">
                      {teacherPriorityWeights.map((weight) => (
                        <i
                          key={weight.label}
                          className={`landing-ai-weight--${weight.tone}`}
                          style={{ flexBasis: weight.value }}
                        />
                      ))}
                    </div>
                    <dl>
                      {teacherPriorityWeights.map((weight) => (
                        <div key={weight.label}>
                          <dt>
                            <strong>{weight.value}</strong> {weight.label}
                          </dt>
                          <dd>{weight.detail}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>

                  <div className="landing-ai-teacher-detail">
                    <div>
                      <span>P · Độ phổ biến</span>
                      <strong>
                        Số học sinh cùng nguyên nhân / số đã chẩn đoán
                      </strong>
                    </div>
                    <div>
                      <span>G · Ảnh hưởng đồ thị</span>
                      <strong>
                        (Số kỹ năng hậu duệ + 1) / tổng kỹ năng, tối đa 1
                      </strong>
                    </div>
                    <div>
                      <span>U · Cấp thiết</span>
                      <strong>
                        1,00 đích bài · 0,85 tiên quyết · 0,50 còn lại
                      </strong>
                    </div>
                    <div>
                      <span>C · Độ tin cậy</span>
                      <strong>
                        Trung bình confidence của nhóm đang bị ảnh hưởng
                      </strong>
                    </div>
                  </div>

                  <div className="landing-ai-teacher-output">
                    <span>Điểm ưu tiên</span>
                    <i aria-hidden="true" />
                    <span>3–5 nhóm nhu cầu</span>
                    <i aria-hidden="true" />
                    <span>Giáo án 45 phút</span>
                    <i aria-hidden="true" />
                    <strong>Giáo viên duyệt</strong>
                  </div>
                </article>
              </li>

              <li className="landing-ai-engine landing-ai-engine--remediation">
                <article>
                  <div className="landing-ai-engine-heading">
                    <span className="landing-ai-engine-number">03</span>
                    <div>
                      <p>Personalized Remediation</p>
                      <h3>
                        Vá đúng lỗ hổng, đổi cách biểu diễn và kiểm chứng chuyển
                        giao.
                      </h3>
                      <p>
                        Một câu đúng chưa kết thúc lộ trình. Học sinh phải đi
                        qua đủ chuỗi sửa hổng, luyện độc lập và bài mới trước
                        khi kết quả được ghi lại thành minh chứng.
                      </p>
                    </div>
                  </div>

                  <ol className="landing-ai-remediation-path">
                    {remediationSequence.map((step) => (
                      <li key={step.number}>
                        <span>{step.number}</span>
                        <strong>{step.label}</strong>
                        <small>{step.state}</small>
                        <i aria-hidden="true" />
                      </li>
                    ))}
                  </ol>

                  <div className="landing-ai-adaptation-grid">
                    <section>
                      <span>Khi câu trả lời tiếp tục sai</span>
                      <ol>
                        <li>
                          <strong>1.</strong> Đổi biểu diễn theo policy: chữ →
                          bảng → sơ đồ.
                        </li>
                        <li>
                          <strong>2.</strong> Đã thử hết biểu diễn thì lùi một
                          kỹ năng tiên quyết trên graph.
                        </li>
                        <li>
                          <strong>3.</strong> Hết đường lùi và sai liên tiếp 3
                          lần thì chuyển giáo viên.
                        </li>
                      </ol>
                    </section>

                    <section>
                      <span>Cách chọn nội dung phù hợp</span>
                      <code>
                        8·kỹ năng + 4·lỗi + 2·biểu diễn + 1·state + 1·bước
                      </code>
                      <p>
                        Template có tổng điểm cao nhất được chọn; nếu bằng điểm,
                        thứ tự dữ liệu quyết định. LLM chỉ được phép làm giàu
                        cách diễn đạt và lỗi của LLM luôn rơi về template cục
                        bộ.
                      </p>
                    </section>
                  </div>

                  <footer className="landing-ai-remediation-loop">
                    <span>Bài chuyển giao</span>
                    <i aria-hidden="true" />
                    <span>Kết quả đúng / sai</span>
                    <i aria-hidden="true" />
                    <strong>Ghi lại EvidenceEventV1 và chẩn đoán lại</strong>
                  </footer>
                </article>
              </li>
            </ol>

            <footer className="landing-ai-core-boundary">
              <span>Điểm khác biệt</span>
              <p>
                AiLearn dùng mô hình xác suất nhỏ, đồ thị chương trình và state
                machine để giữ quyết định cốt lõi có thể tái hiện. LLM có thể
                giúp diễn đạt tự nhiên hơn, nhưng không được tự ý đổi mastery,
                nguyên nhân gốc, nhóm lớp hay trạng thái lộ trình.
              </p>
            </footer>
          </section>
        </section>

        <section
          className="landing-audiences"
          aria-label="AiLearn cho giáo viên và học sinh"
        >
          <article id="for-teachers">
            <p className="landing-kicker">Dành cho giáo viên</p>
            <h2>Ba quyết định rõ ràng trước giờ lên lớp.</h2>
            <p>
              Xem nguyên nhân nổi bật của cả lớp, học sinh cần ưu tiên và những
              trường hợp chưa đủ bằng chứng. Chỉnh nhóm, hoạt động và giáo án
              trước khi duyệt.
            </p>
            <ul>
              <li>Bằng chứng và độ chắc chắn luôn đi cùng đề xuất</li>
              <li>Nhóm theo nhu cầu hiện tại, không đóng khung năng lực</li>
              <li>Giáo viên giữ quyền sửa, bác bỏ và phê duyệt</li>
            </ul>
            <WorkspaceLink
              className="landing-text-link landing-audience-cta landing-audience-cta-teacher"
              onNavigate={onNavigate}
              route="/teacher"
            >
              <span>Vào dashboard giáo viên</span>
              <i aria-hidden="true">→</i>
            </WorkspaceLink>
          </article>

          <div className="landing-audience-firefly" aria-hidden="true">
            <img src="/brand/ailearn-mascot.webp" alt="" />
            <span className="firefly-tail-light" />
            <span className="firefly-light-beam" />
          </div>

          <article id="for-students">
            <p className="landing-kicker">Dành cho học sinh</p>
            <h2>Một bước vừa đủ cho chỗ em đang cần.</h2>
            <p>
              Làm bài ngắn, nhận gợi ý đúng mức và tiếp tục theo lộ trình 8-15
              phút. Việc học có thể dừng giữa chừng, lưu trên máy và đồng bộ khi
              có mạng trở lại.
            </p>
            <ul>
              <li>Không xếp hạng và không dùng nhãn tiêu cực</li>
              <li>Giải thích mục tiêu của từng bước học</li>
              <li>Kiểm tra lại bằng tình huống mới, không chỉ lặp bài mẫu</li>
            </ul>
            <WorkspaceLink
              className="landing-text-link landing-audience-cta landing-audience-cta-student"
              onNavigate={onNavigate}
              route="/student"
            >
              <span>Bắt đầu trải nghiệm học sinh</span>
              <i aria-hidden="true">→</i>
            </WorkspaceLink>
          </article>
        </section>

        <section className="landing-evidence" aria-labelledby="evidence-title">
          <div className="landing-section-heading">
            <p className="landing-kicker landing-kicker-dark">
              Đồ thị chẩn đoán nhiều-nhiều
            </p>
            <h2 id="evidence-title">
              Insight chỉ có ý nghĩa khi dẫn tới hành động.
            </h2>
            <p>
              AiLearn mã hóa quan hệ giữa người học, bài làm, mẫu lỗi, kỹ năng
              nền và cách hỗ trợ. Mỗi insight phải có đường dẫn tới một bước
              kiểm chứng hoặc hành động của giáo viên.
            </p>
          </div>

          <figure className="landing-insight-map">
            <figcaption>
              <div>
                <span>Bản đồ quan hệ học tập</span>
                <strong>
                  Một dấu vết. Nhiều giả thuyết. Nhiều đường hành động.
                </strong>
              </div>
              <small>Đường sáng là quan hệ đang được kiểm chứng</small>
            </figcaption>

            <div
              className="landing-insight-canvas"
              aria-label="Đồ thị minh họa quan hệ giữa học sinh, bài làm, thể loại lỗi, cách định vị và hành động dạy học"
            >
              <svg
                className="landing-insight-edges"
                viewBox="0 0 1000 620"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                {insightGraphEdges.map((edge, index) => (
                  <path
                    className={`landing-insight-edge landing-insight-edge--${edge.tone}`}
                    d={edge.d}
                    key={`${edge.d}-${index}`}
                  />
                ))}
                {insightGraphSignals.map((signal) => (
                  <circle
                    className="landing-insight-signal"
                    fill={signal.color}
                    key={signal.path}
                    r="4"
                  >
                    <animateMotion
                      begin={signal.begin}
                      dur="5.4s"
                      path={signal.path}
                      repeatCount="indefinite"
                    />
                  </circle>
                ))}
              </svg>

              <div className="landing-insight-groups">
                {insightGraphGroups.map((group) => (
                  <section
                    className={`landing-insight-group landing-insight-group--${group.id}`}
                    key={group.id}
                    aria-labelledby={`insight-group-${group.id}`}
                  >
                    <h3 id={`insight-group-${group.id}`}>{group.label}</h3>
                    {group.nodes.map((node) => (
                      <div
                        className="landing-insight-node"
                        key={node.label}
                        style={
                          {
                            "--insight-node-y": `${node.y}%`,
                          } as React.CSSProperties
                        }
                      >
                        <strong>{node.label}</strong>
                      </div>
                    ))}
                  </section>
                ))}
              </div>
            </div>

            <footer className="landing-insight-footnote">
              <strong>Graph không đóng khung học sinh.</strong>
              <span>
                Quan hệ thay đổi theo minh chứng mới; giáo viên quyết định hành
                động cuối cùng.
              </span>
            </footer>
          </figure>
        </section>

        <section
          className="landing-team"
          id="team"
          aria-labelledby="team-title"
        >
          <div className="landing-team-heading">
            <div>
              <p className="landing-kicker landing-kicker-dark">
                Đội ngũ AiLearn
              </p>
              <h2 id="team-title">Những người cùng thắp sáng AiLearn.</h2>
            </div>
            <p>
              Sáu thành viên kết hợp vận hành, công nghệ và nghiên cứu AI để đưa
              một ý tưởng giáo dục thành trải nghiệm có thể dùng trong lớp học.
            </p>
          </div>

          <div className="landing-team-list">
            {teamMembers.map((member, index) => (
              <figure key={member.name}>
                <div className="landing-team-portrait">
                  <img
                    src={member.image}
                    alt={`Chân dung ${member.name}`}
                    loading="lazy"
                  />
                </div>
                <figcaption>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{member.name}</h3>
                    <p>{member.role}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="landing-trust" aria-labelledby="trust-title">
          <div className="landing-trust-firefly">
            <img
              src="/brand/ailearn-mascot.webp"
              alt="Linh vật ánh sáng của AiLearn"
            />
            <span className="firefly-tail-light" aria-hidden="true" />
          </div>
          <div>
            <p className="landing-kicker landing-kicker-dark">
              Học được cả khi mạng yếu
            </p>
            <h2 id="trust-title">
              Kết nối chập chờn không được biến thành đánh giá sai.
            </h2>
            <p>
              Nội dung cốt lõi được lưu trên thiết bị, câu trả lời được xếp hàng
              để đồng bộ và mọi trạng thái chờ đều được hiển thị minh bạch.
            </p>
          </div>
          <WorkspaceLink
            className="landing-button landing-button-primary"
            onNavigate={onNavigate}
            route="/student"
          >
            Học thử với AiLearn
          </WorkspaceLink>
        </section>
      </main>

      <footer className="landing-footer">
        <div>
          <div className="landing-footer-brand">
            <img src="/brand/ailearn-mascot.webp" alt="" />
            <strong>AiLearn</strong>
          </div>
          <p>Trợ giảng thích ứng song hành cùng giáo viên Việt Nam.</p>
        </div>
        <div className="landing-footer-links">
          <a className="landing-text-link" href="#technology">
            Công nghệ
          </a>
          <a className="landing-text-link" href="#team">
            Đội ngũ
          </a>
          <WorkspaceLink
            className="landing-text-link"
            onNavigate={onNavigate}
            route="/teacher"
          >
            Không gian giáo viên
          </WorkspaceLink>
          <WorkspaceLink
            className="landing-text-link"
            onNavigate={onNavigate}
            route="/student"
          >
            Trải nghiệm học sinh
          </WorkspaceLink>
        </div>
      </footer>
    </div>
  );
}
