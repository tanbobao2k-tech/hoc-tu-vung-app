import { playPronunciation } from "../lib/pronunciation";

interface Props {
  word: string;
  audioUrl?: string;
  size?: "sm" | "md";
}

export default function PronounceButton({ word, audioUrl, size = "md" }: Props) {
  const dim = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          playPronunciation(word, audioUrl);
        }}
        title="Nghe phát âm (giọng Anh-Anh)"
        className={`${dim} flex shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 transition hover:bg-brand-200 active:scale-95`}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
          <path d="M4 9v6h4l5 5V4L8 9H4z" />
          <path d="M16.5 12a4.5 4.5 0 0 0-2.5-4.03v8.06A4.5 4.5 0 0 0 16.5 12z" />
        </svg>
      </button>
      {audioUrl && (
        // Endpoint audio không có header CORS nên không fetch() lấy blob được
        // (không đặt lại được tên file tải về), nhưng thẻ <a download> vẫn tải
        // được bình thường vì trình duyệt xử lý ở tầng điều hướng, không qua
        // giới hạn CORS của fetch().
        <a
          href={audioUrl}
          download={`${word.trim().toLowerCase().replace(/\s+/g, "-")}.mp3`}
          onClick={(e) => e.stopPropagation()}
          title="Tải file phát âm"
          className={`${dim} flex shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 transition hover:bg-brand-200 active:scale-95`}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
            <path d="M12 3v10.59l3.3-3.3 1.4 1.42L12 17.4l-4.7-4.7 1.4-1.42 3.3 3.3V3h2z" />
            <path d="M5 19h14v2H5z" />
          </svg>
        </a>
      )}
    </div>
  );
}
