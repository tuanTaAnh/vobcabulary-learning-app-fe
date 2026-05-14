import { type FormEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import CuteButton from "./CuteButton";
import type { Collection } from "../types";

type Props = {
  label: string;
  title: string;
  description: string;
  collections: Collection[];
  selectedCollectionId: number | null;
  collectionError?: string;
  onSelectCollection: (collectionId: string) => void;
  onCreateCollection: (data: {
    name: string;
    description?: string;
    icon?: string;
  }) => Promise<unknown>;
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

function getCollectionIcon(collection: Collection | null | undefined): string {
  return collection?.icon?.trim() || "📚";
}

function CollectionPicker({
  label,
  title,
  description,
  collections,
  selectedCollectionId,
  collectionError,
  onSelectCollection,
  onCreateCollection,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollectionListOpen, setIsCollectionListOpen] = useState(false);
  const [collectionSearch, setCollectionSearch] = useState("");

  const [newCollectionIcon, setNewCollectionIcon] = useState("📚");
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const activeCollection =
    collections.find((collection) => collection.id === selectedCollectionId) ??
    null;

  const filteredCollections = useMemo(() => {
    const keyword = collectionSearch.trim().toLowerCase();

    if (!keyword) {
      return collections;
    }

    return collections.filter((collection) => {
      const name = collection.name.toLowerCase();
      const description = collection.description?.toLowerCase() ?? "";
      const icon = collection.icon?.toLowerCase() ?? "";

      return (
        name.includes(keyword) ||
        description.includes(keyword) ||
        icon.includes(keyword)
      );
    });
  }, [collections, collectionSearch]);

  const closeDrawer = () => {
    setIsOpen(false);
    setIsCollectionListOpen(false);
    setCollectionSearch("");
  };

  const handleSelectCollection = (collectionId: number) => {
    onSelectCollection(String(collectionId));
    setIsCollectionListOpen(false);
    setCollectionSearch("");
  };

  async function handleCreateCollection(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!newCollectionName.trim()) {
      alert("Please enter a collection name.");
      return;
    }

    setCreating(true);

    try {
      await onCreateCollection({
        name: newCollectionName.trim(),
        description: newCollectionDescription.trim() || undefined,
        icon: newCollectionIcon,
      });

      setNewCollectionName("");
      setNewCollectionDescription("");
      setNewCollectionIcon("📚");
      setIsCollectionListOpen(false);
      setCollectionSearch("");
    } catch {
      alert("Could not create collection. Please check the backend.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <button
        className="collection-drawer-tab"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open collection drawer"
      >
        <span>📚</span>
        <strong>
          {activeCollection ? activeCollection.name : "Collections"}
        </strong>
      </button>

      {isOpen ? (
        <button
          className="collection-drawer-backdrop"
          type="button"
          onClick={closeDrawer}
          aria-label="Close collection drawer"
        />
      ) : null}

      <aside
        className={`collection-drawer ${isOpen ? "is-open" : ""}`}
        aria-hidden={!isOpen}
      >
        <div className="collection-drawer-header">
          <div>
            <span className="badge">{label}</span>
            <h2>{title}</h2>
          </div>

          <button
            className="collection-drawer-close"
            type="button"
            onClick={closeDrawer}
            aria-label="Close collection drawer"
          >
            ×
          </button>
        </div>

        <p className="collection-drawer-description">{description}</p>

        {collectionError ? (
          <p className="collection-error">{collectionError}</p>
        ) : null}

        <div className="collection-combobox">
          <span className="collection-combobox-label">Current Collection</span>

          <button
            type="button"
            className="collection-combobox-trigger"
            onClick={() => setIsCollectionListOpen((prev) => !prev)}
          >
            <span className="collection-combobox-current">
              <span className="collection-combobox-icon">
                {getCollectionIcon(activeCollection)}
              </span>

              <span>
                {activeCollection ? activeCollection.name : "Choose collection"}
              </span>
            </span>

            <span
              className={
                isCollectionListOpen
                  ? "collection-combobox-arrow is-open"
                  : "collection-combobox-arrow"
              }
            >
              ⌄
            </span>
          </button>

          {isCollectionListOpen ? (
            <div className="collection-combobox-menu">
              <div className="collection-search-box">
                <span aria-hidden="true">🔍</span>

                <input
                  value={collectionSearch}
                  onChange={(e) => setCollectionSearch(e.target.value)}
                  placeholder="Search collection..."
                  autoFocus
                />
              </div>

              <div className="collection-option-list">
                {filteredCollections.length > 0 ? (
                  filteredCollections.map((collection) => {
                    const isSelected = collection.id === selectedCollectionId;

                    return (
                      <button
                        key={collection.id}
                        type="button"
                        className={
                          isSelected
                            ? "collection-option is-selected"
                            : "collection-option"
                        }
                        onClick={() => handleSelectCollection(collection.id)}
                      >
                        <span className="collection-option-left">
                          <span className="collection-option-icon">
                            {getCollectionIcon(collection)}
                          </span>

                          <span className="collection-option-text">
                            <strong>{collection.name}</strong>

                            {collection.description ? (
                              <small>{collection.description}</small>
                            ) : null}
                          </span>
                        </span>

                        {isSelected ? (
                          <span className="collection-option-check">✓</span>
                        ) : null}
                      </button>
                    );
                  })
                ) : (
                  <p className="collection-empty-result">
                    No collection found.
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <Link className="cute-link soft drawer-manage-link" to="/collections">
          Manage Collections
        </Link>

        <div className="drawer-divider" />

        <form
          className="drawer-collection-form"
          onSubmit={handleCreateCollection}
        >
          <h3>Add New Collection</h3>

          <div className="collection-icon-picker">
            <span className="collection-icon-picker-label">Choose Icon</span>

            <div className="collection-icon-grid">
              {collectionIconOptions.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  className={
                    newCollectionIcon === icon
                      ? "collection-icon-choice is-selected"
                      : "collection-icon-choice"
                  }
                  onClick={() => setNewCollectionIcon(icon)}
                  aria-label={`Choose icon ${icon}`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <input
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
            placeholder="e.g. Travel German"
          />

          <input
            value={newCollectionDescription}
            onChange={(e) => setNewCollectionDescription(e.target.value)}
            placeholder="Description optional"
          />

          <CuteButton type="submit" variant="primary" disabled={creating}>
            {creating ? "Creating..." : "Add Collection"}
          </CuteButton>
        </form>
      </aside>
    </>
  );
}

export default CollectionPicker;