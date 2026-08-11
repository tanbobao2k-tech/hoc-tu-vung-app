import { VocabCard } from "../types";
import PronounceButton from "./PronounceButton";

interface Props {
  card: VocabCard;
  flipped: boolean;
  onFlip: () => void;
}

export default function Flashcard({ card, flipped, onFlip }: Props) {
  const hasExamples = !!card.examples && card.examples.length > 0;
  const isMultiline = card.back.includes("\n") || hasExamples;

  return (
    <div className="perspective mx-auto h-64 w-full max-w-md">
      <div
        onClick={onFlip}
        className={`flip-card relative h-full w-full cursor-pointer ${flipped ? "flipped" : ""}`}
      >
        <div className="flip-face absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl bg-white p-6 text-center shadow-md ring-1 ring-black/5">
          {card.imageUrl ? (
            <img
              src={card.imageUrl}
              alt=""
              className="h-24 w-24 rounded-2xl object-cover ring-1 ring-black/5"
            />
          ) : (
            <span className="text-xs font-semibold uppercase tracking-widest text-brand-500">
              Tiếng Anh
            </span>
          )}
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-extrabold text-brand-900">{card.front}</h2>
            <PronounceButton word={card.front} audioUrl={card.audioUrl} />
          </div>
          {card.phonetic && <span className="text-sm text-brand-700/60">{card.phonetic}</span>}
          <span className="mt-2 text-xs text-brand-700/40">Nhấn để xem nghĩa</span>
        </div>
        <div className="flip-face flip-face-back absolute inset-0 flex flex-col items-center gap-2 rounded-3xl bg-brand-600 p-6 text-center shadow-md">
          <span className="shrink-0 text-xs font-semibold uppercase tracking-widest text-brand-100">
            Tiếng Việt
          </span>
          {isMultiline ? (
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full flex-1 overflow-y-auto whitespace-pre-line px-1 text-left text-sm leading-relaxed text-white"
            >
              {card.back}
              {hasExamples && (
                <div className="mt-3 space-y-2 border-t border-white/20 pt-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-100/80">
                    Ví dụ
                  </p>
                  {card.examples!.map((ex, i) => (
                    <p key={i} className="text-xs leading-relaxed">
                      <span className="text-white">{ex.en}</span>
                      {ex.vi && <span className="block text-brand-100/70">— {ex.vi}</span>}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <h2 className="flex flex-1 items-center text-2xl font-bold text-white">{card.back}</h2>
          )}
          <span className="shrink-0 text-xs text-brand-100/70">Nhấn để xem từ</span>
        </div>
      </div>
    </div>
  );
}
