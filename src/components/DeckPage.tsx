import { useMemo, useState } from "react";
import { CardInput, Deck, VocabCard } from "../types";
import { isDue } from "../lib/srs";
import { fetchExampleSentences } from "../lib/meaning";
import CardForm from "./CardForm";
import CardListItem from "./CardListItem";

interface Props {
  deck: Deck;
  onBack: () => void;
  onAddCard: (card: CardInput) => void;
  onUpdateCard: (cardId: string, updates: CardInput) => void;
  onDeleteCard: (cardId: string) => void;
  onStartStudy: (cards: VocabCard[]) => void;
  onStartQuiz: (cards: VocabCard[]) => void;
}

const UNCATEGORIZED = "__uncategorized__";

export default function DeckPage({
  deck,
  onBack,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
  onStartStudy,
  onStartQuiz,
}: Props) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [bulkAdding, setBulkAdding] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 });

  const categories = useMemo(() => {
    const set = new Set(deck.cards.map((c) => c.category).filter((c): c is string => !!c));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "vi"));
  }, [deck.cards]);

  const filteredCards = useMemo(
    () => (selectedCategory ? deck.cards.filter((c) => c.category === selectedCategory) : deck.cards),
    [deck.cards, selectedCategory]
  );

  const groups = useMemo(() => {
    if (categories.length === 0) return [{ label: null as string | null, cards: filteredCards }];
    const byCategory = new Map<string, VocabCard[]>();
    for (const cat of categories) byCategory.set(cat, []);
    byCategory.set(UNCATEGORIZED, []);
    for (const card of filteredCards) byCategory.get(card.category ?? UNCATEGORIZED)!.push(card);
    return Array.from(byCategory.entries())
      .filter(([, cards]) => cards.length > 0)
      .map(([label, cards]) => ({ label: label === UNCATEGORIZED ? "Chưa phân loại" : label, cards }));
  }, [categories, filteredCards]);

  const dueCount = filteredCards.filter((c) => isDue(c.nextReviewAt)).length;

  const cardsMissingExamples = filteredCards.filter((c) => !c.examples || c.examples.length === 0);

  async function runBulkAddExamples() {
    const targets = cardsMissingExamples;
    if (targets.length === 0 || bulkAdding) return;
    setBulkAdding(true);
    setBulkProgress({ done: 0, total: targets.length });
    for (const card of targets) {
      const fetched = await fetchExampleSentences(card.front);
      onUpdateCard(card.id, {
        front: card.front,
        back: card.back,
        phonetic: card.phonetic,
        audioUrl: card.audioUrl,
        imageUrl: card.imageUrl,
        category: card.category,
        examples: fetched,
      });
      setBulkProgress((prev) => ({ ...prev, done: prev.done + 1 }));
    }
    setBulkAdding(false);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <button onClick={onBack} className="mb-4 text-sm text-brand-700/60 hover:text-brand-700">
        ← Tất cả bộ thẻ
      </button>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-900">{deck.name}</h1>
          {deck.description && <p className="mt-1 text-sm text-brand-700/70">{deck.description}</p>}
          <p className="mt-1 text-xs text-brand-700/50">{deck.cards.length} thẻ</p>
        </div>
        <div className="flex gap-2">
          <button
            disabled={filteredCards.length === 0}
            onClick={() => onStartStudy(filteredCards)}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Học ({dueCount > 0 ? dueCount : filteredCards.length})
          </button>
          <button
            disabled={filteredCards.length < 2}
            onClick={() => onStartQuiz(filteredCards)}
            className="rounded-lg bg-brand-100 px-4 py-2 text-sm font-medium text-brand-700 transition hover:bg-brand-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Kiểm tra
          </button>
        </div>
      </header>

      {categories.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2 animate-fade-in-up">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              selectedCategory === null
                ? "bg-brand-600 text-white"
                : "bg-white text-brand-700/70 ring-1 ring-brand-200 hover:bg-brand-50"
            }`}
          >
            Tất cả ({deck.cards.length})
          </button>
          {categories.map((cat) => {
            const count = deck.cards.filter((c) => c.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  selectedCategory === cat
                    ? "bg-brand-600 text-white"
                    : "bg-white text-brand-700/70 ring-1 ring-brand-200 hover:bg-brand-50"
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      )}

      {cardsMissingExamples.length > 0 && (
        <div className="mb-4 animate-fade-in-up">
          {bulkAdding ? (
            <p className="text-xs text-brand-700/60">
              Đang tự động thêm ví dụ... ({bulkProgress.done}/{bulkProgress.total})
            </p>
          ) : (
            <button
              onClick={runBulkAddExamples}
              className="text-xs font-medium text-brand-600 hover:underline"
            >
              Tự động thêm ví dụ cho {cardsMissingExamples.length} thẻ chưa có →
            </button>
          )}
        </div>
      )}

      <div className="mb-4 animate-fade-in-up">
        {showAddForm ? (
          <CardForm
            existingCategories={categories}
            onSubmit={(card) => {
              onAddCard(card);
            }}
            onCancel={() => setShowAddForm(false)}
          />
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full rounded-xl border border-dashed border-brand-300 bg-white/50 py-3 text-sm font-medium text-brand-700/70 transition hover:bg-white"
          >
            + Thêm thẻ từ vựng mới
          </button>
        )}
      </div>

      {filteredCards.length === 0 ? (
        <p className="animate-fade-in-up text-center text-sm text-brand-700/60">
          {deck.cards.length === 0
            ? "Chưa có thẻ nào trong bộ này. Thêm từ đầu tiên để bắt đầu học!"
            : "Không có thẻ nào trong nhóm này."}
        </p>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <div key={group.label ?? "all"} className="space-y-2">
              {group.label && (
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-700/50">
                  {group.label} · {group.cards.length}
                </p>
              )}
              {group.cards.map((card, i) => (
                <div key={card.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 25}ms` }}>
                  <CardListItem
                    card={card}
                    existingCategories={categories}
                    onUpdate={(updates) => onUpdateCard(card.id, updates)}
                    onDelete={() => onDeleteCard(card.id)}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
