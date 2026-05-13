import { Link } from "react-router-dom";

function HomePage() {
  return (
    <section className="home-page">
      <div className="hero scenic-hero">
        <div className="hero-text">
          <span className="badge">Animated German Life</span>

          <h1>Learn German with scenes, stories, and playful practice.</h1>

          <p>
            Build your own word collection, flip animated flashcards, solve quizzes,
            and practice short conversations inspired by everyday life in Germany.
          </p>

          <div className="hero-actions">
            <Link to="/add" className="cute-link primary">
              Add New Words
            </Link>

            <Link to="/chat-game" className="cute-link soft">
              Explore AI Scenes
            </Link>
          </div>
        </div>

        <div className="hero-scene-card">
          <img
            src="/images/scenes/hero-germany-road.png"
            alt="Animated countryside scene in Germany"
          />
        </div>
      </div>

      <div className="feature-grid">
        <Link to="/cards" className="feature-card cute-card">
          <div className="feature-scene">
            <img
              src="/images/scenes/countryside-cartoon.png"
              alt="Flashcard scene"
            />
          </div>
          <h3>Flashcards</h3>
          <p>Flip cards, shuffle your word set, and filter by date or topic.</p>
        </Link>

        <Link to="/mcq" className="feature-card cute-card">
          <div className="feature-scene">
            <img
              src="/images/scenes/train-station-cartoon.png"
              alt="Quiz scene"
            />
          </div>
          <h3>Multiple Choice Quiz</h3>
          <p>Fill in the missing word and test your memory in context.</p>
        </Link>

        <Link to="/chat-game" className="feature-card cute-card">
          <div className="feature-scene">
            <img
              src="/images/scenes/farmers-market-cartoon.png"
              alt="AI scene practice"
            />
          </div>
          <h3>AI Scene Practice</h3>
          <p>Practice short guided conversations in lively everyday scenes.</p>
        </Link>

        <Link to="/stats" className="feature-card cute-card">
          <div className="feature-scene">
            <img
              src="/images/scenes/bakery-cartoon.png"
              alt="Progress scene"
            />
          </div>
          <h3>Progress Tracker</h3>
          <p>Track how many words you learned and how often you practice.</p>
        </Link>
      </div>
    </section>
  );
}

export default HomePage;