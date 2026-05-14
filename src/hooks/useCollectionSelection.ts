import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { createCollection, getCollections } from "../api/client";
import type { Collection } from "../types";

type CreateCollectionPayload = {
  name: string;
  description?: string;
  icon?: string;
};

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
    return collections.find(
      (collection) => collection.id === selectedCollectionId
    );
  }, [collections, selectedCollectionId]);

  useEffect(() => {
    void loadCollections();
  }, []);

  useEffect(() => {
    if (!collectionsLoaded) return;

    if (!selectedCollectionId && collections.length > 0) {
      navigate(`${basePath}?collectionId=${collections[0].id}`, {
        replace: true,
      });
      return;
    }

    if (
      selectedCollectionId &&
      collections.length > 0 &&
      !collections.some((collection) => collection.id === selectedCollectionId)
    ) {
      navigate(`${basePath}?collectionId=${collections[0].id}`, {
        replace: true,
      });
    }
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
      navigate(basePath);
      return;
    }

    navigate(`${basePath}?collectionId=${collectionId}`);
  }

  async function createNewCollection(data: CreateCollectionPayload) {
    const created = await createCollection(data);
    const updatedCollections = await loadCollections();

    if (updatedCollections.length > 0) {
      navigate(`${basePath}?collectionId=${created.id}`);
    }

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