import { useCallback, useEffect, useState } from "react";
import { AppData, CardInput, Deck, VocabCard } from "../types";
import { nextBox, nextReviewAt } from "../lib/srs";

const STORAGE_KEY = "hoc-tu-vung:data";

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { decks: [] };
    const parsed = JSON.parse(raw) as AppData;
    return parsed.decks ? parsed : { decks: [] };
  } catch {
    return { decks: [] };
  }
}

function newId(): string {
  return crypto.randomUUID();
}

export function useVocabData() {
  const [data, setData] = useState<AppData>(() => loadData());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const createDeck = useCallback((name: string, description?: string) => {
    const now = Date.now();
    const deck: Deck = {
      id: newId(),
      name: name.trim(),
      description: description?.trim() || undefined,
      cards: [],
      createdAt: now,
      updatedAt: now,
    };
    setData((prev) => ({ decks: [...prev.decks, deck] }));
    return deck.id;
  }, []);

  const renameDeck = useCallback((deckId: string, name: string, description?: string) => {
    setData((prev) => ({
      decks: prev.decks.map((d) =>
        d.id === deckId
          ? { ...d, name: name.trim(), description: description?.trim() || undefined, updatedAt: Date.now() }
          : d
      ),
    }));
  }, []);

  const deleteDeck = useCallback((deckId: string) => {
    setData((prev) => ({ decks: prev.decks.filter((d) => d.id !== deckId) }));
  }, []);

  const addCard = useCallback(
    (deckId: string, card: CardInput) => {
      const now = Date.now();
      const newCard: VocabCard = {
        id: newId(),
        front: card.front.trim(),
        back: card.back.trim(),
        phonetic: card.phonetic?.trim() || undefined,
        audioUrl: card.audioUrl,
        imageUrl: card.imageUrl,
        category: card.category?.trim() || undefined,
        examples: card.examples?.length ? card.examples : undefined,
        box: 1,
        nextReviewAt: now,
        reviewCount: 0,
        createdAt: now,
        updatedAt: now,
      };
      setData((prev) => ({
        decks: prev.decks.map((d) =>
          d.id === deckId ? { ...d, cards: [...d.cards, newCard], updatedAt: now } : d
        ),
      }));
      return newCard.id;
    },
    []
  );

  const updateCard = useCallback((deckId: string, cardId: string, updates: CardInput) => {
    setData((prev) => ({
      decks: prev.decks.map((d) => {
        if (d.id !== deckId) return d;
        return {
          ...d,
          cards: d.cards.map((c) =>
            c.id === cardId
              ? {
                  ...c,
                  front: updates.front.trim(),
                  back: updates.back.trim(),
                  phonetic: updates.phonetic?.trim() || undefined,
                  audioUrl: updates.audioUrl ?? c.audioUrl,
                  imageUrl: updates.imageUrl ?? c.imageUrl,
                  category: updates.category?.trim() || undefined,
                  examples: updates.examples ?? c.examples,
                  updatedAt: Date.now(),
                }
              : c
          ),
          updatedAt: Date.now(),
        };
      }),
    }));
  }, []);

  const deleteCard = useCallback((deckId: string, cardId: string) => {
    setData((prev) => ({
      decks: prev.decks.map((d) =>
        d.id === deckId
          ? { ...d, cards: d.cards.filter((c) => c.id !== cardId), updatedAt: Date.now() }
          : d
      ),
    }));
  }, []);

  const reviewCard = useCallback((deckId: string, cardId: string, remembered: boolean) => {
    setData((prev) => ({
      decks: prev.decks.map((d) => {
        if (d.id !== deckId) return d;
        return {
          ...d,
          cards: d.cards.map((c) => {
            if (c.id !== cardId) return c;
            const box = nextBox(c.box, remembered);
            return {
              ...c,
              box,
              nextReviewAt: nextReviewAt(box),
              reviewCount: c.reviewCount + 1,
              updatedAt: Date.now(),
            };
          }),
        };
      }),
    }));
  }, []);

  return {
    decks: data.decks,
    createDeck,
    renameDeck,
    deleteDeck,
    addCard,
    updateCard,
    deleteCard,
    reviewCard,
  };
}
