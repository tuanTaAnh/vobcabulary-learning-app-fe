import { useCallback, useEffect, useMemo, useState } from "react";
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
  icon: string;
};

type SubmitEventLike = {
  preventDefault: () => void;
};

const emptyForm: CollectionForm = {
  name: "",
  description: "",
  icon: "📚",
};

const collectionIconOptions = [
  "📚",
  "🇩🇪",
  "🇬🇧",
  "✈️",
  "🍽️",
  "💼",
  "🎓",
  "🧠",
  "⭐",
  "🏠",
  "🛒",
  "🚆",
  "📝",
  "📖",
  "🔥",
];

function getCollectionIcon(icon: string | null | undefined): string {
  return icon?.trim() || "📚";
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("vi-VN").format(date);
}

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

  const loadCollections = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError("");

      const data = await getCollections();
      setCollections(data);

      const counts = await Promise.all(
        data.map(async (collection) => {
          try {
            const vocabs = await getVocabs({
              collectionId: collection.id,
            });

            return [collection.id, vocabs.length] as const;
          } catch {
            return [collection.id, 0] as const;
          }
        })
      );

      setWordCounts(Object.fromEntries(counts));
    } catch (err) {
      console.error(err);
      setError("Could not load collections.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCollections();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadCollections]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const updateFormField = (field: keyof CollectionForm, value: string) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: SubmitEventLike) => {
    event.preventDefault();

    const name = form.name.trim();
    const description = form.description.trim();
    const icon = form.icon.trim() || "📚";

    if (!name) {
      alert("Please enter a collection name.");
      return;
    }

    try {
      setSaving(true);

      if (editingId) {
        await updateCollection(editingId, {
          name,
          description: description || null,
          icon,
        });
      } else {
        await createCollection({
          name,
          description: description || undefined,
          icon,
        });
      }

      resetForm();
      await loadCollections();
    } catch (err) {
      console.error(err);
      alert("Could not save this collection. Please check the backend.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (collection: Collection) => {
    setEditingId(collection.id);

    setForm({
      name: collection.name ?? "",
      description: collection.description ?? "",
      icon: getCollectionIcon(collection.icon),
    });
  };

  const handleDelete = async (collection: Collection) => {
    const count = wordCounts[collection.id] ?? 0;

    const confirmed = window.confirm(
      count > 0
        ? `Delete "${collection.name}"? Its ${count} words will stay saved but will no longer belong to this collection.`
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
      alert("Could not delete this collection. Please check the backend.");
    }
  };

  return (
    <main className="collections-page">
      <section className="stats-grid">
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

      <section className="page-grid wordbook-grid">
        <section className="cute-card form-card">
          <span className="badge">
            {editingId ? "Edit Collection" : "New Collection"}
          </span>

          <h2>{editingId ? "Edit Collection" : "Add a Collection"}</h2>

          <form
            className="cute-form"
            onSubmit={(event) => {
              void handleSubmit(event);
            }}
          >
            <div className="collection-icon-picker">
              <span className="collection-icon-picker-label">Choose Icon</span>

              <div className="collection-icon-grid">
                {collectionIconOptions.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    className={
                      form.icon === icon
                        ? "collection-icon-choice is-selected"
                        : "collection-icon-choice"
                    }
                    onClick={() => updateFormField("icon", icon)}
                    aria-label={`Choose icon ${icon}`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <label>
              Collection Name
              <input
                value={form.name}
                onChange={(event) =>
                  updateFormField("name", event.target.value)
                }
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
              />
            </label>

            <button
              type="submit"
              className="cute-button primary"
              disabled={saving}
            >
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

        <section className="cute-card saved-words-panel">
          <div className="saved-words-header">
            <span className="badge">Saved Collections</span>

            <div className="saved-words-title-row">
              <div className="saved-words-title-block">
                <h2>Your Collections</h2>

                <p className="saved-words-collection">
                  {loading
                    ? "Loading collections..."
                    : `Showing ${collections.length} collections`}
                </p>
              </div>

              <button
                type="button"
                className="cute-button soft saved-refresh-btn"
                onClick={() => void loadCollections()}
                disabled={loading}
              >
                {loading ? "Loading..." : "Refresh"}
              </button>
            </div>

            {error ? <p className="saved-words-error">{error}</p> : null}
          </div>

          <div className="saved-words-scroll">
            {collections.length === 0 && !loading ? (
              <p className="empty-state">No collections yet.</p>
            ) : null}

            {collections.map((collection) => {
              const count = wordCounts[collection.id] ?? 0;

              return (
                <article
                  key={collection.id}
                  className={
                    editingId === collection.id
                      ? "word-item word-item-editing"
                      : "word-item"
                  }
                >
                  <div className="word-content">
                    <strong className="collection-title-with-icon">
                      <span className="collection-card-icon">
                        {getCollectionIcon(collection.icon)}
                      </span>

                      {collection.name}
                    </strong>

                    <span>{collection.description || "No description"}</span>

                    <small>
                      {count} {count === 1 ? "word" : "words"} saved
                    </small>

                    <small>Created: {formatDate(collection.created_at)}</small>
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