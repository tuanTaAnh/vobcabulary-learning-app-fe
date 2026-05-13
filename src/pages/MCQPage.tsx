import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getMcq, recordMcq } from "../api/client";
import CollectionPicker from "../components/CollectionPicker";
import CuteButton from "../components/CuteButton";
import { useCollectionSelection } from "../hooks/useCollectionSelection";
import type { McqQuestion } from "../types";

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
  const [selectedOption, setSelectedOption] = useState("");
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadQuestion();
  }, [selectedCollectionId]);

  async function loadQuestion() {
    if (!selectedCollectionId) {
      setQuestion(null);
      return;
    }

    setError("");
    setSelectedOption("");
    setChecked(false);
    setIsCorrect(false);

    try {
      const data = await getMcq({
        collectionId: selectedCollectionId,
      });

      setQuestion(data);
    } catch {
      setQuestion(null);
      setError("This collection needs at least 4 words to generate a quiz.");
    }
  }

  async function handleCheckAnswer() {
    if (!question || !selectedOption) return;

    const correct = selectedOption === question.answer;

    setChecked(true);
    setIsCorrect(correct);

    try {
      await recordMcq({
        vocab_id: question.vocab_id,
        correct,
      });
    } catch {
      // Do not block the UI if tracking fails.
    }
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
                  <h3>{question.question}</h3>
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
                    {isCorrect
                      ? "Correct!"
                      : `Not quite. Correct answer: ${question.answer}`}
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

                  <CuteButton onClick={loadQuestion}>
                    Next Question
                  </CuteButton>
                </div>
              </>
            )}
          </div>
        </section>
      )}
    </section>
  );
}

export default MCQPage;