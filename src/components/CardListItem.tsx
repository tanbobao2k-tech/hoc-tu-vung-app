import { useState } from "react";
import { CardInput, VocabCard } from "../types";
import { boxLabel } from "../lib/srs";
import PronounceButton from "./PronounceButton";
import CardForm from "./CardForm";

interface Props {
  card: VocabCard;
  existingCategories?: string[];
  onUpdate: (updates: CardInput) => void;
  onDelete: () => void;
}

const BOX_COLOR: Record<number, string> = {
  1: "bg-stone-100 text-stone-600",
  2: "bg-amber-100 text-amber-700",
  3: "bg-lime-100 text-lime-700",
  4: "bg-brand-100 text-brand-700",
  5: "bg-brand-600 text-white",
};

export default function CardListItem({ card, existingCategories, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <CardForm
        initial={card}
        existingCategories={existingCategories}
        onSubmit={(updates) => {
          onUpdate(updates);
          setEditing(false);
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-black/5">
      {card.imageUrl && (
        <img
          src={card.imageUrl}
          alt=""
          className="h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-black/5"
        />
      )}
      <PronounceButton word={card.front} audioUrl={card.audioUrl} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="truncate font-semibold text-brand-900">{card.front}</span>
          {card.phonetic && <span className="shrink-0 text-xs text-brand-700/50">{card.phonetic}</span>}
        </div>
        <div className="truncate text-sm text-brand-700/70">{card.back}</div>
      </div>
      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${BOX_COLOR[card.box]}`}>
        {boxLabel(card.box)}
      </span>
      <div className="flex shrink-0 items-center gap-1">
        <button
          onClick={() => setEditing(true)}
          className="rounded-lg px-2 py-1 text-xs text-brand-700/60 hover:bg-brand-50"
        >
          Sửa
        </button>
        <button
          onClick={onDelete}
          className="rounded-lg px-2 py-1 text-xs text-red-500/70 hover:bg-red-50"
        >
          Xóa
        </button>
      </div>
    </div>
  );
}
