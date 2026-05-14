import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  createCollection,
  deleteCollection,
  getCollections,
  getVocabs,
  updateCollection,
} from "../api/client";
import type { Collection } from "../types";

type CollectionForm = {
  name: string;
  description: string;
};

const emptyForm: CollectionForm = {
  name: "",
  description: "",
};

function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [wordCounts, setWordCounts] = useState<Record<number, number>>({});
  const [form, setForm] = useState<CollectionForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const totalWords = useMemo(() => {
    return Object.values(wordCounts).reduce((total, count) => total + count, 0);
  }, [wordCounts]);

  const sortedCollections = useMemo(() => {
    return [...collections].sort((a, b) => a.name.localeCompare(b.name));
  }, [collections]);

  const loadCollections = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError("");

      const collectionData = await getCollections();
      setCollections(collectionData);

      const countEntries = await Promise.all(
        collectionData.map(async (collection) => {
          try {
            const vocabs = await getVocabs({
              collectionId: collection.id,
            });

            return [collection.id, vocabs.length] as const;
          } catch (err) {
            console.error(err);
            return [collection.id, 0] as const;
          }
        })
      );

      setWordCounts(Object.fromEntries(countEntries));
    } catch (err) {
      console.error(err);
      setError("Could not load collections. Please check the backend.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCollections();
  }, [loadCollections]);

  const updateFormField = (field: keyof CollectionForm, value: string) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = form.name.trim();
    const description = form.description.trim();

    if (!name) {
      alert("Please enter a collection name.");
      return;
    }

    try {
      setSaving(true);

      if (editingId) {
        await updateCollection(editingId, {
          name,
          description: description || undefined,
        });
      } else {
        await createCollection({
          name,
          description: description || undefined,
        });
      }

      resetForm();
      await loadCollections();
    } catch (err) {
      console.error(err);
      alert("Could not save collection. Please check the backend.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (collection: Collection) => {
    setEditingId(collection.id);

    setForm({
      name: collection.name ?? "",
      description: collection.description ?? "",
    });
  };

  const handleDelete = async (collection: Collection) => {
    const count = wordCounts[collection.id] ?? 0;

    const confirmed = window.confirm(
      count > 0
        ? `Delete "${collection.name}"? This collection has ${count} saved words.`
        : `Delete "${collection.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteCollection(collection.id);

      if (editingId === collection.id) {
        resetForm();
      }

      await loadCollections();
    } catch (err) {
      console.error(err);
      alert(
        "Could not delete this collection. It may still contain saved words, or the backend blocked deletion."
      );
    }
  };

  return (
    <main className="collections-page">
      <section className="cute-card page-header-card">
        <div>
          <span className="badge">Collections</span>
          <h2>Manage Vocabulary Collections</h2>
          <p>
            Create, edit, and organize your vocabulary collections for Word Book,
            Flashcards, and Quiz.
          </p>
        </div>

        <button
          type="button"
          className="cute-button soft"
          onClick={() => void loadCollections()}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </section>

      <section className="stats-grid" style={{ marginBottom: "16px" }}>
        <article className="cute-card stat-card">
          <span className="stat-icon">📚</span>
          <small>Total Collections</small>
          <strong>{collections.length}</strong>
        </article>

        <article className="cute-card stat-card">
          <span className="stat-icon">📖</span>
          <small>Total Words</small>
          <strong>{totalWords}</strong>
        </article>

        <article className="cute-card stat-card">
          <span className="stat-icon">⭐</span>
          <small>Active Page</small>
          <strong>Collections</strong>
        </article>

        <article className="cute-card stat-card">
          <span className="stat-icon">🧠</span>
          <small>Used By</small>
          <strong>3 modes</strong>
        </article>
      </section>

      <section className="page-grid">
        <section className="cute-card form-card">
          <span className="badge">
            {editingId ? "Edit Collection" : "New Collection"}
          </span>

          <h2>{editingId ? "Update Collection" : "Add a Collection"}</h2>

          <form className="cute-form" onSubmit={handleSubmit}>
            <label>
              Collection Name
              <input
                value={form.name}
                onChange={(event) => updateFormField("name", event.target.value)}
                placeholder="e.g. Travel German"
              />
            </label>

            <label>
              Description optional
              <textarea
                value={form.description}
                onChange={(event) =>
                  updateFormField("description", event.target.value)
                }
                placeholder="Short note about this collection..."
                style={{
                  minHeight: "120px",
                }}
              />
            </label>

            <button type="submit" className="cute-button primary" disabled={saving}>
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Collection"
                  : "Create Collection"}
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
          className="cute-card"
          style={{
            minHeight: "520px",
            maxHeight: "calc(100vh - 220px)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              flex: "0 0 auto",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "16px",
              marginBottom: "16px",
            }}
          >
            <div>
              <span className="badge">Saved Collections</span>
              <h2
                style={{
                  margin: "6px 0 6px",
                  fontSize: "26px",
                }}
              >
                Your Collections
              </h2>
              <p
                style={{
                  margin: 0,
                  color: "var(--muted)",
                  fontWeight: 800,
                }}
              >
                Showing {sortedCollections.length} collections
              </p>
            </div>
          </div>

          {error ? (
            <p
              style={{
                margin: "0 0 14px",
                color: "#9b3c50",
                fontWeight: 800,
              }}
            >
              {error}
            </p>
          ) : null}

          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              paddingRight: "10px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {sortedCollections.length === 0 && !loading ? (
              <p className="empty-state">
                No collections yet. Create your first collection on the left.
              </p>
            ) : null}

            {sortedCollections.map((collection) => {
              const count = wordCounts[collection.id] ?? 0;
              const isEditing = editingId === collection.id;

              return (
                <article
                  key={collection.id}
                  className={
                    isEditing ? "word-item word-item-editing" : "word-item"
                  }
                >
                  <div className="word-content">
                    <strong>{collection.name}</strong>

                    <span>
                      {collection.description?.trim()
                        ? collection.description
                        : "No description"}
                    </span>

                    <small>
                      {count} {count === 1 ? "word" : "words"} saved
                    </small>

                    <small>
                      Created:{" "}
                      {new Date(collection.created_at).toLocaleDateString("de-DE")}
                    </small>
                  </div>

                  <div className="word-actions">
                    <button
                      type="button"
                      className="word-action-btn edit-btn"
                      onClick={() => handleEdit(collection)}
                    >
                      <span className="btn-icon">✏️</span>
                      Edit
                    </button>

                    <button
                      type="button"
                      className="word-action-btn delete-btn"
                      onClick={() => void handleDelete(collection)}
                      aria-label={`Delete ${collection.name}`}
                    >
                      🗑️
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </section>
    </main>
  );
}

export default CollectionsPage;