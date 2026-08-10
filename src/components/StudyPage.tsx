import { useMemo, useState } from "react";
import { Deck } from "../types";
import { isDue } from "../lib/srs";
import Flashcard from "./Flashcard";

interface Props {
  deck: Deck;
  onBack: () => void;
  onReview: (cardId: string, remembered: boolean) => void;
}

export default function StudyPage({ deck, onBack, onReview }: Props) {
  const queue = useMemo(() => {
    const due = deck.cards.filter((c) => isDue(c.nextReviewAt));
    return due.length > 0 ? due : deck.cards;
    // Chỉ tính danh sách ôn tập một lần khi bắt đầu phiên học,
    // tránh thẻ vừa trả lời bị tính lại/nhảy khỏi hàng đợi ngay lập tức.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deck.id]);

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [unknown, setUnknown] = useState(0);

  const current = queue[index];
  const finished = index >= queue.length;

  function handleAnswer(remembered: boolean) {
    if (!current) return;
    onReview(current.id, remembered);
    setKnown((k) => (remembered ? k + 1 : k));
    setUnknown((u) => (remembered ? u : u + 1));
    setFlipped(false);
    setIndex((i) => i + 1);
  }

  if (queue.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-brand-700/70">Bộ thẻ này chưa có thẻ nào để học.</p>
        <button onClick={onBack} className="mt-4 text-sm font-medium text-brand-600 hover:underline">
          ← Quay lại
        </button>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="mx-auto max-w-md animate-fade-in-up px-4 py-16 text-center">
        <h2 className="text-2xl font-extrabold text-brand-900">Hoàn thành phiên học!</h2>
        <p className="mt-2 text-brand-700/70">
          Đã nhớ <span className="font-semibold text-brand-700">{known}</span> · Chưa nhớ{" "}
          <span className="font-semibold text-brand-700">{unknown}</span>
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => {
              setIndex(0);
              setKnown(0);
              setUnknown(0);
              setFlipped(false);
            }}
            className="rounded-lg bg-brand-100 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-200"
          >
            Học lại
          </button>
          <button
            onClick={onBack}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Về bộ thẻ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-brand-700/60 hover:text-brand-700">
          ← Thoát
        </button>
        <span className="text-sm font-medium text-brand-700/60">
          {index + 1} / {queue.length}
        </span>
      </div>

      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-brand-100">
        <div
          className="h-full rounded-full bg-brand-500 transition-all duration-300"
          style={{ width: `${(index / queue.length) * 100}%` }}
        />
      </div>

      <Flashcard card={current} flipped={flipped} onFlip={() => setFlipped((f) => !f)} />

      <div className="mt-8 flex justify-center gap-3">
        {!flipped ? (
          <button
            onClick={() => setFlipped(true)}
            className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            Lật thẻ
          </button>
        ) : (
          <>
            <button
              onClick={() => handleAnswer(false)}
              className="rounded-lg bg-red-50 px-5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-100"
            >
              Chưa nhớ
            </button>
            <button
              onClick={() => handleAnswer(true)}
              className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              Đã nhớ
            </button>
          </>
        )}
      </div>
    </div>
  );
}
