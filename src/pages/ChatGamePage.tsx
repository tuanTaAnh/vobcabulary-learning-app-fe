import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";

import { answerChat, getChatTopics, getHint, startChat } from "../api/client";
import CuteButton from "../components/CuteButton";
import type { ChatTopic } from "../types";

type ChatRole = "ai" | "user" | "system";

type ChatMessage = {
  role: ChatRole;
  content: string;
};

type ChatState = {
  sessionId: number | null;
  currentStep: number;
  totalSteps: number;
  hintLevel: number;
  finished: boolean;
  maskedAnswer: string;
  fullAnswer: string;
};

type LooseObject = Record<string, unknown>;

type LooseTopic = ChatTopic & {
  image?: string;
  image_url?: string;
  background?: string;
  background_image?: string;
  emoji?: string;
};

function asObject(value: unknown): LooseObject {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as LooseObject;
  }

  return {};
}

function getString(
  object: LooseObject,
  keys: string[],
  fallback = ""
): string {
  for (const key of keys) {
    const value = object[key];

    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return fallback;
}

function getNumber(
  object: LooseObject,
  keys: string[],
  fallback = 0
): number {
  for (const key of keys) {
    const value = object[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return fallback;
}

function getBoolean(
  object: LooseObject,
  keys: string[],
  fallback = false
): boolean {
  for (const key of keys) {
    const value = object[key];

    if (typeof value === "boolean") {
      return value;
    }
  }

  return fallback;
}

function normalizeRole(value: unknown): ChatRole {
  if (value === "user") return "user";
  if (value === "system") return "system";

  return "ai";
}

function normalizeMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const object = asObject(item);
      const content = getString(object, ["content", "message", "text"]);

      if (!content) {
        return null;
      }

      return {
        role: normalizeRole(object.role),
        content,
      };
    })
    .filter((item): item is ChatMessage => item !== null);
}

function normalizeStartResponse(rawResponse: unknown): {
  chatState: ChatState;
  messages: ChatMessage[];
} {
  const object = asObject(rawResponse);

  const messages = normalizeMessages(object.messages);
  const firstQuestion = getString(object, [
    "question",
    "next_question",
    "ai_question",
    "prompt",
  ]);

  const normalizedMessages =
    messages.length > 0
      ? messages
      : firstQuestion
        ? [
            {
              role: "ai" as const,
              content: firstQuestion,
            },
          ]
        : [];

  return {
    chatState: {
      sessionId: getNumber(object, ["session_id", "sessionId", "id"], 0),
      currentStep: getNumber(object, ["current_step", "currentStep"], 0),
      totalSteps: getNumber(object, ["total_steps", "totalSteps"], 0),
      hintLevel: getNumber(object, ["hint_level", "hintLevel"], 0),
      finished: getBoolean(object, ["finished", "is_finished"], false),
      maskedAnswer: getString(object, [
        "masked_answer",
        "maskedAnswer",
        "suggested_answer_pattern",
      ]),
      fullAnswer: getString(object, [
        "full_answer",
        "fullAnswer",
        "expected_answer",
        "expectedAnswer",
        "answer",
      ]),
    },
    messages: normalizedMessages,
  };
}

function normalizeAnswerResponse(
  rawResponse: unknown,
  previousMessages: ChatMessage[],
  previousState: ChatState
): {
  chatState: ChatState;
  messages: ChatMessage[];
} {
  const object = asObject(rawResponse);

  const responseMessages = normalizeMessages(object.messages);

  let nextMessages =
    responseMessages.length > 0 ? responseMessages : [...previousMessages];

  if (responseMessages.length === 0) {
    const feedback = getString(object, [
      "feedback",
      "message",
      "result",
      "explanation",
    ]);

    const nextQuestion = getString(object, [
      "next_question",
      "question",
      "ai_question",
      "prompt",
    ]);

    if (feedback) {
      nextMessages = [
        ...nextMessages,
        {
          role: "system",
          content: feedback,
        },
      ];
    }

    if (nextQuestion) {
      nextMessages = [
        ...nextMessages,
        {
          role: "ai",
          content: nextQuestion,
        },
      ];
    }
  }

  return {
    chatState: {
      sessionId: getNumber(
        object,
        ["session_id", "sessionId", "id"],
        previousState.sessionId ?? 0
      ),
      currentStep: getNumber(
        object,
        ["current_step", "currentStep"],
        previousState.currentStep
      ),
      totalSteps: getNumber(
        object,
        ["total_steps", "totalSteps"],
        previousState.totalSteps
      ),
      hintLevel: getNumber(
        object,
        ["hint_level", "hintLevel"],
        previousState.hintLevel
      ),
      finished: getBoolean(
        object,
        ["finished", "is_finished"],
        previousState.finished
      ),
      maskedAnswer: getString(
        object,
        ["masked_answer", "maskedAnswer", "suggested_answer_pattern"],
        previousState.maskedAnswer
      ),
      fullAnswer: getString(
        object,
        ["full_answer", "fullAnswer", "expected_answer", "expectedAnswer", "answer"],
        previousState.fullAnswer
      ),
    },
    messages: nextMessages,
  };
}

function getTopicImage(topic: ChatTopic): string {
  const looseTopic = topic as LooseTopic;

  return (
    looseTopic.image ||
    looseTopic.image_url ||
    `/images/scenes/${topic.id}.png`
  );
}

function getTopicBackground(topic: ChatTopic): string {
  const looseTopic = topic as LooseTopic;

  return (
    looseTopic.background ||
    looseTopic.background_image ||
    looseTopic.image ||
    looseTopic.image_url ||
    `/images/scenes/${topic.id}.png`
  );
}

function getTopicEmoji(topic: ChatTopic): string {
  const looseTopic = topic as LooseTopic;

  return looseTopic.emoji || "💬";
}

function ChatGamePage() {
  const [searchParams] = useSearchParams();
  const pickerSignal = searchParams.get("picker");

  const chatWindowRef = useRef<HTMLDivElement | null>(null);

  const [topics, setTopics] = useState<ChatTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<ChatTopic | null>(null);

  const [chatState, setChatState] = useState<ChatState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [answer, setAnswer] = useState("");

  const [loadingTopics, setLoadingTopics] = useState(true);
  const [loadingSession, setLoadingSession] = useState(false);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [error, setError] = useState("");

  const progressText = useMemo(() => {
    if (!chatState) {
      return "";
    }

    if (!chatState.totalSteps) {
      return `Scene progress ${chatState.currentStep}`;
    }

    return `Scene progress ${chatState.currentStep} / ${chatState.totalSteps}`;
  }, [chatState]);

  const resetToScenePicker = useCallback(() => {
    setSelectedTopic(null);
    setChatState(null);
    setMessages([]);
    setAnswer("");
    setLoadingSession(false);
    setSubmittingAnswer(false);
    setError("");
  }, []);

  useEffect(() => {
    let active = true;

    async function loadTopics() {
      try {
        const data = await getChatTopics();

        if (!active) return;

        setTopics(data);
        setError("");
      } catch {
        if (!active) return;

        setError("Could not load AI scenes. Please check the backend.");
      } finally {
        if (active) {
            setLoadingTopics(false);
        }
      }
    }

    void loadTopics();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!pickerSignal) return;

    const timer = window.setTimeout(() => {
      resetToScenePicker();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [pickerSignal, resetToScenePicker]);

  useEffect(() => {
    if (!chatWindowRef.current) return;

    chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
  }, [messages.length]);

  async function startScene(topic: ChatTopic) {
    try {
      setLoadingSession(true);
      setError("");
      setSelectedTopic(topic);
      setAnswer("");

      const response = await startChat(topic.id);
      const normalized = normalizeStartResponse(response);

      setChatState(normalized.chatState);
      setMessages(normalized.messages);
    } catch {
      setError("Could not start this scene. Please check the backend.");
    } finally {
      setLoadingSession(false);
    }
  }

  async function refreshCurrentChat() {
    if (!selectedTopic) return;

    await startScene(selectedTopic);
  }

  async function handleShowHint() {
    if (!chatState?.sessionId || chatState.finished) return;

    try {
      const nextHintLevel = chatState.hintLevel + 1;
      const response = await getHint(chatState.sessionId, nextHintLevel);
      const object = asObject(response);

      setChatState((previous) => {
        if (!previous) return previous;

        return {
          ...previous,
          hintLevel: getNumber(object, ["hint_level", "hintLevel"], nextHintLevel),
          maskedAnswer: getString(
            object,
            ["masked_answer", "maskedAnswer", "suggested_answer_pattern"],
            previous.maskedAnswer
          ),
        };
      });
    } catch {
      setError("Could not get a hint. Please try again.");
    }
  }

  function handleRevealFullAnswer() {
    if (!chatState || chatState.finished) return;

    const fullAnswer =
      chatState.fullAnswer ||
      "The full answer is not available for this step yet. Try using Show Hint first.";

    setMessages((previous) => [
      ...previous,
      {
        role: "system",
        content: `Full answer: ${fullAnswer}`,
      },
    ]);
  }

  async function handleSubmitAnswer() {
    if (!chatState?.sessionId || chatState.finished) return;

    const cleanAnswer = answer.trim();

    if (!cleanAnswer) return;

    const pendingMessages: ChatMessage[] = [
      ...messages,
      {
        role: "user",
        content: cleanAnswer,
      },
    ];

    try {
      setSubmittingAnswer(true);
      setError("");
      setAnswer("");
      setMessages(pendingMessages);

      const response = await answerChat(chatState.sessionId, cleanAnswer);
      const normalized = normalizeAnswerResponse(
        response,
        pendingMessages,
        chatState
      );

      setChatState(normalized.chatState);
      setMessages(normalized.messages);
    } catch {
      setError("Could not submit your answer. Please check the backend.");
      setMessages(pendingMessages);
    } finally {
      setSubmittingAnswer(false);
    }
  }

  function handleAnswerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    void handleSubmitAnswer();
  }
}

  if (!selectedTopic) {
    return (
      <section className="chat-game-page">
        <div className="cute-card page-header-card">
          <div>
            <span className="badge">AI Scene Practice</span>
            <h2>Learn Through Everyday Scenes</h2>
            <p>
              Choose a scene and practice a longer, more natural German
              conversation.
            </p>
          </div>
        </div>

        {error && (
          <div className="cute-card answer-result bad">
            <strong>Error</strong>
            <p>{error}</p>
          </div>
        )}

        {loadingTopics && (
          <div className="cute-card empty-deck">
            <h3>Loading scenes...</h3>
            <p>Please wait a moment.</p>
          </div>
        )}

        {!loadingTopics && topics.length === 0 && (
          <div className="cute-card empty-deck">
            <h3>No scenes found</h3>
            <p>Please check your backend scene configuration.</p>
          </div>
        )}

        {!loadingTopics && topics.length > 0 && (
          <div className="topic-grid">
            {topics.map((topic) => (
              <button
                key={topic.id}
                type="button"
                className="cute-card topic-card"
                style={{
                  backgroundImage: `linear-gradient(90deg, rgba(255, 252, 246, 0.88), rgba(255, 252, 246, 0.68)), url("${getTopicImage(
                    topic
                  )}")`,
                }}
                onClick={() => void startScene(topic)}
              >
                <h3>
                  {getTopicEmoji(topic)} {topic.title}
                </h3>
                <p>{topic.description}</p>
                <span>Start scene →</span>
              </button>
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="chat-game-page">
      <div className="cute-card page-header-card">
        <div>
          <span className="badge">AI Scene Practice</span>
          <h2>Learn Through Everyday Scenes</h2>
        </div>

        {progressText && <span className="study-counter">{progressText}</span>}
      </div>

      {error && (
        <div className="cute-card answer-result bad">
          <strong>Error</strong>
          <p>{error}</p>
        </div>
      )}

      <div
        className="chat-scene-shell"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 252, 246, 0.55), rgba(255, 252, 246, 0.65)), url("${getTopicBackground(
            selectedTopic
          )}")`,
        }}
      >
        <div className="chat-scene-overlay">
          <aside className="scene-panel">
            <div className="scene-preview">
              <img src={getTopicImage(selectedTopic)} alt={selectedTopic.title} />
            </div>

            <div className="scene-info">
              <span className="scene-badge">Current Scene</span>
              <h3>{selectedTopic.title}</h3>
              <p>{selectedTopic.description}</p>
            </div>

            <CuteButton
              variant="primary"
              onClick={() => void refreshCurrentChat()}
              disabled={loadingSession}
            >
              🔄 Refresh Chat
            </CuteButton>

            <CuteButton onClick={resetToScenePicker}>Change Scene</CuteButton>
          </aside>

          <main className="chat-panel">
            <div className="chat-window" ref={chatWindowRef}>
              {loadingSession && (
                <div className="chat-line system">Starting scene...</div>
              )}

              {messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`chat-line ${message.role}`}>
                  {message.content}
                </div>
              ))}

              {chatState?.finished && (
                <div className="finish-box">
                  Great job! You finished this scene. You can refresh the chat
                  or choose another scene.
                </div>
              )}
            </div>

            {!chatState?.finished && (
              <div className="answer-helper">
                <small>Suggested answer pattern:</small>

                <div className="masked-answer">
                  {chatState?.maskedAnswer ||
                    "Click Show Hint to see a suggested answer pattern."}
                </div>

                <div className="inline-actions">
                  <CuteButton onClick={() => void handleShowHint()}>
                    Show Hint
                  </CuteButton>

                  <CuteButton onClick={handleRevealFullAnswer}>
                    Reveal Full Answer
                  </CuteButton>
                </div>

                <textarea
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  onKeyDown={handleAnswerKeyDown}
                  placeholder="Write your German answer here..."
                  disabled={submittingAnswer || loadingSession}
                />

                <CuteButton
                  variant="primary"
                  onClick={() => void handleSubmitAnswer()}
                  disabled={
                    submittingAnswer || loadingSession || answer.trim().length === 0
                  }
                >
                  {submittingAnswer ? "Checking..." : "Send Answer"}
                </CuteButton>
              </div>
            )}
          </main>
        </div>
      </div>
    </section>
  );
}

export default ChatGamePage;