import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { createCollection, getCollections } from "../api/client";
import type { Collection } from "../types";

const SESSION_COLLECTION_KEY = "wortwander_selected_collection_id";

function getStoredCollectionId(): number | null {
  const storedValue = window.sessionStorage.getItem(SESSION_COLLECTION_KEY);

  if (!storedValue) {
    return null;
  }

  const parsedValue = Number(storedValue);

  if (!Number.isFinite(parsedValue)) {
    return null;
  }

  return parsedValue;
}

function saveStoredCollectionId(collectionId: number | null) {
  if (!collectionId) {
    window.sessionStorage.removeItem(SESSION_COLLECTION_KEY);
    return;
  }

  window.sessionStorage.setItem(SESSION_COLLECTION_KEY, String(collectionId));
}

export function useCollectionSelection(basePath: string) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const collectionIdParam = searchParams.get("collectionId");
  const parsedCollectionId = collectionIdParam
    ? Number(collectionIdParam)
    : null;

  const selectedCollectionId =
    parsedCollectionId && Number.isFinite(parsedCollectionId)
      ? parsedCollectionId
      : null;

  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionsLoaded, setCollectionsLoaded] = useState(false);
  const [collectionError, setCollectionError] = useState("");

  const activeCollection = useMemo(() => {
    return (
      collections.find(
        (collection) => collection.id === selectedCollectionId
      ) ?? null
    );
  }, [collections, selectedCollectionId]);

  useEffect(() => {
    void loadCollections();
  }, []);

  useEffect(() => {
    if (!collectionsLoaded) {
      return;
    }

    if (collections.length === 0) {
      saveStoredCollectionId(null);

      if (selectedCollectionId) {
        navigate(basePath, {
          replace: true,
        });
      }

      return;
    }

    if (selectedCollectionId) {
      const selectedCollectionStillExists = collections.some(
        (collection) => collection.id === selectedCollectionId
      );

      if (selectedCollectionStillExists) {
        saveStoredCollectionId(selectedCollectionId);
        return;
      }
    }

    const storedCollectionId = getStoredCollectionId();

    if (storedCollectionId) {
      const storedCollectionStillExists = collections.some(
        (collection) => collection.id === storedCollectionId
      );

      if (storedCollectionStillExists) {
        navigate(`${basePath}?collectionId=${storedCollectionId}`, {
          replace: true,
        });
        return;
      }
    }

    const fallbackCollectionId = collections[0].id;

    saveStoredCollectionId(fallbackCollectionId);

    navigate(`${basePath}?collectionId=${fallbackCollectionId}`, {
      replace: true,
    });
  }, [collectionsLoaded, collections, selectedCollectionId, basePath, navigate]);

  async function loadCollections() {
    setCollectionError("");

    try {
      const data = await getCollections();
      setCollections(data);
      return data;
    } catch {
      setCollections([]);
      setCollectionError("Could not load collections. Please check the backend.");
      return [];
    } finally {
      setCollectionsLoaded(true);
    }
  }

  function selectCollection(collectionId: string) {
    if (!collectionId) {
      saveStoredCollectionId(null);
      navigate(basePath);
      return;
    }

    const parsedId = Number(collectionId);

    if (Number.isFinite(parsedId)) {
      saveStoredCollectionId(parsedId);
    }

    navigate(`${basePath}?collectionId=${collectionId}`);
  }

  async function createNewCollection(data: {
    name: string;
    description?: string;
    icon?: string;
  }) {
    const created = await createCollection(data);
    await loadCollections();

    saveStoredCollectionId(created.id);

    navigate(`${basePath}?collectionId=${created.id}`);

    return created;
  }

  return {
    collections,
    collectionsLoaded,
    collectionError,
    selectedCollectionId,
    activeCollection,
    selectCollection,
    createNewCollection,
    reloadCollections: loadCollections,
  };
}