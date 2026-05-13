import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createCollection,
  createVocab,
  deleteVocab,
  generateExamples,
  getCollections,
  getVocabs,
  updateVocab,
} from "../api/client";
import type { Collection, Vocab } from "../types";

type VocabForm = {
  german: string;
  vietnamese: string;
  topic: string;
  examples: string;
};

type SubmitEventLike = {
  preventDefault: () => void;
};

type DateFilter = "all" | "today" | "last7" | "last30";

type UpdateVocabPayload = Parameters<typeof updateVocab>[1] & {
  is_starred?: boolean;
};

const emptyForm: VocabForm = {
  german: "",
  vietnamese: "",
  topic: "",
  examples: "",
};

const topicAllValue = "__all_topics__";

function isSameLocalDate(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function isInDateFilter(createdAt: string, dateFilter: DateFilter) {
  if (dateFilter === "all") {
    return true;
  }

  const createdDate = new Date(createdAt);

  if (Number.isNaN(createdDate.getTime())) {
    return false;
  }

  const now = new Date();

  if (dateFilter === "today") {
    return isSameLocalDate(createdDate, now);
  }

  const days = dateFilter === "last7" ? 7 : 30;
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - days);

  return createdDate >= startDate;
}

function formatDate(createdAt: string) {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleDateString();
}

function AddWordsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(
    null
  );

  const [vocabs, setVocabs] = useState<Vocab[]>([]);
  const [form, setForm] = useState<VocabForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [searchText, setSearchText] = useState("");
  const [selectedTopicFilter, setSelectedTopicFilter] = useState(topicAllValue);
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [selectedVocabForPopup, setSelectedVocabForPopup] =
    useState<Vocab | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const selectedCollection = useMemo(() => {
    return (
      collections.find((collection) => collection.id === selectedCollectionId) ??
      null
    );
  }, [collections, selectedCollectionId]);

  const uniqueTopics = useMemo(() => {
    const topics = vocabs
      .map((vocab) => vocab.topic?.trim())
      .filter((topic): topic is string => Boolean(topic));

    return Array.from(new Set(topics)).sort((left, right) =>
      left.localeCompare(right)
    );
  }, [vocabs]);

  const selectedPopupCollection = useMemo(() => {
    if (!selectedVocabForPopup?.collection_id) {
      return null;
    }

    return (
      collections.find(
        (collection) => collection.id === selectedVocabForPopup.collection_id
      ) ?? null
    );
  }, [collections, selectedVocabForPopup]);

  const popupExamples = useMemo(() => {
    if (!selectedVocabForPopup?.examples) {
      return [];
    }

    return selectedVocabForPopup.examples
      .split("\n")
      .map((example) => example.trim())
      .filter(Boolean);
  }, [selectedVocabForPopup]);

  const filteredVocabs = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    return vocabs.filter((vocab) => {
      const matchesSearch =
        !keyword ||
        vocab.german.toLowerCase().includes(keyword) ||
        vocab.vietnamese.toLowerCase().includes(keyword) ||
        vocab.topic?.toLowerCase().includes(keyword);

      const matchesTopic =
        selectedTopicFilter === topicAllValue ||
        vocab.topic?.trim() === selectedTopicFilter;

      const matchesDate = isInDateFilter(vocab.created_at, dateFilter);

      const matchesStar = !showStarredOnly || vocab.is_starred === true;

      return matchesSearch && matchesTopic && matchesDate && matchesStar;
    });
  }, [vocabs, searchText, selectedTopicFilter, dateFilter, showStarredOnly]);

  const hasActiveFilters =
    searchText.trim() ||
    selectedTopicFilter !== topicAllValue ||
    dateFilter !== "all" ||
    showStarredOnly;

  const loadCollections = useCallback(async (): Promise<void> => {
    try {
      const data = await getCollections();

      setCollections(data);

      setSelectedCollectionId((currentId) => {
        if (currentId !== null) {
          return currentId;
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
      setError("Could not load collections.");
    }
  }, []);

  const loadVocabs = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError("");

      const data = await getVocabs(
        selectedCollectionId
          ? {
              collectionId: selectedCollectionId,
            }
          : undefined
      );

      setVocabs(data);
    } catch (err) {
      console.error(err);
      setError("Could not load saved words.");
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

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const resetFilters = () => {
    setSearchText("");
    setSelectedTopicFilter(topicAllValue);
    setDateFilter("all");
    setShowStarredOnly(false);
  };

  const updateFormField = (field: keyof VocabForm, value: string) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const handleGenerateExamples = async () => {
    const german = form.german.trim();
    const vietnamese = form.vietnamese.trim();

    if (!german || !vietnamese) {
      alert("Please enter both German word and meaning first.");
      return;
    }

    try {
      setGenerating(true);

      const response = await generateExamples({
        german,
        vietnamese,
        topic: form.topic.trim() || undefined,
        level: "A2",
      });

      setForm((currentForm) => ({
        ...currentForm,
        examples: response.examples.join("\n"),
      }));
    } catch (err) {
      console.error(err);
      alert("Could not generate examples. Please check the backend.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (event: SubmitEventLike) => {
    event.preventDefault();

    const german = form.german.trim();
    const vietnamese = form.vietnamese.trim();
    const topic = form.topic.trim();
    const examples = form.examples.trim();

    if (!german || !vietnamese) {
      alert("Please enter German word and meaning.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        german,
        vietnamese,
        examples,
         topic: topic ? topic : null,
        collection_id: selectedCollectionId,
      };

      if (editingId) {
        await updateVocab(editingId, payload);
      } else {
        await createVocab(payload);
      }

      resetForm();
      await loadVocabs();
    } catch (err) {
      console.error(err);
      alert("Could not save the word. Please check the backend.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (vocab: Vocab) => {
    setEditingId(vocab.id);
    setSelectedVocabForPopup(null);

    setForm({
      german: vocab.german ?? "",
      vietnamese: vocab.vietnamese ?? "",
      topic: vocab.topic ?? "",
      examples: vocab.examples ?? "",
    });
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm("Delete this word?");

    if (!confirmed) {
      return;
    }

    try {
      await deleteVocab(id);

      if (editingId === id) {
        resetForm();
      }

      if (selectedVocabForPopup?.id === id) {
        setSelectedVocabForPopup(null);
      }

      await loadVocabs();
    } catch (err) {
      console.error(err);
      alert("Could not delete this word. Please check the backend.");
    }
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

      if (selectedVocabForPopup?.id === vocab.id) {
        setSelectedVocabForPopup({
          ...selectedVocabForPopup,
          is_starred: nextStarredValue,
        });
      }

      const payload: UpdateVocabPayload = {
        german: vocab.german,
        vietnamese: vocab.vietnamese,
        examples: vocab.examples ?? "",
        topic: vocab.topic ?? undefined,
        collection_id: vocab.collection_id ?? selectedCollectionId,
        is_starred: nextStarredValue,
      };

      await updateVocab(vocab.id, payload);
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

      if (selectedVocabForPopup?.id === vocab.id) {
        setSelectedVocabForPopup(vocab);
      }

      alert("Could not update star. Please check the backend.");
    }
  };

  const handleCreateGermanVocabCollection = async () => {
    try {
      const collection = await createCollection({
        name: "German Vocab",
        description: "Main German vocabulary collection",
      });

      await loadCollections();
      setSelectedCollectionId(collection.id);
    } catch (err) {
      console.error(err);
      alert("Could not create German Vocab collection.");
    }
  };

  return (
    <main className="wordbook-page">
      <section className="page-grid wordbook-grid">
        <section className="cute-card form-card">
          <span className="badge">German Vocab</span>

          <h2>{editingId ? "Edit Word" : "Add a New Word"}</h2>

          <form
            className="cute-form"
            onSubmit={(event) => {
              void handleSubmit(event);
            }}
          >
            <label>
              German Word
              <input
                value={form.german}
                onChange={(event) => updateFormField("german", event.target.value)}
                placeholder="e.g. anfangen"
              />
            </label>

            <label>
              Meaning
              <input
                value={form.vietnamese}
                onChange={(event) =>
                  updateFormField("vietnamese", event.target.value)
                }
                placeholder="e.g. to begin"
              />
            </label>

            <label>
              Topic optional
              <input
                value={form.topic}
                onChange={(event) => updateFormField("topic", event.target.value)}
                placeholder="Travel, Food, Work..."
              />
            </label>

            {collections.length > 0 ? (
              <label>
                Collection
                <select
                  value={selectedCollectionId ?? ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSelectedCollectionId(value ? Number(value) : null);
                  }}
                >
                  {collections.map((collection) => (
                    <option key={collection.id} value={collection.id}>
                      {collection.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <button
                type="button"
                className="cute-button soft"
                onClick={handleCreateGermanVocabCollection}
              >
                Create German Vocab Collection
              </button>
            )}

            <button
              type="button"
              className="cute-button soft"
              onClick={handleGenerateExamples}
              disabled={generating}
            >
              {generating ? "Generating..." : "Generate Examples"}
            </button>

            <label>
              Example Sentences
              <textarea
                value={form.examples}
                onChange={(event) =>
                  updateFormField("examples", event.target.value)
                }
                placeholder="Ich fange um 8 Uhr an."
              />
            </label>

            <button type="submit" className="cute-button primary" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update Word" : "Save Word"}
            </button>

            {editingId ? (
              <button
                type="button"
                className="cute-button soft"
                onClick={resetForm}
              >
                Cancel Edit
              </button>
            ) : null}
          </form>
        </section>

        <section
          className="cute-card saved-words-panel"
          style={{
            height: "calc(100vh - 150px)",
            minHeight: "520px",
            maxHeight: "760px",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            className="saved-words-header"
            style={{
              flex: "0 0 auto",
              marginBottom: "14px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "1rem",
                marginBottom: "12px",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: "6px 0 6px",
                  }}
                >
                  Your Saved Words
                </h2>

                {selectedCollection ? (
                  <p
                    style={{
                      margin: 0,
                      color: "var(--muted)",
                      fontWeight: 800,
                      fontSize: "14px",
                    }}
                  >
                    Collection: {selectedCollection.name}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                className="cute-button soft"
                onClick={() => void loadVocabs()}
                disabled={loading}
                style={{
                  whiteSpace: "nowrap",
                  padding: "9px 14px",
                  textTransform: "none",
                }}
              >
                {loading ? "Loading..." : "Refresh"}
              </button>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "center",
                flexWrap: "wrap",
                marginBottom: "10px",
              }}
            >
              <div
                style={{
                  position: "relative",
                  flex: "1 1 330px",
                  minWidth: "280px",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--muted)",
                    opacity: 0.72,
                    pointerEvents: "none",
                    fontSize: "16px",
                    lineHeight: 1,
                  }}
                >
                  🔍
                </span>

                <input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search German word, meaning, topic..."
                  style={{
                    height: "44px",
                    paddingLeft: "42px",
                    width: "100%",
                  }}
                />
              </div>

              <select
                value={selectedTopicFilter}
                onChange={(event) => setSelectedTopicFilter(event.target.value)}
                style={{
                  height: "44px",
                  flex: "0 1 170px",
                  minWidth: "150px",
                  paddingTop: 0,
                  paddingBottom: 0,
                }}
              >
                <option value={topicAllValue}>All topics</option>
                {uniqueTopics.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>

              <select
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value as DateFilter)}
                style={{
                  height: "44px",
                  flex: "0 1 160px",
                  minWidth: "145px",
                  paddingTop: 0,
                  paddingBottom: 0,
                }}
              >
                <option value="all">All dates</option>
                <option value="today">Today</option>
                <option value="last7">Last 7 days</option>
                <option value="last30">Last 30 days</option>
              </select>

              <button
                type="button"
                className={
                  showStarredOnly ? "cute-button primary" : "cute-button soft"
                }
                onClick={() => setShowStarredOnly((currentValue) => !currentValue)}
                style={{
                  height: "44px",
                  padding: "8px 14px",
                  whiteSpace: "nowrap",
                }}
              >
                ⭐ Starred
              </button>

              <button
                type="button"
                className="cute-button soft"
                onClick={resetFilters}
                disabled={!hasActiveFilters}
                style={{
                  height: "44px",
                  padding: "8px 14px",
                  whiteSpace: "nowrap",
                }}
              >
                Clear
              </button>
            </div>

            <p
              style={{
                margin: 0,
                color: "var(--muted)",
                fontWeight: 800,
                fontSize: "13px",
              }}
            >
              Showing {filteredVocabs.length} / {vocabs.length} words
            </p>

            {error ? (
              <p
                style={{
                  margin: "12px 0 0",
                  color: "#9b3c50",
                  fontWeight: 800,
                }}
              >
                {error}
              </p>
            ) : null}
          </div>

          <div
            className="saved-words-scroll"
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              paddingRight: "10px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {filteredVocabs.length === 0 && !loading ? (
              <p className="empty-state">
                {vocabs.length === 0
                  ? "No words yet."
                  : "No words match your search or filter."}
              </p>
            ) : null}

            {filteredVocabs.map((vocab) => (
              <article
                key={vocab.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedVocabForPopup(vocab)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedVocabForPopup(vocab);
                  }
                }}
                className={
                  editingId === vocab.id
                    ? "word-item word-item-editing"
                    : "word-item"
                }
                style={{
                  cursor: "pointer",
                }}
              >
                <div className="word-content">
                  <strong>
                    {vocab.is_starred === true ? "⭐ " : ""}
                    {vocab.german}
                  </strong>

                  <span>{vocab.vietnamese}</span>

                  {vocab.topic ? <small>Topic: {vocab.topic}</small> : null}

                  <small>Added: {formatDate(vocab.created_at)}</small>
                </div>

                <div className="word-actions">
                  <button
                    type="button"
                    className="word-action-btn"
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleToggleStar(vocab);
                    }}
                    title={
                      vocab.is_starred === true
                        ? "Remove from starred words"
                        : "Mark as important"
                    }
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "999px",
                      background:
                        vocab.is_starred === true ? "#fff0bd" : "#ffffff",
                      color: vocab.is_starred === true ? "#9a6b00" : "#6f7685",
                    }}
                  >
                    {vocab.is_starred === true ? "★" : "☆"}
                  </button>

                  <button
                    type="button"
                    className="word-action-btn edit-btn"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleEdit(vocab);
                    }}
                  >
                    <span className="btn-icon">✏️</span>
                    Edit
                  </button>

                  <button
                    type="button"
                    className="word-action-btn delete-btn"
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleDelete(vocab.id);
                    }}
                    aria-label={`Delete ${vocab.german}`}
                  >
                    🗑️
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>

      {selectedVocabForPopup ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Details for ${selectedVocabForPopup.german}`}
          onClick={() => setSelectedVocabForPopup(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            display: "grid",
            placeItems: "center",
            padding: "24px",
            background: "rgba(17, 24, 39, 0.25)",
            backdropFilter: "blur(4px)",
          }}
        >
          <section
            className="cute-card"
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "min(720px, 100%)",
              maxHeight: "calc(100vh - 64px)",
              overflowY: "auto",
              borderRadius: "30px",
              padding: "24px",
              background:
                "linear-gradient(180deg, rgba(255, 253, 247, 0.98), rgba(255, 248, 239, 0.98))",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "18px",
                marginBottom: "18px",
              }}
            >
              <div>
                <span className="badge">
                  {selectedVocabForPopup.is_starred === true
                    ? "⭐ Starred Word"
                    : "Word Details"}
                </span>

                <h2
                  style={{
                    margin: "8px 0 6px",
                    fontSize: "34px",
                    lineHeight: 1.1,
                  }}
                >
                  {selectedVocabForPopup.german}
                </h2>

                <p
                  style={{
                    margin: 0,
                    color: "var(--muted)",
                    fontWeight: 800,
                    fontSize: "18px",
                    lineHeight: 1.45,
                  }}
                >
                  {selectedVocabForPopup.vietnamese}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedVocabForPopup(null)}
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "999px",
                  border: "none",
                  background: "#f9d9df",
                  color: "#8b2e41",
                  fontSize: "26px",
                  lineHeight: 1,
                  cursor: "pointer",
                  boxShadow: "0 8px 18px rgba(68, 72, 101, 0.12)",
                }}
                aria-label="Close word details"
              >
                ×
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: "12px",
                marginBottom: "18px",
              }}
            >
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: "18px",
                  background: "rgba(255, 255, 255, 0.75)",
                  border: "2px solid rgba(233, 227, 213, 0.9)",
                }}
              >
                <small
                  style={{
                    display: "block",
                    color: "var(--muted)",
                    fontWeight: 900,
                    marginBottom: "6px",
                  }}
                >
                  Topic
                </small>
                <strong>{selectedVocabForPopup.topic || "No topic"}</strong>
              </div>

              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: "18px",
                  background: "rgba(255, 255, 255, 0.75)",
                  border: "2px solid rgba(233, 227, 213, 0.9)",
                }}
              >
                <small
                  style={{
                    display: "block",
                    color: "var(--muted)",
                    fontWeight: 900,
                    marginBottom: "6px",
                  }}
                >
                  Collection
                </small>
                <strong>
                  {selectedPopupCollection?.name ??
                    selectedCollection?.name ??
                    "No collection"}
                </strong>
              </div>

              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: "18px",
                  background: "rgba(255, 255, 255, 0.75)",
                  border: "2px solid rgba(233, 227, 213, 0.9)",
                }}
              >
                <small
                  style={{
                    display: "block",
                    color: "var(--muted)",
                    fontWeight: 900,
                    marginBottom: "6px",
                  }}
                >
                  Added
                </small>
                <strong>{formatDate(selectedVocabForPopup.created_at)}</strong>
              </div>
            </div>

            <div
              style={{
                marginBottom: "18px",
              }}
            >
              <h3
                style={{
                  margin: "0 0 10px",
                  fontSize: "22px",
                }}
              >
                Example Sentences
              </h3>

              {popupExamples.length > 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {popupExamples.map((example, index) => (
                    <p
                      key={`${example}-${index}`}
                      style={{
                        margin: 0,
                        padding: "13px 15px",
                        borderRadius: "18px",
                        background: "rgba(255, 255, 255, 0.78)",
                        border: "2px solid rgba(233, 227, 213, 0.8)",
                        fontWeight: 700,
                        lineHeight: 1.5,
                      }}
                    >
                      {index + 1}. {example}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No example sentences yet.</p>
              )}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                className={
                  selectedVocabForPopup.is_starred === true
                    ? "cute-button primary"
                    : "cute-button soft"
                }
                onClick={() => void handleToggleStar(selectedVocabForPopup)}
              >
                {selectedVocabForPopup.is_starred === true
                  ? "★ Starred"
                  : "☆ Mark Starred"}
              </button>

              <button
                type="button"
                className="cute-button soft"
                onClick={() => handleEdit(selectedVocabForPopup)}
              >
                ✏️ Edit
              </button>

              <button
                type="button"
                className="cute-button danger"
                onClick={() => void handleDelete(selectedVocabForPopup.id)}
              >
                🗑️ Delete
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

export default AddWordsPage;