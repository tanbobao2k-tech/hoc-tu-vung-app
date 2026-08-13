import { useCallback, useEffect, useMemo, useState } from "react";
import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { CardInput, Deck, VocabCard } from "../types";
import { nextBox, nextReviewAt } from "../lib/srs";
import { db } from "../lib/firebase";

// Mỗi bộ thẻ là 1 document trong collection "decks"; thẻ từ vựng nằm trong
// subcollection "cards" của bộ thẻ đó. Tách riêng (thay vì gộp hết vào 1
// document như trước) vì luật bảo mật cần biết CHÍNH XÁC ai tạo ra từng bộ/thẻ
// để chỉ người đó (hoặc chủ bộ thẻ) mới sửa/xoá được — không thể phân quyền
// theo từng phần tử bên trong một mảng gộp chung.
interface DeckMeta {
  name: string;
  description?: string;
  createdBy: string;
  createdByEmail?: string | null;
  createdAt: number;
  updatedAt: number;
}

function newCardPayload(uid: string, email: string | null, card: CardInput) {
  const now = Date.now();
  return {
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
    createdBy: uid,
    createdByEmail: email,
    createdAt: now,
    updatedAt: now,
  };
}

export function useVocabData(uid: string, userEmail: string | null) {
  const [deckDocs, setDeckDocs] = useState<Record<string, DeckMeta>>({});
  const [cardsByDeck, setCardsByDeck] = useState<Record<string, VocabCard[]>>({});
  const [decksLoaded, setDecksLoaded] = useState(false);
  const [cardsLoaded, setCardsLoaded] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "decks"),
      { includeMetadataChanges: true },
      (snap) => {
        if (snap.metadata.hasPendingWrites) return;
        setSyncError(null);
        const next: Record<string, DeckMeta> = {};
        snap.forEach((d) => {
          next[d.id] = d.data() as DeckMeta;
        });
        setDeckDocs(next);
        setDecksLoaded(true);
      },
      (err) => {
        setSyncError(`Không đọc được danh sách bộ thẻ: ${err.message}`);
        setDecksLoaded(true);
      }
    );
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      collectionGroup(db, "cards"),
      { includeMetadataChanges: true },
      (snap) => {
        if (snap.metadata.hasPendingWrites) return;
        setSyncError(null);
        const next: Record<string, VocabCard[]> = {};
        snap.forEach((d) => {
          const deckId = d.ref.parent.parent?.id;
          if (!deckId) return;
          (next[deckId] ??= []).push({ id: d.id, ...(d.data() as Omit<VocabCard, "id">) });
        });
        setCardsByDeck(next);
        setCardsLoaded(true);
      },
      (err) => {
        setSyncError(`Không đọc được thẻ từ vựng: ${err.message}`);
        setCardsLoaded(true);
      }
    );
    return unsub;
  }, []);

  const decks: Deck[] = useMemo(() => {
    return Object.entries(deckDocs)
      .map(([id, meta]) => ({
        id,
        name: meta.name,
        description: meta.description,
        createdBy: meta.createdBy,
        createdByEmail: meta.createdByEmail,
        createdAt: meta.createdAt,
        updatedAt: meta.updatedAt,
        cards: (cardsByDeck[id] ?? []).slice().sort((a, b) => a.createdAt - b.createdAt),
      }))
      .sort((a, b) => a.createdAt - b.createdAt);
  }, [deckDocs, cardsByDeck]);

  const createDeck = useCallback(
    (name: string, description?: string) => {
      const ref = doc(collection(db, "decks"));
      const now = Date.now();
      setDoc(ref, {
        name: name.trim(),
        description: description?.trim() || undefined,
        createdBy: uid,
        createdByEmail: userEmail,
        createdAt: now,
        updatedAt: now,
      }).catch((err) => setSyncError(`Không tạo được bộ thẻ: ${err.message}`));
      return ref.id;
    },
    [uid, userEmail]
  );

  const renameDeck = useCallback((deckId: string, name: string, description?: string) => {
    updateDoc(doc(db, "decks", deckId), {
      name: name.trim(),
      description: description?.trim() || undefined,
      updatedAt: Date.now(),
    }).catch((err) => setSyncError(`Không đổi được tên bộ thẻ: ${err.message}`));
  }, []);

  const deleteDeck = useCallback((deckId: string) => {
    (async () => {
      const cardsSnap = await getDocs(collection(db, "decks", deckId, "cards"));
      await Promise.all(cardsSnap.docs.map((c) => deleteDoc(c.ref)));
      await deleteDoc(doc(db, "decks", deckId));
    })().catch((err) => setSyncError(`Không xoá được bộ thẻ: ${err.message}`));
  }, []);

  const addCard = useCallback(
    (deckId: string, card: CardInput) => {
      const ref = doc(collection(db, "decks", deckId, "cards"));
      setDoc(ref, newCardPayload(uid, userEmail, card)).catch((err) =>
        setSyncError(`Không thêm được thẻ: ${err.message}`)
      );
      return ref.id;
    },
    [uid, userEmail]
  );

  const updateCard = useCallback((deckId: string, cardId: string, updates: CardInput) => {
    updateDoc(doc(db, "decks", deckId, "cards", cardId), {
      front: updates.front.trim(),
      back: updates.back.trim(),
      phonetic: updates.phonetic?.trim() || undefined,
      audioUrl: updates.audioUrl,
      imageUrl: updates.imageUrl,
      category: updates.category?.trim() || undefined,
      examples: updates.examples,
      updatedAt: Date.now(),
    }).catch((err) => setSyncError(`Không lưu được thay đổi: ${err.message}`));
  }, []);

  const deleteCard = useCallback((deckId: string, cardId: string) => {
    deleteDoc(doc(db, "decks", deckId, "cards", cardId)).catch((err) =>
      setSyncError(`Không xoá được thẻ: ${err.message}`)
    );
  }, []);

  // Đánh dấu tiến độ ôn tập (box/reviewCount) không tính là "sửa nội dung" —
  // ai học thẻ nào cũng ghi lại được tiến độ của lượt học đó, kể cả thẻ do
  // người khác thêm (luật Firestore cho phép riêng các field này).
  const reviewCard = useCallback(
    (deckId: string, cardId: string, remembered: boolean) => {
      const card = decks.find((d) => d.id === deckId)?.cards.find((c) => c.id === cardId);
      if (!card) return;
      const box = nextBox(card.box, remembered);
      updateDoc(doc(db, "decks", deckId, "cards", cardId), {
        box,
        nextReviewAt: nextReviewAt(box),
        reviewCount: card.reviewCount + 1,
        updatedAt: Date.now(),
      }).catch((err) => setSyncError(`Không lưu được tiến độ ôn tập: ${err.message}`));
    },
    [decks]
  );

  return {
    decks,
    loading: !decksLoaded || !cardsLoaded,
    syncError,
    createDeck,
    renameDeck,
    deleteDeck,
    addCard,
    updateCard,
    deleteCard,
    reviewCard,
  };
}
