import "./landing.css";

import { AppHeader } from "@/components/navigation/AppHeader";

type WorkspaceRoute = "/teacher" | "/student";

type LandingPageProps = {
  onNavigate: (path: WorkspaceRoute) => void;
};

const learningLoop = [
  {
    number: "01",
    label: "Trước lớp",
    title: "Thu đúng minh chứng",
    description:
      "Bài chuẩn bị 3-7 phút kiểm tra mục tiêu, kỹ năng tiền đề và mức tự tin của học sinh.",
  },
  {
    number: "02",
    label: "Hiểu lớp",
    title: "Tìm nguyên nhân gốc",
    description:
      "AiLearn đối chiếu các mẫu sai và chỉ hỏi thêm khi cần phân biệt những giả thuyết cạnh tranh.",
  },
  {
    number: "03",
    label: "Trong lớp",
    title: "Giáo viên chốt cách dạy",
    description:
      "Bằng chứng được chuyển thành ưu tiên, nhóm tạm thời và giáo án nháp để giáo viên kiểm tra.",
  },
  {
    number: "04",
    label: "Sau lớp",
    title: "Sửa và kiểm chứng lại",
    description:
      "Lộ trình ngắn kết thúc bằng bài chuyển giao để xác nhận tiến bộ có bền và độc lập hay không.",
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
              Từ một câu trả lời đến một quyết định dạy học.
            </h2>
            <p>
              Mỗi bước của AiLearn đều tạo ra một đầu ra có thể kiểm tra, thay
              vì chỉ đưa thêm điểm số hoặc một kết luận khó giải thích.
            </p>
          </div>

          <ol className="landing-loop-list">
            {learningLoop.map((step) => (
              <li key={step.number}>
                <div className="landing-loop-index">
                  <span>{step.number}</span>
                  <small>{step.label}</small>
                </div>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
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
                    <i aria-hidden="true" /> Lõi đang vận hành
                  </span>
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
              <article className="landing-runtime-node landing-runtime-node--wide landing-runtime-node--live">
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

                <article className="landing-runtime-node landing-runtime-node--live">
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
              </div>

              <article className="landing-runtime-node landing-runtime-node--cloud landing-runtime-node--live">
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
              </div>

              <div className="landing-runtime-pair landing-runtime-pair--data">
                <article className="landing-runtime-node landing-runtime-node--live">
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

                <article className="landing-runtime-node landing-runtime-node--planned">
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

              <div className="landing-runtime-flow" aria-hidden="true" />

              <article className="landing-runtime-node landing-runtime-node--ai landing-runtime-node--live">
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

              <article className="landing-runtime-control landing-runtime-node--planned">
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
              Phân loại lỗi, không gắn nhãn
            </p>
            <h2 id="evidence-title">
              Insight chỉ có ý nghĩa khi dẫn tới hành động.
            </h2>
            <p>
              Cùng một đáp án sai có thể đến từ nhầm khái niệm, lỗi tính toán,
              khoảng trống biểu diễn hoặc đơn giản là chưa đủ bằng chứng.
              AiLearn định vị từng khả năng trước khi đề xuất cách hỗ trợ.
            </p>
          </div>

          <figure className="landing-misconception-lab">
            <figcaption>
              <div>
                <span>Ca minh họa · Toán 7</span>
                <strong>Một phương án sai đi qua hệ thống như thế nào?</strong>
              </div>
              <small>Bộ phân loại đang dùng · dữ liệu tổng hợp</small>
            </figcaption>

            <div className="landing-misconception-grid">
              <section
                className="landing-taxonomy"
                aria-labelledby="taxonomy-title"
              >
                <span className="landing-lab-label">Định nghĩa lỗi sai</span>
                <h3 id="taxonomy-title">Bốn nhóm trong dữ liệu mẫu</h3>
                <ul>
                  <li className="is-active">
                    <strong>Nhầm tỉ lệ nghịch thành tỉ lệ thuận</strong>
                    <p>
                      Áp dụng y = kx cho tình huống tỉ lệ nghịch; nghĩ x tăng
                      thì y cũng tăng.
                    </p>
                  </li>
                  <li>
                    <strong>Lỗi tính toán</strong>
                    <p>Chọn đúng mô hình nhưng nhân, chia hoặc rút gọn sai.</p>
                  </li>
                  <li>
                    <strong>Không dịch được đề bài thành quan hệ</strong>
                    <p>Làm được với công thức, nhưng vướng khi đọc lời văn.</p>
                  </li>
                  <li>
                    <strong>Bằng chứng không đủ hoặc mâu thuẫn</strong>
                    <p>Hệ thống dừng kết luận và chủ động yêu cầu kiểm tra.</p>
                  </li>
                </ul>
              </section>

              <section
                className="landing-location-trace"
                aria-labelledby="location-title"
              >
                <span className="landing-lab-label">Cách định vị</span>
                <h3 id="location-title">Từ lựa chọn sai đến kỹ năng gốc</h3>
                <div
                  className="landing-skill-graph"
                  aria-label="Đồ thị định vị từ phương án sai, qua lỗi quan niệm, đến kỹ năng liên quan và kỹ năng tiền đề"
                >
                  <div className="landing-graph-node landing-graph-response">
                    <small>Phương án sai</small>
                    <strong>y = kx (k ≠ 0)</strong>
                  </div>

                  <div className="landing-graph-edge">
                    <span>Ánh xạ phương án</span>
                  </div>

                  <div className="landing-graph-node landing-graph-misconception">
                    <small>Lỗi quan niệm</small>
                    <strong>Nhầm tỉ lệ nghịch thành tỉ lệ thuận</strong>
                  </div>

                  <div className="landing-graph-branch">
                    <span>Liên kết tới 2 kỹ năng</span>
                  </div>

                  <div className="landing-graph-related">
                    <div className="landing-graph-node landing-graph-skill">
                      <small>Kỹ năng liên quan</small>
                      <strong>Phân biệt tỉ lệ thuận và tỉ lệ nghịch</strong>
                    </div>
                    <div className="landing-graph-node landing-graph-skill">
                      <small>Kỹ năng liên quan</small>
                      <strong>Định nghĩa đại lượng tỉ lệ nghịch</strong>
                    </div>
                  </div>

                  <div className="landing-graph-prerequisite-edge">
                    <span>Đi ngược quan hệ tiền đề</span>
                  </div>

                  <div className="landing-graph-prerequisites">
                    <div className="landing-graph-common-prerequisite">
                      <small>Tiền đề chung của cả hai</small>
                      <strong>Đại lượng tỉ lệ thuận</strong>
                    </div>
                    <div className="landing-graph-foundation">
                      <small>Tiền đề sâu hơn</small>
                      <strong>Tỉ số và tỉ lệ thức</strong>
                    </div>
                  </div>
                </div>
                <p className="landing-graph-note">
                  Đồ thị kỹ năng GDPT 2018 giúp AiLearn tìm điểm nên kiểm tra
                  trước, thay vì dừng ở câu vừa làm sai.
                </p>
              </section>

              <section
                className="landing-hypothesis-check"
                aria-labelledby="hypothesis-title"
              >
                <span className="landing-lab-label">Xác minh giả thuyết</span>
                <h3 id="hypothesis-title">
                  Giữ cả dấu vết ủng hộ lẫn phản bác
                </h3>
                <dl className="landing-evidence-balance">
                  <div>
                    <dt>Ủng hộ</dt>
                    <dd>2 minh chứng</dd>
                  </div>
                  <div>
                    <dt>Phản bác</dt>
                    <dd>1 minh chứng</dd>
                  </div>
                  <div>
                    <dt>Trạng thái</dt>
                    <dd>Cần hỏi thêm</dd>
                  </div>
                </dl>
                <div className="landing-next-probe">
                  <span>Câu hỏi kiểm tra tiếp theo</span>
                  <p>
                    Giữ nguyên lượng công việc. Nếu số người tăng gấp đôi thì
                    thời gian hoàn thành thay đổi thế nào?
                  </p>
                </div>
                <p className="landing-teacher-action">
                  <strong>Hành động gợi ý:</strong> đối chiếu hai ngữ cảnh thuận
                  và nghịch; chỉ mở bài vá hổng khi mẫu sai lặp lại.
                </p>
              </section>
            </div>

            <footer className="landing-diagnosis-path">
              <ol aria-label="Luồng chẩn đoán của AiLearn">
                <li>Phản hồi</li>
                <li>Mã lỗi</li>
                <li>Đồ thị kỹ năng</li>
                <li>Giả thuyết</li>
                <li>Hành động</li>
              </ol>
              <p>
                Bài đang chờ đồng bộ được giữ riêng, không bị tính thành bằng
                chứng sai.
              </p>
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
