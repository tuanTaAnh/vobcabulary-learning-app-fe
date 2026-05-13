import { Navigate, Route, Routes } from "react-router-dom";

import Layout from "./components/Layout";
import AddWordsPage from "./pages/AddWordsPage";
import ChatGamePage from "./pages/ChatGamePage";
import CollectionsPage from "./pages/CollectionsPage";
import FlashcardsPage from "./pages/FlashcardsPage";
import HomePage from "./pages/HomePage";
import MCQPage from "./pages/MCQPage";
import StatsPage from "./pages/StatsPage";

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/collections" element={<CollectionsPage />} />
        <Route path="/add" element={<AddWordsPage />} />
        <Route path="/cards" element={<FlashcardsPage />} />
        <Route path="/mcq" element={<MCQPage />} />
        <Route path="/chat-game" element={<ChatGamePage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="*" element={<Navigate to="/collections" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;