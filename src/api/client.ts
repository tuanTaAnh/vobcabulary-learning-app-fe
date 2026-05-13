import type {
  ChatAnswerResponse,
  ChatTopic,
  Collection,
  DailyStats,
  McqQuestion,
  StartChatResponse,
  StatsSummary,
  Vocab,
} from "../types";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed");
  }

  return (await response.json()) as T;
}

/* Collections */

export function getCollections() {
  return request<Collection[]>("/collections");
}

export function createCollection(data: {
  name: string;
  description?: string;
}) {
  return request<Collection>("/collections", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateCollection(
  id: number,
  data: {
    name?: string;
    description?: string;
  }
) {
  return request<Collection>(`/collections/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteCollection(id: number) {
  return request<{ deleted: boolean }>(`/collections/${id}`, {
    method: "DELETE",
  });
}

/* Vocab */

export function getVocabs(params?: {
  collectionId?: number;
  startDate?: string;
  endDate?: string;
  topic?: string | null;
}) {
  const searchParams = new URLSearchParams();

  if (params?.collectionId) {
    searchParams.set("collection_id", String(params.collectionId));
  }

  if (params?.startDate) {
    searchParams.set("start_date", params.startDate);
  }

  if (params?.endDate) {
    searchParams.set("end_date", params.endDate);
  }

  if (params?.topic) {
    searchParams.set("topic", params.topic);
  }

  const query = searchParams.toString();

  return request<Vocab[]>(`/vocab${query ? `?${query}` : ""}`);
}

export function createVocab(data: {
  german: string;
  vietnamese: string;
  examples: string;
  topic?: string | null;
  collection_id?: number | null;
}) {
  return request<Vocab>("/vocab", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateVocab(
  id: number,
  data: {
    german?: string;
    vietnamese?: string;
    examples?: string;
    topic?: string | null;
    collection_id?: number | null;
    swipe_count?: number;
    is_starred?: boolean;
  }
) {
  return request<Vocab>(`/vocab/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteVocab(id: number) {
  return request<{ deleted: boolean }>(`/vocab/${id}`, {
    method: "DELETE",
  });
}

export function recordSwipe(id: number) {
  return request<{ recorded: boolean }>(`/vocab/${id}/swipe`, {
    method: "POST",
  });
}

/* AI Examples */

export function generateExamples(data: {
  german: string;
  vietnamese: string;
  topic?: string | null;
  level?: string;
}) {
  return request<{ examples: string[] }>("/ai/examples", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/* MCQ */

export function getMcq(params?: { collectionId?: number }) {
  const searchParams = new URLSearchParams();

  if (params?.collectionId) {
    searchParams.set("collection_id", String(params.collectionId));
  }

  const query = searchParams.toString();

  return request<McqQuestion>(`/mcq${query ? `?${query}` : ""}`);
}

export function recordMcq(data: {
  vocab_id?: number;
  correct: boolean;
}) {
  const searchParams = new URLSearchParams();

  if (data.vocab_id) {
    searchParams.set("vocab_id", String(data.vocab_id));
  }

  searchParams.set("correct", String(data.correct));

  return request<{ recorded: boolean }>(
    `/mcq/record?${searchParams.toString()}`,
    {
      method: "POST",
    }
  );
}

/* Stats */

export function getStats() {
  return request<DailyStats[]>("/stats");
}

export function getStatsSummary() {
  return request<StatsSummary>("/stats/summary");
}

export function getDailyStats() {
  return request<DailyStats[]>("/stats/daily");
}

/* Chat Game */

export function getChatTopics() {
  return request<ChatTopic[]>("/chat/topics");
}

export function startChat(topicId: string) {
  return request<StartChatResponse>("/chat/start", {
    method: "POST",
    body: JSON.stringify({
      topic_id: topicId,
    }),
  });
}

export function getHint(sessionId: number, hintLevel: number) {
  return request<{
    session_id: number;
    masked_answer: string;
    full_answer: string;
    hint_level: number;
  }>("/chat/hint", {
    method: "POST",
    body: JSON.stringify({
      session_id: sessionId,
      hint_level: hintLevel,
    }),
  });
}

export function answerChat(sessionId: number, answer: string) {
  return request<ChatAnswerResponse>("/chat/answer", {
    method: "POST",
    body: JSON.stringify({
      session_id: sessionId,
      answer,
    }),
  });
}