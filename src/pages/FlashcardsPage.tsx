import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createCollection,
  getCollections,
  getVocabs,
  updateVocab,
} from "../api/client";
import CollectionPicker from "../components/CollectionPicker";
import type { Collection, Vocab } from "../types";

type FlashcardDirection = "german-to-meaning" | "meaning-to-german";

function toSafeString(value: string | null | undefined): string {
  return value ?? "";
}

function normalizeText(value: string | null | undefined): string {
  return toSafeString(value).trim().toLowerCase();
}

function splitExampleLines(value: string | null | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
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

function FlashcardsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionsLoaded, setCollectionsLoaded] = useState(false);
  const [collectionError, setCollectionError] = useState("");
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(
    null
  );

  const [vocabs, setVocabs] = useState<Vocab[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [examplesVocab, setExamplesVocab] = useState<Vocab | null>(null);

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

  const activeCollection = useMemo(() => {
    return (
      collections.find((collection) => collection.id === selectedCollectionId) ??
      null
    );
  }, [collections, selectedCollectionId]);

  const exampleLines = useMemo(() => {
    return splitExampleLines(examplesVocab?.examples);
  }, [examplesVocab]);

  const resetCardState = () => {
    setCurrentIndex(0);
    setIsRevealed(false);
    setExamplesVocab(null);
  };

  const resetFilters = () => {
    setSearchText("");
    setSelectedTopic("all");
    setShowStarredOnly(false);
    setFromDate("");
    setToDate("");
    resetCardState();
  };

  const loadCollections = useCallback(async (): Promise<void> => {
    try {
      setCollectionError("");

      const data = await getCollections();

      setCollections(data);
      setCollectionsLoaded(true);

      setSelectedCollectionId((currentId) => {
        if (currentId !== null) {
          const currentStillExists = data.some(
            (collection) => collection.id === currentId
          );

          if (currentStillExists) {
            return currentId;
          }
        }

        const germanVocabCollection = data.find(
          (collection) => collection.name.toLowerCase() === "german vocab"
        );

        if (germanVocabCollection) {
          return germanVocabCollection.id;
        }

        return data.length > 0 ? data[0].id : null;
      });
    } catch (err) {
      console.error(err);
      setCollectionsLoaded(true);
      setCollectionError("Could not load collections.");
    }
  }, []);

  const loadVocabs = useCallback(async (): Promise<void> => {
    if (!selectedCollectionId) {
      setVocabs([]);
      setError("");
      setCurrentIndex(0);
      setIsRevealed(false);
      setExamplesVocab(null);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await getVocabs({
        collectionId: selectedCollectionId,
      });

      setVocabs(data);
      setCurrentIndex(0);
      setIsRevealed(false);
      setExamplesVocab(null);
    } catch (err) {
      console.error(err);
      setError("Could not load flashcards. Please check the backend.");
    } finally {
      setLoading(false);
    }
  }, [selectedCollectionId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCollections();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadCollections]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadVocabs();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadVocabs]);

  useEffect(() => {
    resetFilters();
  }, [selectedCollectionId]);

  const selectCollection = (collectionId: string) => {
    setSelectedCollectionId(collectionId ? Number(collectionId) : null);
  };

  const createNewCollection = async (data: {
    name: string;
    description?: string;
  }) => {
    const collection = await createCollection(data);

    await loadCollections();
    setSelectedCollectionId(collection.id);

    return collection;
  };

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

  const activeIndex =
    filteredVocabs.length > 0 ? currentIndex % filteredVocabs.length : 0;

  const activeVocab =
    filteredVocabs.length > 0 ? filteredVocabs[activeIndex] : null;

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
    if (filteredVocabs.length === 0) {
      return;
    }

    setIsRevealed(false);
    setExamplesVocab(null);
    setCurrentIndex((current) =>
      current === 0 ? filteredVocabs.length - 1 : current - 1
    );
  };

  const handleNext = () => {
    if (filteredVocabs.length === 0) {
      return;
    }

    setIsRevealed(false);
    setExamplesVocab(null);
    setCurrentIndex((current) => (current + 1) % filteredVocabs.length);
  };

  const handleShuffle = () => {
    if (filteredVocabs.length <= 1) {
      return;
    }

    const nextIndex = Math.floor(Math.random() * filteredVocabs.length);
    setCurrentIndex(nextIndex);
    setIsRevealed(false);
    setExamplesVocab(null);
  };

  const handleClearFilters = () => {
    resetFilters();
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
              setExamplesVocab(null);
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
              setExamplesVocab(null);
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
              resetCardState();
            }}
            placeholder="Search German word, meaning, topic..."
          />

          <select
            value={selectedTopic}
            onChange={(event) => {
              setSelectedTopic(event.target.value);
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
              resetCardState();
            }}
            aria-label="From date"
          />

          <input
            type="date"
            value={toDate}
            onChange={(event) => {
              setToDate(event.target.value);
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
                {activeIndex + 1} / {filteredVocabs.length}
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

                  {isRevealed &&
                  splitExampleLines(activeVocab.examples).length > 0 ? (
                    <button
                      type="button"
                      className="examples-open-btn flashcard-center-example-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        setExamplesVocab(activeVocab);
                      }}
                    >
                      Example Sentences
                    </button>
                  ) : (
                    <small>
                      {isRevealed ? "Tap to hide" : "Tap to reveal"}
                    </small>
                  )}

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

      {examplesVocab ? (
        <div
          className="examples-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={`Example sentences for ${examplesVocab.german}`}
          onClick={() => setExamplesVocab(null)}
        >
          <section
            className="examples-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="examples-modal-header">
              <div>
                <span className="badge">Example Sentences</span>
                <h3>{examplesVocab.german}</h3>
                <p>{examplesVocab.vietnamese}</p>
              </div>

              <button
                type="button"
                className="examples-modal-close"
                onClick={() => setExamplesVocab(null)}
                aria-label="Close example sentences"
              >
                ×
              </button>
            </div>

            <div className="examples-modal-body">
              {exampleLines.length > 0 ? (
                exampleLines.map((line, index) => (
                  <div className="example-line" key={`${line}-${index}`}>
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