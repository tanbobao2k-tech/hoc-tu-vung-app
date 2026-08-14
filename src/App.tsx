import { useState } from "react";
import { useAuth } from "./hooks/useAuth";
import { useVocabData } from "./hooks/useVocabData";
import { VocabCard } from "./types";
import SignInPage from "./components/SignInPage";
import DeckListPage from "./components/DeckListPage";
import DeckPage from "./components/DeckPage";
import StudyPage from "./components/StudyPage";
import QuizPage from "./components/QuizPage";

type View =
  | { name: "decks" }
  | { name: "deck"; deckId: string }
  | { name: "study"; deckId: string; cards: VocabCard[] }
  | { name: "quiz"; deckId: string; cards: VocabCard[] };

export default function App() {
  const {
    user,
    loading: authLoading,
    needsEmailConfirm,
    error: authError,
    sendLink,
    confirmEmailAndSignIn,
    logOut,
  } = useAuth();
  // Hook phải gọi vô điều kiện (đúng luật Hooks) — khi chưa đăng nhập thì
  // uid rỗng, hook sẽ không có dữ liệu gì, không sao vì màn hình đăng nhập
  // được render trước khi bất cứ dữ liệu nào hiển thị ra.
  const {
    decks,
    loading: dataLoading,
    syncError,
    createDeck,
    renameDeck,
    deleteDeck,
    addCard,
    updateCard,
    deleteCard,
    reviewCard,
  } = useVocabData(user?.uid ?? "", user?.email ?? null);
  const [view, setView] = useState<View>({ name: "decks" });

  if (authLoading) return null;

  if (!user) {
    return (
      <SignInPage
        needsEmailConfirm={needsEmailConfirm}
        error={authError}
        onSendLink={sendLink}
        onConfirmEmail={confirmEmailAndSignIn}
      />
    );
  }

  if (dataLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-sm text-brand-700/60">
        Đang tải dữ liệu...
      </div>
    );
  }

  const activeDeck = "deckId" in view ? decks.find((d) => d.id === view.deckId) : undefined;

  let content;
  if (view.name === "decks" || !activeDeck) {
    content = (
      <DeckListPage
        decks={decks}
        currentUid={user.uid}
        userEmail={user.email}
        onSignOut={logOut}
        onCreateDeck={createDeck}
        onRenameDeck={renameDeck}
        onAddCard={addCard}
        onOpenDeck={(deckId) => setView({ name: "deck", deckId })}
        onDeleteDeck={deleteDeck}
      />
    );
  } else if (view.name === "deck") {
    content = (
      <DeckPage
        deck={activeDeck}
        currentUid={user.uid}
        onBack={() => setView({ name: "decks" })}
        onAddCard={(card) => addCard(activeDeck.id, card)}
        onUpdateCard={(cardId, updates) => updateCard(activeDeck.id, cardId, updates)}
        onDeleteCard={(cardId) => deleteCard(activeDeck.id, cardId)}
        onStartStudy={(cards) => setView({ name: "study", deckId: activeDeck.id, cards })}
        onStartQuiz={(cards) => setView({ name: "quiz", deckId: activeDeck.id, cards })}
      />
    );
  } else if (view.name === "study") {
    content = (
      <StudyPage
        cards={view.cards}
        onBack={() => setView({ name: "deck", deckId: activeDeck.id })}
        onReview={(cardId, remembered) => reviewCard(activeDeck.id, cardId, remembered)}
      />
    );
  } else {
    content = (
      <QuizPage
        deckName={activeDeck.name}
        cards={view.cards}
        onBack={() => setView({ name: "deck", deckId: activeDeck.id })}
        onReview={(cardId, remembered) => reviewCard(activeDeck.id, cardId, remembered)}
      />
    );
  }

  return (
    <>
      {syncError && (
        <div className="bg-red-50 px-4 py-2 text-center text-xs font-medium text-red-700">
          ⚠ {syncError}
        </div>
      )}
      {content}
    </>
  );
}
