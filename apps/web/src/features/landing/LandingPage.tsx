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

const runningTechnologyStack = [
  { name: "React", role: "Giao diện tương tác", logo: "/technology/react.svg" },
  {
    name: "TypeScript",
    role: "Kiểu dữ liệu xuyên suốt",
    logo: "/technology/typescript.svg",
  },
  { name: "Vite", role: "Build web tốc độ cao", logo: "/technology/vite.svg" },
  {
    name: "Python",
    role: "Các engine học tập",
    logo: "/technology/python.svg",
  },
  {
    name: "FastAPI",
    role: "API và kiểm tra Pydantic",
    logo: "/technology/fastapi.svg",
  },
  {
    name: "Supabase",
    role: "Dịch vụ dữ liệu",
    logo: "/technology/supabase.svg",
  },
  {
    name: "PostgreSQL",
    role: "Nguồn dữ liệu tin cậy",
    logo: "/technology/postgresql.svg",
  },
  { name: "Railway", role: "Vận hành API", logo: "/technology/railway.svg" },
  {
    name: "Vercel",
    role: "Phân phối ứng dụng web",
    logo: "/technology/vercel.svg",
  },
];

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
    name: "Phạm Tuấn Phong",
    role: "CEO",
    image: "/team/pham-tuan-phong.webp",
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
              Thấy đúng chỗ vướng. Dạy đúng điều cần thiết.
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
            <span className="landing-signal-core">
              <img src="/brand/ailearn-mascot.webp" alt="" />
              <i className="firefly-tail-light" />
            </span>
            <span className="landing-signal-label signal-one">Quan sát</span>
            <span className="landing-signal-label signal-two">Giải thích</span>
            <span className="landing-signal-label signal-three">Thích ứng</span>
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
              <p>
                Mỗi lớp có một trách nhiệm rõ ràng, chạy được cả khi chưa kết
                nối model tạo sinh.
              </p>
            </div>

            <ul className="landing-tech-stack-list">
              {runningTechnologyStack.map((technology) => (
                <li key={technology.name}>
                  <img src={technology.logo} alt="" loading="lazy" />
                  <span>
                    <strong>{technology.name}</strong>
                    <small>{technology.role}</small>
                  </span>
                </li>
              ))}
            </ul>

            <div className="landing-tech-operations">
              <p>
                <strong>Học tiếp khi mạng yếu</strong>
                Câu trả lời được xếp hàng trên thiết bị, đồng bộ đúng thứ tự và
                chống ghi trùng khi kết nối trở lại.
              </p>

              <aside aria-label="Hướng mở rộng đồ thị và truy xuất">
                <img src="/technology/neo4j.svg" alt="" loading="lazy" />
                <div>
                  <span>Hướng mở rộng</span>
                  <strong>Neo4j · pgvector · LangGraph</strong>
                  <p>
                    Skill Graph hiện chạy bằng dữ liệu có cấu trúc trong engine
                    Python. Lớp graph chuyên biệt, tìm kiếm ngữ nghĩa và điều
                    phối workflow chỉ được thêm khi quy mô thực sự cần.
                  </p>
                </div>
              </aside>
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
              className="landing-text-link"
              onNavigate={onNavigate}
              route="/teacher"
            >
              Vào dashboard giáo viên
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
              className="landing-text-link"
              onNavigate={onNavigate}
              route="/student"
            >
              Bắt đầu trải nghiệm học sinh
            </WorkspaceLink>
          </article>
        </section>

        <section className="landing-evidence" aria-labelledby="evidence-title">
          <div className="landing-section-heading">
            <p className="landing-kicker landing-kicker-dark">
              Evidence, not labels
            </p>
            <h2 id="evidence-title">
              Insight chỉ có ý nghĩa khi dẫn tới hành động.
            </h2>
            <p>
              AiLearn giữ lại nguồn bằng chứng, giả thuyết cạnh tranh và bước
              xác minh tiếp theo để giáo viên nhìn thấy cơ sở của mỗi đề xuất.
            </p>
          </div>

          <figure className="landing-product-preview">
            <figcaption>
              <div>
                <span>Hiểu lớp · Toán 7A</span>
                <strong>Ba quyết định trước tiết học</strong>
              </div>
              <small>28/32 học sinh đã có dữ liệu</small>
            </figcaption>

            <div className="landing-preview-decision">
              <span>Quyết định 01</span>
              <strong>Phân biệt tỉ lệ thuận và nghịch trước</strong>
              <p>11 học sinh lặp lại cùng một mẫu sai ở hai ngữ cảnh.</p>
            </div>

            <div className="landing-preview-grid">
              <section aria-labelledby="preview-priority-title">
                <span className="landing-preview-label">
                  Nên hỗ trợ ai trước?
                </span>
                <h3 id="preview-priority-title">
                  Ưu tiên theo khả năng can thiệp
                </h3>
                <ol>
                  <li>
                    <b>01</b>
                    <span>
                      <strong>Sai có hệ thống</strong>
                      <small>Hai minh chứng, mức tự tin cao</small>
                    </span>
                  </li>
                  <li>
                    <b>02</b>
                    <span>
                      <strong>Hổng kỹ năng tiền đề</strong>
                      <small>Ảnh hưởng ba kỹ năng phía sau</small>
                    </span>
                  </li>
                </ol>
              </section>

              <section aria-labelledby="preview-evidence-title">
                <span className="landing-preview-label">
                  Phân bố nguyên nhân
                </span>
                <h3 id="preview-evidence-title">Có bằng chứng để kiểm tra</h3>
                <div className="landing-preview-bars">
                  <div>
                    <span>Nhầm hai quan hệ</span>
                    <b>11</b>
                    <i
                      style={{ "--bar-width": "78%" } as React.CSSProperties}
                    />
                  </div>
                  <div>
                    <span>Thiếu tiền đề phân số</span>
                    <b>5</b>
                    <i
                      style={{ "--bar-width": "42%" } as React.CSSProperties}
                    />
                  </div>
                  <div>
                    <span>Cần hỏi thêm</span>
                    <b>3</b>
                    <i
                      style={{ "--bar-width": "28%" } as React.CSSProperties}
                    />
                  </div>
                </div>
              </section>
            </div>

            <p className="landing-preview-note">
              4 bài đang chờ đồng bộ được giữ riêng, không bị tính là học sinh
              làm sai hoặc thiếu bài.
            </p>
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
