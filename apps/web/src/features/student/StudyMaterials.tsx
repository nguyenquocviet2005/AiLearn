import { useState } from "react";

import { STUDY_MATERIALS, type StudyMaterial } from "./copy";

export function StudyMaterialsPanel({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact ? "student-study-materials compact" : "student-study-materials"
      }
      aria-label="Tài liệu soạn bài"
    >
      <strong>Tài liệu soạn bài · chuẩn bị bài mới</strong>
      {!compact && (
        <p>
          Em xem lý thuyết và video trước khi làm bài kiểm tra ngắn. Có kiến
          thức sẵn sẽ giúp tìm đúng chỗ còn yếu.
        </p>
      )}
      <ul>
        {STUDY_MATERIALS.map((material) => (
          <li key={materialKey(material)}>
            {material.kind === "video" ? (
              <VideoMaterial material={material} compact={compact} />
            ) : (
              <ReadingMaterial material={material} compact={compact} />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function materialKey(material: StudyMaterial): string {
  return material.kind === "video" ? material.youtubeId : material.url;
}

function ReadingMaterial({
  material,
  compact,
}: {
  material: Extract<StudyMaterial, { kind: "ly_thuyet" | "bai_tap" }>;
  compact: boolean;
}) {
  const label = material.kind === "ly_thuyet" ? "Lý thuyết" : "Bài tập";
  return (
    <>
      <a href={material.url} target="_blank" rel="noreferrer">
        {label}
        {" · "}
        {material.title}
      </a>
      {!compact && <small>{material.blurb}</small>}
    </>
  );
}

function VideoMaterial({
  material,
  compact,
}: {
  material: Extract<StudyMaterial, { kind: "video" }>;
  compact: boolean;
}) {
  return (
    <div className="student-yt-card">
      <span className="student-yt-label">Video · {material.title}</span>
      {!compact && <small>{material.blurb}</small>}
      <YoutubeEmbed videoId={material.youtubeId} title={material.title} />
    </div>
  );
}

function YoutubeEmbed({ videoId, title }: { videoId: string; title: string }) {
  const [playing, setPlaying] = useState(false);
  const thumb = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  if (playing) {
    return (
      <div className="student-yt-frame">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      className="student-yt-thumb"
      onClick={() => setPlaying(true)}
      aria-label={`Phát video: ${title}`}
    >
      <img src={thumb} alt="" loading="lazy" />
      <span className="student-yt-play" aria-hidden="true">
        ▶
      </span>
    </button>
  );
}
