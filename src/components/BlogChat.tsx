/**
 * Per-post chat island. Streams answers from /api/chat via @ai-sdk/react's
 * useChat hook. The post body + title are sent on every request as the
 * grounding context (see api/chat.ts for the system prompt).
 *
 * UI: ChatGPT-inspired — pill input with embedded send button, auto-grow
 * textarea, user messages as small right-aligned bubbles, assistant
 * responses as flowing markdown text. Tuned to Danijel Pevec's palette.
 */
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface UI {
  title: string;
  placeholder: string;
  send: string;
  error: string;
  disclaimer: string;
}

interface Props {
  postTitle: string;
  postBody: string;
  lang: "hr" | "en";
  ui: UI;
}

const MAX_TEXTAREA_HEIGHT = 200;

export default function BlogChat({ postTitle, postBody, lang, ui }: Props) {
  const [input, setInput] = useState("");
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { postTitle, postBody, lang },
      }),
    [postTitle, postBody, lang],
  );
  const { messages, sendMessage, status, error, stop } = useChat({ transport });
  const taRef = useRef<HTMLTextAreaElement>(null);
  const listEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 0) {
      listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [messages]);

  const busy = status === "submitted" || status === "streaming";

  function adjustHeight() {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }

  function handleSend() {
    const text = input.trim();
    if (!text || busy) return;
    sendMessage({ text });
    setInput("");
    requestAnimationFrame(adjustHeight);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleSend();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <section className="blog-chat-section">
      <div className="container">
        <div className="blog-chat">
          <h3>{ui.title}</h3>

          {messages.length > 0 && (
            <div className="blog-chat-messages">
              {messages.map((m) => {
                const text = m.parts
                  .map((p) => (p.type === "text" ? p.text : ""))
                  .join("");
                return (
                  <div key={m.id} className={`blog-chat-msg blog-chat-msg-${m.role}`}>
                    {m.role === "assistant" ? (
                      <div className="blog-chat-msg-body">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="blog-chat-msg-body">{text}</div>
                    )}
                  </div>
                );
              })}
              <div ref={listEndRef} />
            </div>
          )}

          {error && <p className="blog-chat-error">{ui.error}</p>}

          <form onSubmit={onSubmit} className="blog-chat-form">
            <div className="blog-chat-input-shell">
              <textarea
                ref={taRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  adjustHeight();
                }}
                onKeyDown={onKeyDown}
                placeholder={ui.placeholder}
                aria-label={ui.placeholder}
                rows={1}
              />
              {busy ? (
                <button
                  type="button"
                  onClick={() => stop()}
                  className="blog-chat-send"
                  aria-label="Stop"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <rect x="6" y="6" width="12" height="12" rx="1.5" />
                  </svg>
                </button>
              ) : (
                <button
                  type="submit"
                  className="blog-chat-send"
                  disabled={!input.trim()}
                  aria-label={ui.send}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="12" y1="19" x2="12" y2="5" />
                    <polyline points="5 12 12 5 19 12" />
                  </svg>
                </button>
              )}
            </div>
          </form>

          <p className="blog-chat-disclaimer">{ui.disclaimer}</p>
        </div>
      </div>
    </section>
  );
}
