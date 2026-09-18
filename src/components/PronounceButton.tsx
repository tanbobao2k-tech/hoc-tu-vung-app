import { useState } from "react";
import { lookupPronunciation, playPronunciation } from "../lib/pronunciation";

interface Props {
  word: string;
  audioUrl?: string;
  size?: "sm" | "md";
}

function triggerDownload(url: string, word: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = `${word.trim().toLowerCase().replace(/\s+/g, "-")}.mp3`;
  a.click();
}

export default function PronounceButton({ word, audioUrl, size = "md" }: Props) {
  const [resolvedUrl, setResolvedUrl] = useState(audioUrl);
  const [loading, setLoading] = useState(false);
  const dim = size === "sm" ? "h-7 w-7" : "h-9 w-9";

  async function handleDownload(e: React.MouseEvent) {
    e.stopPropagation();
    if (loading) return;

    if (resolvedUrl) {
      triggerDownload(resolvedUrl, word);
      return;
    }

    // Thẻ này chưa có bản ghi âm lưu sẵn (thường do thêm qua "Nhập nhanh") —
    // tra cứu ngay lúc bấm thay vì bắt phải sửa thẻ để tra lại.
    setLoading(true);
    const info = await lookupPronunciation(word);
    setLoading(false);
    if (info.audioUrl) {
      setResolvedUrl(info.audioUrl);
      triggerDownload(info.audioUrl, word);
    } else {
      alert(`Không tìm thấy bản ghi âm thật cho từ "${word}".`);
    }
  }

  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          playPronunciation(word, resolvedUrl);
        }}
        title="Nghe phát âm (giọng Anh-Anh)"
        className={`${dim} flex shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 transition hover:bg-brand-200 active:scale-95`}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
          <path d="M4 9v6h4l5 5V4L8 9H4z" />
          <path d="M16.5 12a4.5 4.5 0 0 0-2.5-4.03v8.06A4.5 4.5 0 0 0 16.5 12z" />
        </svg>
      </button>
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        title={resolvedUrl ? "Tải file phát âm" : "Tìm & tải file phát âm"}
        className={`${dim} flex shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 transition hover:bg-brand-200 active:scale-95 disabled:opacity-50`}
      >
        {loading ? (
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 animate-spin">
            <circle
              cx="12"
              cy="12"
              r="9"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray="40"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
            <path d="M12 3v10.59l3.3-3.3 1.4 1.42L12 17.4l-4.7-4.7 1.4-1.42 3.3 3.3V3h2z" />
            <path d="M5 19h14v2H5z" />
          </svg>
        )}
      </button>
    </div>
  );
}
