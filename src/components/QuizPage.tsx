import { useMemo, useState } from "react";
import { Deck, VocabCard } from "../types";
import PronounceButton from "./PronounceButton";

interface Props {
  deck: Deck;
  onBack: () => void;
  onReview: (cardId: string, remembered: boolean) => void;
}

type QuizType = "multiple-choice" | "typing";

interface MultipleChoiceQuestion {
  type: "multiple-choice";
  card: VocabCard;
  options: string[];
}

interface TypingQuestion {
  type: "typing";
  card: VocabCard;
}

type Question = MultipleChoiceQuestion | TypingQuestion;

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildQuestions(deck: Deck, type: QuizType, count: number): Question[] {
  const chosenCards = shuffle(deck.cards).slice(0, count);
  if (type === "typing") {
    return chosenCards.map((card) => ({ type: "typing", card }));
  }
  return chosenCards.map((card) => {
    const distractors = shuffle(deck.cards.filter((c) => c.id !== card.id && c.back !== card.back))
      .slice(0, 3)
      .map((c) => c.back);
    const options = shuffle([card.back, ...distractors]);
    return { type: "multiple-choice", card, options };
  });
}

export default function QuizPage({ deck, onBack, onReview }: Props) {
  const maxQuestions = deck.cards.length;
  const [stage, setStage] = useState<"setup" | "running" | "result">("setup");
  const [quizType, setQuizType] = useState<QuizType>("multiple-choice");
  const [count, setCount] = useState(Math.min(10, maxQuestions));
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCards, setWrongCards] = useState<VocabCard[]>([]);

  const current = questions[index];

  function start() {
    setQuestions(buildQuestions(deck, quizType, count));
    setIndex(0);
    setSelected(null);
    setTypedAnswer("");
    setRevealed(false);
    setCorrectCount(0);
    setWrongCards([]);
    setStage("running");
  }

  function answerMultipleChoice(option: string) {
    if (revealed || current?.type !== "multiple-choice") return;
    setSelected(option);
    setRevealed(true);
    const correct = option === current.card.back;
    onReview(current.card.id, correct);
    if (correct) setCorrectCount((c) => c + 1);
    else setWrongCards((w) => [...w, current.card]);
  }

  function submitTyping() {
    if (revealed || current?.type !== "typing") return;
    setRevealed(true);
    const correct = typedAnswer.trim().toLowerCase() === current.card.front.trim().toLowerCase();
    onReview(current.card.id, correct);
    if (correct) setCorrectCount((c) => c + 1);
    else setWrongCards((w) => [...w, current.card]);
  }

  function next() {
    if (index + 1 >= questions.length) {
      setStage("result");
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    setTypedAnswer("");
    setRevealed(false);
  }

  const isTypingCorrect = useMemo(
    () =>
      current?.type === "typing" &&
      typedAnswer.trim().toLowerCase() === current.card.front.trim().toLowerCase(),
    [current, typedAnswer]
  );

  if (stage === "setup") {
    return (
      <div className="mx-auto max-w-md animate-fade-in-up px-4 py-10">
        <button onClick={onBack} className="mb-6 text-sm text-brand-700/60 hover:text-brand-700">
          ← Quay lại
        </button>
        <h1 className="text-2xl font-extrabold text-brand-900">Bài kiểm tra</h1>
        <p className="mt-1 text-sm text-brand-700/70">{deck.name}</p>

        <div className="mt-6 space-y-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-brand-700/70">
              Dạng bài
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setQuizType("multiple-choice")}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  quizType === "multiple-choice"
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-brand-200 text-brand-700/60 hover:bg-brand-50"
                }`}
              >
                Trắc nghiệm
              </button>
              <button
                onClick={() => setQuizType("typing")}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  quizType === "typing"
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-brand-200 text-brand-700/60 hover:bg-brand-50"
                }`}
              >
                Gõ từ tiếng Anh
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-brand-700/70">
              Số câu hỏi: {count}
            </label>
            <input
              type="range"
              min={Math.min(2, maxQuestions)}
              max={maxQuestions}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full accent-brand-600"
            />
          </div>

          <button
            onClick={start}
            className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            Bắt đầu kiểm tra
          </button>
        </div>
      </div>
    );
  }

  if (stage === "result") {
    const total = questions.length;
    const pct = Math.round((correctCount / total) * 100);
    return (
      <div className="mx-auto max-w-md animate-fade-in-up px-4 py-16 text-center">
        <h2 className="text-2xl font-extrabold text-brand-900">Kết quả</h2>
        <p className="mt-3 text-5xl font-extrabold text-brand-600">{pct}%</p>
        <p className="mt-2 text-brand-700/70">
          Đúng {correctCount}/{total} câu
        </p>

        {wrongCards.length > 0 && (
          <div className="mt-6 space-y-2 text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700/60">Cần ôn lại</p>
            {wrongCards.map((c) => (
              <div key={c.id} className="rounded-lg bg-white px-3 py-2 text-sm shadow-sm ring-1 ring-black/5">
                <span className="font-semibold text-brand-900">{c.front}</span>
                <span className="text-brand-700/60"> — {c.back}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => setStage("setup")}
            className="rounded-lg bg-brand-100 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-200"
          >
            Kiểm tra lại
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

  if (!current) return null;

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-brand-700/60 hover:text-brand-700">
          ← Thoát
        </button>
        <span className="text-sm font-medium text-brand-700/60">
          {index + 1} / {questions.length}
        </span>
      </div>

      <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-brand-100">
        <div
          className="h-full rounded-full bg-brand-500 transition-all duration-300"
          style={{ width: `${(index / questions.length) * 100}%` }}
        />
      </div>

      {current.type === "multiple-choice" ? (
        <div className="animate-fade-in-up space-y-4">
          <div className="flex items-center justify-center gap-3 rounded-2xl bg-white py-8 shadow-sm ring-1 ring-black/5">
            <h2 className="text-2xl font-extrabold text-brand-900">{current.card.front}</h2>
            <PronounceButton word={current.card.front} audioUrl={current.card.audioUrl} />
          </div>
          <div className="grid gap-2">
            {current.options.map((option) => {
              const isCorrectOption = option === current.card.back;
              const isSelected = option === selected;
              let style = "border-brand-200 hover:bg-brand-50";
              if (revealed && isCorrectOption) style = "border-brand-500 bg-brand-50 text-brand-700";
              else if (revealed && isSelected) style = "border-red-400 bg-red-50 text-red-600";
              return (
                <button
                  key={option}
                  onClick={() => answerMultipleChoice(option)}
                  disabled={revealed}
                  className={`rounded-lg border px-4 py-2.5 text-left text-sm font-medium transition ${style}`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="animate-fade-in-up space-y-4">
          <div className="flex items-center justify-center rounded-2xl bg-white py-8 shadow-sm ring-1 ring-black/5">
            <h2 className="text-2xl font-bold text-brand-900">{current.card.back}</h2>
          </div>
          <input
            autoFocus
            value={typedAnswer}
            disabled={revealed}
            onChange={(e) => setTypedAnswer(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitTyping()}
            placeholder="Gõ từ tiếng Anh..."
            className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:ring-2 ${
              revealed
                ? isTypingCorrect
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-red-400 bg-red-50 text-red-600"
                : "border-brand-200 focus:border-brand-400 focus:ring-brand-200"
            }`}
          />
          {revealed && !isTypingCorrect && (
            <p className="text-sm text-brand-700/70">
              Đáp án đúng: <span className="font-semibold text-brand-900">{current.card.front}</span>
            </p>
          )}
          {!revealed && (
            <button
              onClick={submitTyping}
              className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              Kiểm tra
            </button>
          )}
        </div>
      )}

      {revealed && (
        <button
          onClick={next}
          className="mt-4 w-full rounded-lg bg-brand-900 py-2.5 text-sm font-medium text-white hover:bg-brand-800"
        >
          {index + 1 >= questions.length ? "Xem kết quả" : "Câu tiếp theo"}
        </button>
      )}
    </div>
  );
}
