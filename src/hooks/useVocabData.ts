import { useCallback, useEffect, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { AppData, CardInput, Deck, VocabCard } from "../types";
import { nextBox, nextReviewAt } from "../lib/srs";
import { db } from "../lib/firebase";

// Cả app dùng chung đúng 1 tài liệu Firestore — mọi người có link (đã đăng nhập
// Google) đều đọc/ghi vào cùng chỗ này, nên ai cũng thấy cập nhật của người khác
// gần như ngay lập tức nhờ onSnapshot.
const SHARED_DOC = doc(db, "shared", "vocabData");

function newId(): string {
  return crypto.randomUUID();
}

export function useVocabData() {
  const [data, setData] = useState<AppData>({ decks: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      SHARED_DOC,
      { includeMetadataChanges: true },
      (snap) => {
        if (snap.exists()) {
          // `hasPendingWrites` là true khi vẫn còn ghi CỦA CHÍNH MÌNH cho tài
          // liệu này chưa được server xác nhận — Firestore chỉ trả về false khi
          // MỌI ghi đang chờ (kể cả khi bấm 2 thao tác liên tiếp thật nhanh, vd:
          // thêm bộ mới rồi xoá bộ cũ ngay sau) đã được xác nhận hết. Trước đây
          // dùng một cờ boolean tự quản lý, nhưng cờ đó bị lần ghi ĐẦU tắt sớm
          // trong khi lần ghi THỨ HAI vẫn đang treo, khiến snapshot cũ (chưa có
          // thay đổi thứ hai) đè mất thao tác vừa làm.
          if (!snap.metadata.hasPendingWrites) {
            const remote = snap.data() as AppData;
            setData(remote.decks ? remote : { decks: [] });
          }
        } else {
          setDoc(SHARED_DOC, { decks: [] });
        }
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, []);

  const updateRemote = useCallback((updater: (prev: AppData) => AppData) => {
    setData((prev) => {
      const next = updater(prev);
      setDoc(SHARED_DOC, next).catch(() => {});
      return next;
    });
  }, []);

  const createDeck = useCallback(
    (name: string, description?: string) => {
      const now = Date.now();
      const deck: Deck = {
        id: newId(),
        name: name.trim(),
        description: description?.trim() || undefined,
        cards: [],
        createdAt: now,
        updatedAt: now,
      };
      updateRemote((prev) => ({ decks: [...prev.decks, deck] }));
      return deck.id;
    },
    [updateRemote]
  );

  const renameDeck = useCallback(
    (deckId: string, name: string, description?: string) => {
      updateRemote((prev) => ({
        decks: prev.decks.map((d) =>
          d.id === deckId
            ? { ...d, name: name.trim(), description: description?.trim() || undefined, updatedAt: Date.now() }
            : d
        ),
      }));
    },
    [updateRemote]
  );

  const deleteDeck = useCallback(
    (deckId: string) => {
      updateRemote((prev) => ({ decks: prev.decks.filter((d) => d.id !== deckId) }));
    },
    [updateRemote]
  );

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
      updateRemote((prev) => ({
        decks: prev.decks.map((d) =>
          d.id === deckId ? { ...d, cards: [...d.cards, newCard], updatedAt: now } : d
        ),
      }));
      return newCard.id;
    },
    [updateRemote]
  );

  const updateCard = useCallback(
    (deckId: string, cardId: string, updates: CardInput) => {
      updateRemote((prev) => ({
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
    },
    [updateRemote]
  );

  const deleteCard = useCallback(
    (deckId: string, cardId: string) => {
      updateRemote((prev) => ({
        decks: prev.decks.map((d) =>
          d.id === deckId
            ? { ...d, cards: d.cards.filter((c) => c.id !== cardId), updatedAt: Date.now() }
            : d
        ),
      }));
    },
    [updateRemote]
  );

  const reviewCard = useCallback(
    (deckId: string, cardId: string, remembered: boolean) => {
      updateRemote((prev) => ({
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
    },
    [updateRemote]
  );

  return {
    decks: data.decks,
    loading,
    createDeck,
    renameDeck,
    deleteDeck,
    addCard,
    updateCard,
    deleteCard,
    reviewCard,
  };
}
