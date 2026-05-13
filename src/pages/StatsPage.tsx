import { useCallback, useEffect, useMemo, useState } from "react";
import { getDailyStats, getStatsSummary } from "../api/client";
import type { DailyStats, StatsSummary } from "../types";

type StatsSummaryWithOptionalWrong = StatsSummary & {
  mcq_wrong?: number;
};

const toSafeNumber = (value: unknown): number => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

function StatsPage() {
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadStats = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError("");

      const [summaryData, dailyData] = await Promise.all([
        getStatsSummary(),
        getDailyStats(),
      ]);

      setSummary(summaryData ?? null);
      setDailyStats(Array.isArray(dailyData) ? dailyData : []);
    } catch (err) {
      console.error(err);
      setError("Could not load progress data. Please check the backend.");
      setSummary(null);
      setDailyStats([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadStats();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadStats]);

  const sortedDailyStats = useMemo(() => {
    return [...dailyStats].sort((a, b) => b.date.localeCompare(a.date));
  }, [dailyStats]);

  const totalWordsFromDaily = useMemo(() => {
    return dailyStats.reduce(
      (total, item) => total + toSafeNumber(item.words_added),
      0
    );
  }, [dailyStats]);

  const totalCorrectFromDaily = useMemo(() => {
    return dailyStats.reduce(
      (total, item) => total + toSafeNumber(item.mcq_correct),
      0
    );
  }, [dailyStats]);

  const totalWrongFromDaily = useMemo(() => {
    return dailyStats.reduce(
      (total, item) => total + toSafeNumber(item.mcq_wrong),
      0
    );
  }, [dailyStats]);

  const summaryWithWrong = summary as StatsSummaryWithOptionalWrong | null;

  const summaryMcqTotal = toSafeNumber(summary?.mcq_total);
  const summaryMcqCorrect = toSafeNumber(summary?.mcq_correct);
  const summaryMcqWrong =
    summaryWithWrong?.mcq_wrong !== undefined
      ? toSafeNumber(summaryWithWrong.mcq_wrong)
      : Math.max(summaryMcqTotal - summaryMcqCorrect, 0);

  const totalWords =
    summary?.total_words !== undefined
      ? toSafeNumber(summary.total_words)
      : totalWordsFromDaily;

  const totalMcqCorrect =
    summary?.mcq_correct !== undefined ? summaryMcqCorrect : totalCorrectFromDaily;

  const totalMcqWrong =
    summary !== null ? summaryMcqWrong : totalWrongFromDaily;

  return (
    <main className="stats-page">
      <section className="cute-card page-header-card">
        <div>
          <span className="badge">Progress</span>
          <h2>Your Learning Progress</h2>
          <p>
            Track how many words you add and how many quiz answers are correct
            or wrong.
          </p>
        </div>

        <button
          type="button"
          className="cute-button soft"
          onClick={() => void loadStats()}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </section>

      {error ? (
        <p
          style={{
            color: "#9b3c50",
            fontWeight: 800,
            margin: 0,
          }}
        >
          {error}
        </p>
      ) : null}

      <section
        className="stats-grid"
        style={{
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        }}
      >
        <article className="cute-card stat-card">
          <span className="stat-icon">📚</span>
          <small>Total Words</small>
          <strong>{totalWords}</strong>
        </article>

        <article className="cute-card stat-card">
          <span className="stat-icon">✅</span>
          <small>MCQ Correct</small>
          <strong>{totalMcqCorrect}</strong>
        </article>

        <article className="cute-card stat-card">
          <span className="stat-icon">❌</span>
          <small>MCQ Wrong</small>
          <strong>{totalMcqWrong}</strong>
        </article>
      </section>

      <section className="cute-card daily-activity-card">
        <div className="daily-activity-header">
          <div>
            <span className="badge">Daily Activity</span>
            <h2>Recent Practice</h2>
          </div>

          <button
            type="button"
            className="cute-button soft"
            onClick={() => void loadStats()}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        <div className="daily-activity-list">
          {sortedDailyStats.length === 0 && !loading ? (
            <p className="empty-state">No progress data yet.</p>
          ) : null}

          {sortedDailyStats.map((item) => (
            <article key={item.date} className="daily-activity-item">
              <div className="daily-date">
                <span>📅</span>
                <strong>{item.date}</strong>
              </div>

              <div
                className="daily-metrics"
                style={{
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                }}
              >
                <div>
                  <small>Words Added</small>
                  <strong>{toSafeNumber(item.words_added)}</strong>
                </div>

                <div>
                  <small>MCQ Correct</small>
                  <strong>{toSafeNumber(item.mcq_correct)}</strong>
                </div>

                <div>
                  <small>MCQ Wrong</small>
                  <strong>{toSafeNumber(item.mcq_wrong)}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default StatsPage;