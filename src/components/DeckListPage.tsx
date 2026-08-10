import { FormEvent, useState } from "react";
import { Deck } from "../types";
import { isDue } from "../lib/srs";

interface Props {
  decks: Deck[];
  onCreateDeck: (name: string, description?: string) => string;
  onOpenDeck: (deckId: string) => void;
  onDeleteDeck: (deckId: string) => void;
}

export default function DeckListPage({ decks, onCreateDeck, onOpenDeck, onDeleteDeck }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const id = onCreateDeck(name, description);
    setName("");
    setDescription("");
    setShowForm(false);
    onOpenDeck(id);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8 animate-fade-in-up">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">Học từ vựng</p>
        <h1 className="mt-1 text-3xl font-extrabold text-brand-900">Bộ thẻ ghi nhớ của bạn</h1>
        <p className="mt-2 text-sm text-brand-700/70">
          Tạo bộ thẻ, thêm từ vựng và ôn tập mỗi ngày để ghi nhớ lâu dài.
        </p>
      </header>

      {decks.length === 0 && !showForm && (
        <div className="animate-fade-in-up rounded-2xl border border-dashed border-brand-300 bg-white/60 p-8 text-center">
          <p className="text-brand-700/70">Bạn chưa có bộ thẻ nào. Hãy tạo bộ thẻ đầu tiên!</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            + Tạo bộ thẻ mới
          </button>
        </div>
      )}

      {decks.length > 0 && (
        <div className="mb-4 flex items-center justify-between animate-fade-in-up">
          <h2 className="text-sm font-medium text-brand-700/70">{decks.length} bộ thẻ</h2>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              + Bộ thẻ mới
            </button>
          )}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 animate-fade-in-up space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"
        >
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tên bộ thẻ, vd: Từ vựng TOEIC 600"
            className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả ngắn (tùy chọn)"
            className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg px-3 py-1.5 text-sm text-brand-700/70 hover:bg-brand-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              Tạo bộ thẻ
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {decks.map((deck, i) => {
          const dueCount = deck.cards.filter((c) => isDue(c.nextReviewAt)).length;
          return (
            <div
              key={deck.id}
              onClick={() => onOpenDeck(deck.id)}
              style={{ animationDelay: `${i * 40}ms` }}
              className="group animate-fade-in-up cursor-pointer rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-brand-900">{deck.name}</h3>
                  {deck.description && (
                    <p className="mt-0.5 truncate text-xs text-brand-700/60">{deck.description}</p>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Xóa bộ thẻ "${deck.name}"? Hành động này không thể hoàn tác.`)) {
                      onDeleteDeck(deck.id);
                    }
                  }}
                  className="shrink-0 rounded-lg px-2 py-1 text-xs text-red-500/60 opacity-0 transition hover:bg-red-50 group-hover:opacity-100"
                >
                  Xóa
                </button>
              </div>
              <div className="mt-4 flex items-center gap-3 text-xs text-brand-700/60">
                <span>{deck.cards.length} thẻ</span>
                {dueCount > 0 && (
                  <span className="rounded-full bg-brand-100 px-2 py-0.5 font-medium text-brand-700">
                    {dueCount} cần ôn
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
