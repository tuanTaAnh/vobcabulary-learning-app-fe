import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { getMcq, getVocabs, recordMcq, updateVocab } from "../api/client";
import CollectionPicker from "../components/CollectionPicker";
import CuteButton from "../components/CuteButton";
import { useCollectionSelection } from "../hooks/useCollectionSelection";
import type { McqQuestion, Vocab } from "../types";

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Unknown date";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("vi-VN").format(date);
}

function MCQPage() {
  const {
    collections,
    collectionsLoaded,
    collectionError,
    selectedCollectionId,
    activeCollection,
    selectCollection,
    createNewCollection,
  } = useCollectionSelection("/mcq");

  const [question, setQuestion] = useState<McqQuestion | null>(null);
  const [collectionVocabs, setCollectionVocabs] = useState<Vocab[]>([]);

  const [selectedOption, setSelectedOption] = useState("");
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [error, setError] = useState("");

  const [selectedAnswerVocab, setSelectedAnswerVocab] = useState<Vocab | null>(
    null
  );

  const correctAnswer = question?.answer ?? question?.correct_answer ?? "";

  const correctAnswerVocab = useMemo(() => {
    if (!question || !correctAnswer) {
      return null;
    }

    const answerId = question.answer_id ?? question.vocab_id;

    if (answerId) {
      const vocabById = collectionVocabs.find((vocab) => vocab.id === answerId);

      if (vocabById) {
        return vocabById;
      }
    }

    return (
      collectionVocabs.find(
        (vocab) =>
          vocab.german.trim().toLowerCase() ===
          correctAnswer.trim().toLowerCase()
      ) ?? null
    );
  }, [question, correctAnswer, collectionVocabs]);

  const popupExamples = useMemo(() => {
    if (!selectedAnswerVocab?.examples) {
      return [];
    }

    return selectedAnswerVocab.examples
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }, [selectedAnswerVocab]);

  const selectedPopupCollection = useMemo(() => {
    if (!selectedAnswerVocab?.collection_id) {
      return activeCollection ?? null;
    }

    return (
      collections.find(
        (collection) => collection.id === selectedAnswerVocab.collection_id
      ) ??
      activeCollection ??
      null
    );
  }, [collections, activeCollection, selectedAnswerVocab]);

  const loadCollectionVocabs = useCallback(async () => {
    if (!selectedCollectionId) {
      setCollectionVocabs([]);
      return;
    }

    try {
      const data = await getVocabs({
        collectionId: selectedCollectionId,
      });

      setCollectionVocabs(data);
    } catch (err) {
      console.error(err);
      setCollectionVocabs([]);
    }
  }, [selectedCollectionId]);

  const loadQuestion = useCallback(async () => {
    if (!selectedCollectionId) {
      setQuestion(null);
      return;
    }

    setError("");
    setSelectedOption("");
    setChecked(false);
    setIsCorrect(false);
    setSelectedAnswerVocab(null);

    try {
      const data = await getMcq({
        collectionId: selectedCollectionId,
      });

      setQuestion(data);
    } catch {
      setQuestion(null);
      setError(
        "This collection needs at least 4 words with example sentences to generate a quiz."
      );
    }
  }, [selectedCollectionId]);

  useEffect(() => {
    void loadCollectionVocabs();
    void loadQuestion();
  }, [loadCollectionVocabs, loadQuestion]);

  async function handleCheckAnswer() {
    if (!question || !selectedOption || !correctAnswer) {
      return;
    }

    const correct = selectedOption === correctAnswer;

    setChecked(true);
    setIsCorrect(correct);

    try {
      await recordMcq({
        vocab_id: question.vocab_id ?? question.answer_id,
        correct,
      });
    } catch {
      // Do not block the UI if tracking fails.
    }
  }

  async function handleToggleStar(vocab: Vocab) {
    const nextStarredValue = vocab.is_starred !== true;

    try {
      setCollectionVocabs((currentVocabs) =>
        currentVocabs.map((item) =>
          item.id === vocab.id
            ? {
                ...item,
                is_starred: nextStarredValue,
              }
            : item
        )
      );

      if (selectedAnswerVocab?.id === vocab.id) {
        setSelectedAnswerVocab({
          ...selectedAnswerVocab,
          is_starred: nextStarredValue,
        });
      }

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

      setCollectionVocabs((currentVocabs) =>
        currentVocabs.map((item) =>
          item.id === vocab.id
            ? {
                ...item,
                is_starred: vocab.is_starred,
              }
            : item
        )
      );

      if (selectedAnswerVocab?.id === vocab.id) {
        setSelectedAnswerVocab(vocab);
      }

      alert("Could not update star. Please check the backend.");
    }
  }

  function openCorrectAnswerPopup() {
    if (correctAnswerVocab) {
      setSelectedAnswerVocab(correctAnswerVocab);
      return;
    }

    alert("Could not find this word detail in the current collection.");
  }

  return (
    <section className="mcq-page-with-picker">
      <CollectionPicker
        label="Quiz"
        title="Choose Your Collection"
        description="Select a vocabulary collection and practice multiple choice questions directly."
        collections={collections}
        selectedCollectionId={selectedCollectionId}
        collectionError={collectionError}
        onSelectCollection={selectCollection}
        onCreateCollection={createNewCollection}
      />

      {!selectedCollectionId && collectionsLoaded && collections.length === 0 && (
        <div className="cute-card empty-state-card">
          <h2>Create your first collection</h2>
          <p>
            Use the collection form above. Then add at least 4 words to start
            quiz practice.
          </p>
        </div>
      )}

      {selectedCollectionId && (
        <section className="quiz-page">
          <div className="cute-card quiz-card">
            <span className="badge">
              {activeCollection
                ? activeCollection.name
                : "Multiple Choice Quiz"}
            </span>

            <h2>Choose the Missing Word</h2>

            {error && (
              <div className="answer-result bad">
                {error}

                <p>
                  <Link
                    className="cute-link primary"
                    to={`/add?collectionId=${selectedCollectionId}`}
                  >
                    Add Words
                  </Link>
                </p>
              </div>
            )}

            {question && (
              <>
                <div className="question-bubble">
                  <span>🚆</span>
                  <h3>{question.question ?? question.prompt}</h3>
                </div>

                <div className="option-grid">
                  {question.options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`option-button ${
                        selectedOption === option ? "selected" : ""
                      }`}
                      onClick={() => setSelectedOption(option)}
                      disabled={checked}
                    >
                      {option}
                    </button>
                  ))}
                </div>

                {checked && (
                  <div
                    className={`answer-result ${
                      isCorrect ? "good" : "bad"
                    }`}
                  >
                    {isCorrect ? (
                      <>
                        Correct! Correct answer:{" "}
                        <button
                          type="button"
                          className="mcq-answer-link"
                          onClick={openCorrectAnswerPopup}
                        >
                          {correctAnswer}
                        </button>
                      </>
                    ) : (
                      <>
                        Not quite. Correct answer:{" "}
                        <button
                          type="button"
                          className="mcq-answer-link"
                          onClick={openCorrectAnswerPopup}
                        >
                          {correctAnswer}
                        </button>
                      </>
                    )}
                  </div>
                )}

                <div className="inline-actions">
                  <CuteButton
                    variant="primary"
                    onClick={handleCheckAnswer}
                    disabled={!selectedOption || checked}
                  >
                    Check Answer
                  </CuteButton>

                  <CuteButton onClick={() => void loadQuestion()}>
                    Next Question
                  </CuteButton>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {selectedAnswerVocab ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Details for ${selectedAnswerVocab.german}`}
          onClick={() => setSelectedAnswerVocab(null)}
          className="word-detail-modal-backdrop"
        >
          <section
            className="cute-card word-detail-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="word-detail-modal-header">
              <div>
                <span className="badge">
                  {selectedAnswerVocab.is_starred === true
                    ? "⭐ Starred Word"
                    : "Correct Answer"}
                </span>

                <h2>{selectedAnswerVocab.german}</h2>

                <p>{selectedAnswerVocab.vietnamese}</p>
              </div>

              <button
                type="button"
                className="word-detail-modal-close"
                onClick={() => setSelectedAnswerVocab(null)}
                aria-label="Close word details"
              >
                ×
              </button>
            </div>

            <div className="word-detail-info-grid">
              <div>
                <small>Topic</small>
                <strong>{selectedAnswerVocab.topic || "No topic"}</strong>
              </div>

              <div>
                <small>Collection</small>
                <strong>
                  {selectedPopupCollection?.name ?? "No collection"}
                </strong>
              </div>

              <div>
                <small>Added</small>
                <strong>{formatDate(selectedAnswerVocab.created_at)}</strong>
              </div>
            </div>

            <div className="word-detail-examples">
              <h3>Example Sentences</h3>

              {popupExamples.length > 0 ? (
                <div>
                  {popupExamples.map((example, index) => (
                    <p key={`${example}-${index}`}>
                      {index + 1}. {example}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No example sentences yet.</p>
              )}
            </div>

            <div className="word-detail-actions">
              <button
                type="button"
                className={
                  selectedAnswerVocab.is_starred === true
                    ? "cute-button primary"
                    : "cute-button soft"
                }
                onClick={() => void handleToggleStar(selectedAnswerVocab)}
              >
                {selectedAnswerVocab.is_starred === true
                  ? "★ Starred"
                  : "☆ Mark Starred"}
              </button>

              <Link
                className="cute-link soft"
                to={`/add?collectionId=${selectedCollectionId}`}
              >
                Go to Word Book
              </Link>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

export default MCQPage;