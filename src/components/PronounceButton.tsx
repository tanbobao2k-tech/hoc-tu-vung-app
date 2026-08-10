import { playPronunciation } from "../lib/pronunciation";

interface Props {
  word: string;
  audioUrl?: string;
  size?: "sm" | "md";
}

export default function PronounceButton({ word, audioUrl, size = "md" }: Props) {
  const dim = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        playPronunciation(word, audioUrl);
      }}
      title="Nghe phát âm"
      className={`${dim} flex shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 transition hover:bg-brand-200 active:scale-95`}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M4 9v6h4l5 5V4L8 9H4z" />
        <path d="M16.5 12a4.5 4.5 0 0 0-2.5-4.03v8.06A4.5 4.5 0 0 0 16.5 12z" />
      </svg>
    </button>
  );
}
