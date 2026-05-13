export interface Collection {
  id: number;
  name: string;
  description?: string | null;
  created_at: string;
}

export interface Vocab {
  id: number;
  german: string;
  vietnamese: string;
  examples: string;
  topic?: string | null;
  collection_id?: number | null;
  is_starred?: boolean;
  swipe_count?: number;
  created_at: string;
}

export interface McqQuestion {
  vocab_id?: number;
  question?: string;
  prompt?: string;
  options: string[];
  correct_answer?: string;
  answer?: string;
  explanation?: string;
}

export interface StatsSummary {
  total_words?: number;

  // Keep these optional so old backend responses do not cause NaN
  flashcards_practiced?: number;
  mcq_total?: number;
  mcq_correct?: number;
  mcq_wrong?: number;
}

export interface DailyStats {
  date: string;
  words_added?: number;

  // Keep old fields optional for compatibility
  swipes?: number;
  mcq_total?: number;

  mcq_correct?: number;
  mcq_wrong?: number;
}

export interface ChatTopic {
  id: string;
  title: string;
  description: string;
  image: string;
}

export interface ChatMessage {
  role: "ai" | "user" | "system" | string;
  content: string;
}

export interface StartChatResponse {
  session_id: number;
  topic_id: string;
  topic_title: string;
  topic_description: string;
  topic_image: string;
  current_step: number;
  total_steps: number;
  question: string;
  masked_answer: string;
  full_answer: string;
  hint_level: number;
  finished: boolean;
  messages: ChatMessage[];
}

export interface ChatAnswerResponse extends StartChatResponse {
  is_correct: boolean;
  should_advance: boolean;
  score: number;
  feedback: string;
  corrected_answer: string;
}