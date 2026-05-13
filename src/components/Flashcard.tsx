import type { Vocab } from "../types";

type Props = {
  vocab: Vocab;
  frontSide: "german" | "vietnamese";
  flipped: boolean;
  onFlip: () => void;
};

function Flashcard({ vocab, frontSide, flipped, onFlip }: Props) {
  const front = frontSide === "german" ? vocab.german : vocab.vietnamese;
  const backTitle = frontSide === "german" ? vocab.vietnamese : vocab.german;

  return (
    <div
      className={`flashcard-game ${flipped ? "is-flipped" : ""}`}
      onClick={onFlip}
    >
      {!flipped ? (
        <div className="flashcard-face front">
          <div className="card-emoji">✨</div>
          <h3>{front}</h3>
          {vocab.topic && <span className="pill">{vocab.topic}</span>}
          <small>Tap to reveal</small>
        </div>
      ) : (
        <div className="flashcard-face back">
          <div className="card-emoji">🌿</div>
          <h3>{backTitle}</h3>

          {vocab.examples && (
            <div className="mini-examples">
              {vocab.examples.split("\n").map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Flashcard;