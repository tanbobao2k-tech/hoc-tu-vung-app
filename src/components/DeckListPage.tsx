import { FormEvent, useState } from "react";
import { CardInput, Deck } from "../types";
import { isDue } from "../lib/srs";
import { parseBulkImport } from "../lib/bulkImport";

interface Props {
  decks: Deck[];
  currentUid: string;
  userEmail: string | null;
  onSignOut: () => void;
  onCreateDeck: (name: string, description?: string) => string;
  onRenameDeck: (deckId: string, name: string, description?: string) => void;
  onAddCard: (deckId: string, card: CardInput) => void;
  onOpenDeck: (deckId: string) => void;
  onDeleteDeck: (deckId: string) => void;
}

export default function DeckListPage({
  decks,
  currentUid,
  userEmail,
  onSignOut,
  onCreateDeck,
  onRenameDeck,
  onAddCard,
  onOpenDeck,
  onDeleteDeck,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ doneCards: 0, totalCards: 0 });

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const id = onCreateDeck(name, description);
    setName("");
    setDescription("");
    setShowForm(false);
    onOpenDeck(id);
  }

  const parsedPreview = parseBulkImport(bulkText);

  async function handleBulkImport() {
    if (parsedPreview.length === 0 || importing) return;
    setImporting(true);
    const totalCards = parsedPreview.reduce((s, d) => s + d.cards.length, 0);
    setImportProgress({ doneCards: 0, totalCards });
    for (const parsedDeck of parsedPreview) {
      const deckId = onCreateDeck(parsedDeck.name);
      for (const card of parsedDeck.cards) {
        onAddCard(deckId, { front: card.front, back: card.back, examples: card.examples });
        setImportProgress((p) => ({ ...p, doneCards: p.doneCards + 1 }));
      }
    }
    setImporting(false);
    setBulkText("");
    setShowBulkImport(false);
  }

  function startEditing(deck: Deck) {
    setEditingDeckId(deck.id);
    setEditName(deck.name);
    setEditDescription(deck.description ?? "");
  }

  function handleSaveEdit(e: FormEvent, deckId: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!editName.trim()) return;
    onRenameDeck(deckId, editName, editDescription);
    setEditingDeckId(null);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8 flex items-start justify-between gap-4 animate-fade-in-up">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">Học từ vựng</p>
          <h1 className="mt-1 text-3xl font-extrabold text-brand-900">Bộ thẻ ghi nhớ của bạn</h1>
          <p className="mt-2 text-sm text-brand-700/70">
            Tạo bộ thẻ, thêm từ vựng và ôn tập mỗi ngày để ghi nhớ lâu dài.
          </p>
        </div>
        {userEmail && (
          <div className="shrink-0 text-right">
            <p className="text-xs text-brand-700/50">{userEmail}</p>
            <button onClick={onSignOut} className="text-xs font-medium text-brand-600 hover:underline">
              Đăng xuất
            </button>
          </div>
        )}
      </header>

      {decks.length === 0 && !showForm && !showBulkImport && (
        <div className="animate-fade-in-up rounded-2xl border border-dashed border-brand-300 bg-white/60 p-8 text-center">
          <p className="text-brand-700/70">Bạn chưa có bộ thẻ nào. Hãy tạo bộ thẻ đầu tiên!</p>
          <div className="mt-4 flex justify-center gap-2">
            <button
              onClick={() => setShowForm(true)}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              + Tạo bộ thẻ mới
            </button>
            <button
              onClick={() => setShowBulkImport(true)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50"
            >
              Nhập nhanh nhiều bộ
            </button>
          </div>
        </div>
      )}

      {decks.length > 0 && (
        <div className="mb-4 flex items-center justify-between animate-fade-in-up">
          <h2 className="text-sm font-medium text-brand-700/70">{decks.length} bộ thẻ</h2>
          {!showForm && !showBulkImport && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowBulkImport(true)}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50"
              >
                Nhập nhanh nhiều bộ
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
              >
                + Bộ thẻ mới
              </button>
            </div>
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

      {showBulkImport && (
        <div className="mb-6 animate-fade-in-up space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-brand-700/70">
              Dán danh sách từ vựng
            </label>
            <p className="mb-2 text-xs text-brand-700/50">
              Mỗi dòng không đánh số = tên một bộ thẻ mới. Các dòng đánh số sau đó là thẻ từ vựng của bộ
              đó, hỗ trợ 2 kiểu: đơn giản <span className="font-mono">"1. word: nghĩa"</span>, hoặc đầy
              đủ <span className="font-mono">"1. word (n): nghĩa – VD: câu ví dụ"</span>.
            </p>
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={
                "TÊN BỘ THẺ 1\n1. real estate (n): bất động sản – VD: She works in real estate.\n2. word: nghĩa\n\nTÊN BỘ THẺ 2\n1. word: nghĩa"
              }
              rows={10}
              className="w-full resize-y rounded-lg border border-brand-200 bg-brand-50/40 px-3 py-2 font-mono text-xs outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
            />
          </div>

          {parsedPreview.length > 0 && (
            <p className="text-xs text-brand-700/60">
              Nhận diện được <span className="font-semibold text-brand-700">{parsedPreview.length}</span>{" "}
              bộ thẻ,{" "}
              <span className="font-semibold text-brand-700">
                {parsedPreview.reduce((s, d) => s + d.cards.length, 0)}
              </span>{" "}
              thẻ: {parsedPreview.map((d) => `${d.name} (${d.cards.length})`).join(", ")}
            </p>
          )}

          {importing ? (
            <p className="text-xs text-brand-700/60">
              Đang nhập... ({importProgress.doneCards}/{importProgress.totalCards})
            </p>
          ) : (
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowBulkImport(false);
                  setBulkText("");
                }}
                className="rounded-lg px-3 py-1.5 text-sm text-brand-700/70 hover:bg-brand-50"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={parsedPreview.length === 0}
                onClick={handleBulkImport}
                className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Nhập {parsedPreview.length > 0 ? `${parsedPreview.length} bộ thẻ` : ""}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {decks.map((deck, i) => {
          const dueCount = deck.cards.filter((c) => isDue(c.nextReviewAt)).length;
          const isOwner = deck.createdBy === currentUid;

          if (editingDeckId === deck.id) {
            return (
              <form
                key={deck.id}
                onSubmit={(e) => handleSaveEdit(e, deck.id)}
                onClick={(e) => e.stopPropagation()}
                className="space-y-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"
              >
                <input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Tên bộ thẻ"
                  className="w-full rounded-lg border border-brand-200 px-3 py-1.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                />
                <input
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Mô tả ngắn (tùy chọn)"
                  className="w-full rounded-lg border border-brand-200 px-3 py-1.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingDeckId(null)}
                    className="rounded-lg px-3 py-1 text-xs text-brand-700/70 hover:bg-brand-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-brand-600 px-3 py-1 text-xs font-medium text-white hover:bg-brand-700"
                  >
                    Lưu
                  </button>
                </div>
              </form>
            );
          }

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
                {isOwner && (
                  <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(deck);
                      }}
                      className="rounded-lg px-2 py-1 text-xs text-brand-700/60 hover:bg-brand-50"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Xóa bộ thẻ "${deck.name}"? Hành động này không thể hoàn tác.`)) {
                          onDeleteDeck(deck.id);
                        }
                      }}
                      className="rounded-lg px-2 py-1 text-xs text-red-500/60 hover:bg-red-50"
                    >
                      Xóa
                    </button>
                  </div>
                )}
              </div>
              <div className="mt-4 flex items-center gap-3 text-xs text-brand-700/60">
                <span>{deck.cards.length} thẻ</span>
                {dueCount > 0 && (
                  <span className="rounded-full bg-brand-100 px-2 py-0.5 font-medium text-brand-700">
                    {dueCount} cần ôn
                  </span>
                )}
                {!isOwner && deck.createdByEmail && (
                  <span className="truncate text-brand-700/40">của {deck.createdByEmail}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
