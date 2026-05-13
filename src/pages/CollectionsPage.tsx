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

const emptyForm: VocabForm = {
  german: "",
  vietnamese: "",
  topic: "",
  examples: "",
};

function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(
    null
  );

  const [vocabs, setVocabs] = useState<Vocab[]>([]);
  const [form, setForm] = useState<VocabForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

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
        topic: topic || undefined,
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

      await loadVocabs();
    } catch (err) {
      console.error(err);
      alert("Could not delete this word. Please check the backend.");
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
    <main className="page">
      <section
        className="content-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(320px, 0.9fr) minmax(420px, 1.1fr)",
          gap: "1.4rem",
          alignItems: "start",
        }}
      >
        <section className="card soft-card saved-words-panel">
          <div className="section-pill">German Vocab</div>

          <h1>{editingId ? "Edit Word" : "Add a New Word"}</h1>

          <form
            onSubmit={(event) => {
              void handleSubmit(event);
            }}
            className="form-stack"
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
                className="secondary-button"
                onClick={handleCreateGermanVocabCollection}
              >
                Create German Vocab Collection
              </button>
            )}

            <button
              type="button"
              className="secondary-button"
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
                rows={7}
              />
            </label>

            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update Word" : "Save Word"}
            </button>

            {editingId ? (
              <button
                type="button"
                className="secondary-button"
                onClick={resetForm}
              >
                Cancel Edit
              </button>
            ) : null}
          </form>
        </section>

        <section className="card soft-card saved-words-panel">
          <div className="saved-words-header">
            <div>
              <h1>Your Saved Words</h1>

              {selectedCollection ? (
                <p
                  style={{
                    margin: 0,
                    opacity: 0.65,
                    fontWeight: 700,
                  }}
                >
                  Collection: {selectedCollection.name}
                </p>
              ) : null}
            </div>

            <button
              type="button"
              className="secondary-button"
              onClick={() => void loadVocabs()}
              disabled={loading}
              style={{
                whiteSpace: "nowrap",
              }}
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {error ? (
            <div
              style={{
                padding: "0.9rem 1rem",
                borderRadius: "1rem",
                background: "#ffe9e9",
                color: "#8a1f1f",
                fontWeight: 700,
                marginBottom: "1rem",
              }}
            >
              {error}
            </div>
          ) : null}

          <div className="saved-words-scroll">
            {vocabs.length === 0 && !loading ? (
              <div
                style={{
                  padding: "2rem",
                  borderRadius: "1.2rem",
                  background: "rgba(255, 255, 255, 0.72)",
                  textAlign: "center",
                  fontWeight: 800,
                  opacity: 0.7,
                }}
              >
                No words yet.
              </div>
            ) : null}

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.85rem",
              }}
            >
              {vocabs.map((vocab) => (
                <article
                  key={vocab.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto auto",
                    gap: "0.75rem",
                    alignItems: "center",
                    padding: "1rem 1.1rem",
                    borderRadius: "1.1rem",
                    border: "2px solid rgba(108, 91, 55, 0.12)",
                    background: "rgba(255, 251, 242, 0.86)",
                  }}
                >
                  <div
                    style={{
                      minWidth: 0,
                    }}
                  >
                    <h2
                      style={{
                        margin: "0 0 0.25rem",
                        fontSize: "1.15rem",
                      }}
                    >
                      {vocab.german}
                    </h2>

                    <p
                      style={{
                        margin: 0,
                        opacity: 0.7,
                        fontWeight: 650,
                        overflowWrap: "anywhere",
                      }}
                    >
                      {vocab.vietnamese}
                    </p>

                    {vocab.topic ? (
                      <p
                        style={{
                          margin: "0.35rem 0 0",
                          opacity: 0.55,
                          fontSize: "0.85rem",
                          fontWeight: 700,
                        }}
                      >
                        Topic: {vocab.topic}
                      </p>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => handleEdit(vocab)}
                    style={{
                      whiteSpace: "nowrap",
                    }}
                  >
                    ✏️ Edit
                  </button>

                  <button
                    type="button"
                    className="danger-button"
                    onClick={() => void handleDelete(vocab.id)}
                    aria-label={`Delete ${vocab.german}`}
                  >
                    🗑️
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

export default CollectionsPage;