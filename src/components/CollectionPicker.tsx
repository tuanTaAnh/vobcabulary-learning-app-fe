import { type FormEvent, useEffect, useState } from "react";
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
  }) => Promise<unknown>;
};

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
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const activeCollection = collections.find(
    (collection) => collection.id === selectedCollectionId
  );

  useEffect(() => {
    if (collections.length === 0) {
      setIsOpen(true);
    }
  }, [collections.length]);

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
      });

      setNewCollectionName("");
      setNewCollectionDescription("");
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

      {isOpen && (
        <button
          className="collection-drawer-backdrop"
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label="Close collection drawer"
        />
      )}

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
            onClick={() => setIsOpen(false)}
            aria-label="Close collection drawer"
          >
            ×
          </button>
        </div>

        <p className="collection-drawer-description">{description}</p>

        {collectionError && (
          <p className="collection-error">{collectionError}</p>
        )}

        <label className="collection-select-label">
          Current Collection
          <select
            value={selectedCollectionId || ""}
            onChange={(e) => onSelectCollection(e.target.value)}
          >
            {collections.length === 0 && (
              <option value="">No collection yet</option>
            )}

            {collections.map((collection) => (
              <option value={collection.id} key={collection.id}>
                {collection.name}
              </option>
            ))}
          </select>
        </label>

        <Link className="cute-link soft drawer-manage-link" to="/collections">
          Manage Collections
        </Link>

        <div className="drawer-divider" />

        <form className="drawer-collection-form" onSubmit={handleCreateCollection}>
          <h3>Add New Collection</h3>

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