import { useCallback, useEffect, useMemo, useState } from "react";

import { getVocabs, updateVocab } from "../api/client";
import CollectionPicker from "../components/CollectionPicker";
import { useCollectionSelection } from "../hooks/useCollectionSelection";
import type { Vocab } from "../types";

type FlashcardDirection = "german-to-meaning" | "meaning-to-german";

function toSafeString(value: string | null | undefined): string {
  return value ?? "";
}

function normalizeText(value: string | null | undefined): string {
  return toSafeString(value).trim().toLowerCase();
}

function isInDateRange(
  createdAt: string,
  fromDate: string,
  toDate: string
): boolean {
  if (!fromDate && !toDate) {
    return true;
  }

  const createdDate = new Date(createdAt);

  if (Number.isNaN(createdDate.getTime())) {
    return true;
  }

  if (fromDate) {
    const from = new Date(`${fromDate}T00:00:00`);

    if (createdDate < from) {
      return false;
    }
  }

  if (toDate) {
    const to = new Date(`${toDate}T23:59:59`);

    if (createdDate > to) {
      return false;
    }
  }

  return true;
}

function shuffleArray<T>(items: T[]): T[] {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const temp = shuffled[index];

    shuffled[index] = shuffled[randomIndex];
    shuffled[randomIndex] = temp;
  }

  return shuffled;
}

function getExampleLines(examples: string | null | undefined): string[] {
  return toSafeString(examples)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function FlashcardsPage() {
  const {
    collections,
    collectionsLoaded,
    collectionError,
    selectedCollectionId,
    activeCollection,
    selectCollection,
    createNewCollection,
  } = useCollectionSelection("/cards");

  const [vocabs, setVocabs] = useState<Vocab[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [shuffledIds, setShuffledIds] = useState<number[]>([]);
  const [isExamplesModalOpen, setIsExamplesModalOpen] = useState(false);

  const [direction, setDirection] = useState<FlashcardDirection>(
    "german-to-meaning"
  );

  const [searchText, setSearchText] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const resetCardState = () => {
    setCurrentIndex(0);
    setIsRevealed(false);
    setIsExamplesModalOpen(false);
  };

  const loadVocabs = useCallback(async (): Promise<void> => {
    if (!selectedCollectionId) {
      setVocabs([]);
      setError("");
      setShuffledIds([]);
      resetCardState();
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await getVocabs({
        collectionId: selectedCollectionId,
      });

      setVocabs(data);
      setShuffledIds([]);
      setCurrentIndex(0);
      setIsRevealed(false);
      setIsExamplesModalOpen(false);
    } catch (err) {
      console.error(err);
      setError("Could not load flashcards. Please check the backend.");
    } finally {
      setLoading(false);
    }
  }, [selectedCollectionId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadVocabs();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadVocabs]);

  useEffect(() => {
    setSearchText("");
    setSelectedTopic("all");
    setShowStarredOnly(false);
    setFromDate("");
    setToDate("");
    setShuffledIds([]);
    resetCardState();
  }, [selectedCollectionId]);

  const topicOptions = useMemo(() => {
    const uniqueTopics = new Set<string>();

    vocabs.forEach((vocab) => {
      const topic = toSafeString(vocab.topic).trim();

      if (topic) {
        uniqueTopics.add(topic);
      }
    });

    return Array.from(uniqueTopics).sort((a, b) => a.localeCompare(b));
  }, [vocabs]);

  const filteredVocabs = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    return vocabs.filter((vocab) => {
      const german = normalizeText(vocab.german);
      const vietnamese = normalizeText(vocab.vietnamese);
      const topic = normalizeText(vocab.topic);

      const matchesSearch =
        !keyword ||
        german.includes(keyword) ||
        vietnamese.includes(keyword) ||
        topic.includes(keyword);

      const matchesTopic =
        selectedTopic === "all" || topic === selectedTopic.toLowerCase();

      const matchesStar = !showStarredOnly || vocab.is_starred === true;

      const matchesDate = isInDateRange(vocab.created_at, fromDate, toDate);

      return matchesSearch && matchesTopic && matchesStar && matchesDate;
    });
  }, [vocabs, searchText, selectedTopic, showStarredOnly, fromDate, toDate]);

  const practiceVocabs = useMemo(() => {
    if (shuffledIds.length === 0) {
      return filteredVocabs;
    }

    const vocabMap = new Map(filteredVocabs.map((vocab) => [vocab.id, vocab]));

    const shuffledVocabs = shuffledIds
      .map((id) => vocabMap.get(id))
      .filter((vocab): vocab is Vocab => Boolean(vocab));

    const remainingVocabs = filteredVocabs.filter(
      (vocab) => !shuffledIds.includes(vocab.id)
    );

    return [...shuffledVocabs, ...remainingVocabs];
  }, [filteredVocabs, shuffledIds]);

  const activeIndex =
    practiceVocabs.length > 0 ? currentIndex % practiceVocabs.length : 0;

  const activeVocab =
    practiceVocabs.length > 0 ? practiceVocabs[activeIndex] : null;

  const activeExampleLines = getExampleLines(activeVocab?.examples);

  const frontText =
    direction === "german-to-meaning"
      ? activeVocab?.german ?? ""
      : activeVocab?.vietnamese ?? "";

  const backText =
    direction === "german-to-meaning"
      ? activeVocab?.vietnamese ?? ""
      : activeVocab?.german ?? "";

  const frontLabel =
    direction === "german-to-meaning" ? "German" : "Meaning";

  const backLabel =
    direction === "german-to-meaning" ? "Meaning" : "German";

  const handlePrevious = () => {
    if (practiceVocabs.length === 0) {
      return;
    }

    setIsRevealed(false);
    setIsExamplesModalOpen(false);

    setCurrentIndex((current) =>
      current === 0 ? practiceVocabs.length - 1 : current - 1
    );
  };

  const handleNext = () => {
    if (practiceVocabs.length === 0) {
      return;
    }

    setIsRevealed(false);
    setIsExamplesModalOpen(false);

    setCurrentIndex((current) => (current + 1) % practiceVocabs.length);
  };

  const handleShuffle = () => {
    if (filteredVocabs.length <= 1) {
      return;
    }

    const shuffledVocabs = shuffleArray(filteredVocabs);

    setShuffledIds(shuffledVocabs.map((vocab) => vocab.id));
    setCurrentIndex(0);
    setIsRevealed(false);
    setIsExamplesModalOpen(false);
  };

  const handleClearFilters = () => {
    setSearchText("");
    setSelectedTopic("all");
    setShowStarredOnly(false);
    setFromDate("");
    setToDate("");
    setShuffledIds([]);
    resetCardState();
  };

  const handleToggleStar = async (vocab: Vocab) => {
    const nextStarredValue = vocab.is_starred !== true;

    try {
      setVocabs((currentVocabs) =>
        currentVocabs.map((item) =>
          item.id === vocab.id
            ? {
                ...item,
                is_starred: nextStarredValue,
              }
            : item
        )
      );

      await updateVocab(vocab.id, {
        german: vocab.german,
        vietnamese: vocab.vietnamese,
        examples: vocab.examples ?? "",
        topic: vocab.topic ?? null,
        collection_id: vocab.collection_id ?? selectedCollectionId,
        swipe_count: vocab.swipe_count,
        is_starred: nextStarredValue,
      });
    } catch (err) {
      console.error(err);

      setVocabs((currentVocabs) =>
        currentVocabs.map((item) =>
          item.id === vocab.id
            ? {
                ...item,
                is_starred: vocab.is_starred,
              }
            : item
        )
      );

      alert("Could not update star. Please check the backend.");
    }
  };

  return (
    <main className="flashcards-page-with-picker">
      <CollectionPicker
        label="Flashcards"
        title="Choose Your Collection"
        description="Select a vocabulary collection and practice its cards directly."
        collections={collections}
        selectedCollectionId={selectedCollectionId}
        collectionError={collectionError}
        onSelectCollection={selectCollection}
        onCreateCollection={createNewCollection}
      />

      {!selectedCollectionId && collectionsLoaded && collections.length === 0 ? (
        <div className="cute-card empty-state-card">
          <h2>Create your first collection</h2>
          <p>
            Use the collection drawer to create a vocabulary collection first.
            Then add words in Word Book to practice flashcards.
          </p>
        </div>
      ) : null}

      <section className="cute-card flashcards-practice-header">
        <span className="badge">
          {activeCollection ? activeCollection.name : "No Collection"}
        </span>

        <div className="flashcards-title-row">
          <div>
            <h2>Practice Your Vocabulary</h2>
            <p>
              Review saved words with filters, starred words, and both practice
              directions.
            </p>
          </div>

          <button
            type="button"
            className="cute-button soft"
            onClick={() => void loadVocabs()}
            disabled={loading || !selectedCollectionId}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        <div className="flashcard-direction-toggle">
          <button
            type="button"
            className={
              direction === "german-to-meaning" ? "is-active" : undefined
            }
            onClick={() => {
              setDirection("german-to-meaning");
              setIsRevealed(false);
              setIsExamplesModalOpen(false);
            }}
          >
            German → Meaning
          </button>

          <button
            type="button"
            className={
              direction === "meaning-to-german" ? "is-active" : undefined
            }
            onClick={() => {
              setDirection("meaning-to-german");
              setIsRevealed(false);
              setIsExamplesModalOpen(false);
            }}
          >
            Meaning → German
          </button>
        </div>

        <div className="flashcards-filter-grid">
          <input
            value={searchText}
            onChange={(event) => {
              setSearchText(event.target.value);
              setShuffledIds([]);
              resetCardState();
            }}
            placeholder="Search German word, meaning, topic..."
          />

          <select
            value={selectedTopic}
            onChange={(event) => {
              setSelectedTopic(event.target.value);
              setShuffledIds([]);
              resetCardState();
            }}
          >
            <option value="all">All topics</option>

            {topicOptions.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={fromDate}
            onChange={(event) => {
              setFromDate(event.target.value);
              setShuffledIds([]);
              resetCardState();
            }}
            aria-label="From date"
          />

          <input
            type="date"
            value={toDate}
            onChange={(event) => {
              setToDate(event.target.value);
              setShuffledIds([]);
              resetCardState();
            }}
            aria-label="To date"
          />

          <button
            type="button"
            className={
              showStarredOnly ? "cute-button primary" : "cute-button soft"
            }
            onClick={() => {
              setShowStarredOnly((currentValue) => !currentValue);
              setShuffledIds([]);
              resetCardState();
            }}
          >
            ⭐ Starred
          </button>

          <button
            type="button"
            className="cute-button soft"
            onClick={handleClearFilters}
          >
            Clear
          </button>

          <button
            type="button"
            className="cute-button soft"
            onClick={handleShuffle}
            disabled={filteredVocabs.length <= 1}
          >
            Shuffle
          </button>
        </div>

        <div className="flashcard-filter-summary">
          Showing {filteredVocabs.length} / {vocabs.length} cards
        </div>

        {error || collectionError ? (
          <p className="collection-error">{error || collectionError}</p>
        ) : null}
      </section>

      <section className="single-card-study">
        {!selectedCollectionId ? (
          <div className="cute-card empty-deck">
            <h3>No collection selected</h3>
            <p>Please choose a collection from the collection drawer.</p>
          </div>
        ) : activeVocab ? (
          <>
            <div className="study-progress-row">
              <span className="study-counter">
                {activeIndex + 1} / {practiceVocabs.length}
              </span>
            </div>

            <div className="study-deck">
              <button
                type="button"
                className="study-nav-btn"
                onClick={handlePrevious}
                aria-label="Previous card"
              >
                ←
              </button>

              <article
                className={`study-card ${isRevealed ? "is-revealed" : ""}`}
                onClick={() => setIsRevealed((currentValue) => !currentValue)}
              >
                <button
                  type="button"
                  className={
                    activeVocab.is_starred === true
                      ? "flashcard-star-btn is-starred"
                      : "flashcard-star-btn"
                  }
                  onClick={(event) => {
                    event.stopPropagation();
                    void handleToggleStar(activeVocab);
                  }}
                  title={
                    activeVocab.is_starred === true
                      ? "Remove from starred cards"
                      : "Mark this card as important"
                  }
                  aria-label={
                    activeVocab.is_starred === true
                      ? "Remove from starred cards"
                      : "Mark this card as important"
                  }
                >
                  {activeVocab.is_starred === true ? "★" : "☆"}
                </button>

                <div
                  className={
                    isRevealed
                      ? "study-card-face study-card-back"
                      : "study-card-face study-card-front"
                  }
                >
                  <span className="study-card-label">
                    {isRevealed ? backLabel : frontLabel}
                  </span>

                  <div className="study-card-sparkle">
                    {isRevealed ? "🌿" : "✨"}
                  </div>

                  <h3>{isRevealed ? backText : frontText}</h3>

                  <small>{isRevealed ? "Tap to hide" : "Tap to reveal"}</small>

                  {isRevealed && activeExampleLines.length > 0 ? (
                    <button
                      type="button"
                      className="cute-button soft flashcard-center-example-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        setIsExamplesModalOpen(true);
                      }}
                    >
                      Example Sentences
                    </button>
                  ) : null}

                  {activeVocab.topic ? (
                    <span className="flashcard-topic-pill">
                      Topic: {activeVocab.topic}
                    </span>
                  ) : null}
                </div>
              </article>

              <button
                type="button"
                className="study-nav-btn"
                onClick={handleNext}
                aria-label="Next card"
              >
                →
              </button>
            </div>
          </>
        ) : (
          <div className="cute-card empty-deck">
            <h3>No cards found</h3>
            <p>
              Try clearing the filters or add more words in the Word Book page.
            </p>
          </div>
        )}
      </section>

      {isExamplesModalOpen && activeVocab ? (
        <div
          className="examples-modal-backdrop"
          role="presentation"
          onClick={() => setIsExamplesModalOpen(false)}
        >
          <section
            className="examples-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Example sentences"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="examples-modal-header">
              <div>
                <span className="badge">Example Sentences</span>
                <h3>{activeVocab.german}</h3>
                <p>{activeVocab.vietnamese}</p>
              </div>

              <button
                type="button"
                className="examples-modal-close"
                onClick={() => setIsExamplesModalOpen(false)}
                aria-label="Close examples modal"
              >
                ×
              </button>
            </div>

            <div className="examples-modal-body">
              {activeExampleLines.length > 0 ? (
                activeExampleLines.map((line, index) => (
                  <div key={`${line}-${index}`} className="example-line">
                    <span>{index + 1}</span>
                    <p>{line}</p>
                  </div>
                ))
              ) : (
                <p className="empty-state">No example sentences yet.</p>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

export default FlashcardsPage;