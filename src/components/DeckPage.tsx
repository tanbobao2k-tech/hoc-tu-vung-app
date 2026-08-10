import { useState } from "react";
import { CardInput, Deck } from "../types";
import { isDue } from "../lib/srs";
import CardForm from "./CardForm";
import CardListItem from "./CardListItem";

interface Props {
  deck: Deck;
  onBack: () => void;
  onAddCard: (card: CardInput) => void;
  onUpdateCard: (cardId: string, updates: CardInput) => void;
  onDeleteCard: (cardId: string) => void;
  onStartStudy: () => void;
  onStartQuiz: () => void;
}

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
  const dueCount = deck.cards.filter((c) => isDue(c.nextReviewAt)).length;

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
            disabled={deck.cards.length === 0}
            onClick={onStartStudy}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Học ({dueCount > 0 ? dueCount : deck.cards.length})
          </button>
          <button
            disabled={deck.cards.length < 2}
            onClick={onStartQuiz}
            className="rounded-lg bg-brand-100 px-4 py-2 text-sm font-medium text-brand-700 transition hover:bg-brand-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Kiểm tra
          </button>
        </div>
      </header>

      <div className="mb-4 animate-fade-in-up">
        {showAddForm ? (
          <CardForm
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

      {deck.cards.length === 0 ? (
        <p className="animate-fade-in-up text-center text-sm text-brand-700/60">
          Chưa có thẻ nào trong bộ này. Thêm từ đầu tiên để bắt đầu học!
        </p>
      ) : (
        <div className="space-y-2">
          {deck.cards.map((card, i) => (
            <div key={card.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 25}ms` }}>
              <CardListItem
                card={card}
                onUpdate={(updates) => onUpdateCard(card.id, updates)}
                onDelete={() => onDeleteCard(card.id)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
