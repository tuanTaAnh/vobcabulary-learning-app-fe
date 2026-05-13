import type { MouseEvent, ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";

type LayoutProps = {
  children: ReactNode;
};

function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();

  function navClass(baseClass: string) {
    return ({ isActive }: { isActive: boolean }) =>
      `${baseClass}${isActive ? " active" : ""}`;
  }

  function openScenePicker(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();

    // Force ChatGamePage to reset to the scene picker every time
    // the user clicks AI Scenes in the navbar.
    navigate(`/chat-game?picker=${Date.now()}`);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/" className="logo">
          <div className="logo-icon">🇩🇪</div>

          <div>
            <strong>WortWander</strong>
            <small>Animated German Learning</small>
          </div>
        </NavLink>

        <nav className="nav">
          <NavLink to="/add" className={navClass("nav-wordbook")}>
            <span className="nav-emoji">📚</span>
            Word Book
          </NavLink>

          <NavLink to="/cards" className={navClass("nav-flashcards")}>
            <span className="nav-emoji">🃏</span>
            Flashcards
          </NavLink>

          <NavLink to="/mcq" className={navClass("nav-quiz")}>
            <span className="nav-emoji">🎯</span>
            Quiz
          </NavLink>

          <NavLink
            to="/chat-game"
            onClick={openScenePicker}
            className={navClass("nav-scenes")}
          >
            <span className="nav-emoji">🗣️</span>
            AI Scenes
          </NavLink>

          <NavLink to="/stats" className={navClass("nav-progress")}>
            <span className="nav-emoji">📊</span>
            Progress
          </NavLink>
        </nav>
      </header>

      <main className="main-content">{children}</main>
    </div>
  );
}

export default Layout;