import { useState } from "react";
import { useVocabData } from "./hooks/useVocabData";
import { VocabCard } from "./types";
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
  const { decks, createDeck, deleteDeck, addCard, updateCard, deleteCard, reviewCard } = useVocabData();
  const [view, setView] = useState<View>({ name: "decks" });

  const activeDeck = "deckId" in view ? decks.find((d) => d.id === view.deckId) : undefined;

  if (view.name === "decks" || !activeDeck) {
    return (
      <DeckListPage
        decks={decks}
        onCreateDeck={createDeck}
        onOpenDeck={(deckId) => setView({ name: "deck", deckId })}
        onDeleteDeck={deleteDeck}
      />
    );
  }

  if (view.name === "deck") {
    return (
      <DeckPage
        deck={activeDeck}
        onBack={() => setView({ name: "decks" })}
        onAddCard={(card) => addCard(activeDeck.id, card)}
        onUpdateCard={(cardId, updates) => updateCard(activeDeck.id, cardId, updates)}
        onDeleteCard={(cardId) => deleteCard(activeDeck.id, cardId)}
        onStartStudy={(cards) => setView({ name: "study", deckId: activeDeck.id, cards })}
        onStartQuiz={(cards) => setView({ name: "quiz", deckId: activeDeck.id, cards })}
      />
    );
  }

  if (view.name === "study") {
    return (
      <StudyPage
        cards={view.cards}
        onBack={() => setView({ name: "deck", deckId: activeDeck.id })}
        onReview={(cardId, remembered) => reviewCard(activeDeck.id, cardId, remembered)}
      />
    );
  }

  return (
    <QuizPage
      deckName={activeDeck.name}
      cards={view.cards}
      onBack={() => setView({ name: "deck", deckId: activeDeck.id })}
      onReview={(cardId, remembered) => reviewCard(activeDeck.id, cardId, remembered)}
    />
  );
}
