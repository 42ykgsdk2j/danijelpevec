/**
 * Per-post chat island. Streams answers from /api/chat via @ai-sdk/react's
 * useChat hook. The post body + title are sent on every request as the
 * grounding context (see api/chat.ts for the system prompt).
 *
 * UI: floating Intercom-style launcher at bottom-right that opens a slide-up
 * chat panel. The panel uses the same ChatGPT-inspired layout (pill input
 * with embedded send, auto-grow textarea, user messages as right-aligned
 * bubbles, assistant responses as flowing markdown).
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
  const [open, setOpen] = useState(false);
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
  const panelRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open && messages.length > 0) {
      listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [messages, open]);

  // Move focus to the textarea when the panel opens, and back to the launcher
  // when it closes — so keyboard users keep their place. Esc closes.
  useEffect(() => {
    if (!open) return;
    const ta = taRef.current;
    if (ta) setTimeout(() => ta.focus(), 80);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Return focus to the launcher when the panel closes — but skip the first
  // render so we don't steal focus on page load.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (!open) {
      launcherRef.current?.focus();
    }
  }, [open]);

  const busy = status === "submitted" || status === "streaming";
  const closeLabel = lang === "hr" ? "Zatvori razgovor" : "Close chat";
  const openLabel = ui.title;
  const hasNewBadge = !open && messages.some((m) => m.role === "assistant");

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
    <>
      <button
        ref={launcherRef}
        type="button"
        className={`blog-chat-launcher${open ? " open" : ""}`}
        onClick={() => setOpen(true)}
        aria-label={openLabel}
        aria-expanded={open}
        aria-controls="blog-chat-panel"
        hidden={open}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
        {hasNewBadge && <span className="blog-chat-launcher-dot" aria-hidden="true" />}
        <span className="blog-chat-launcher-label">{openLabel}</span>
      </button>

      <div
        ref={panelRef}
        id="blog-chat-panel"
        className={`blog-chat-panel${open ? " open" : ""}`}
        role="dialog"
        aria-modal="false"
        aria-labelledby="blog-chat-panel-title"
        hidden={!open}
      >
        <div className="blog-chat-panel-header">
          <h3 id="blog-chat-panel-title">{ui.title}</h3>
          <button
            type="button"
            className="blog-chat-close"
            onClick={() => setOpen(false)}
            aria-label={closeLabel}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="blog-chat-panel-body">
          <div className="blog-chat-messages">
            {messages.length === 0 && (
              <div className="blog-chat-empty">
                <p className="blog-chat-empty-title">{ui.title}</p>
                <p className="blog-chat-empty-sub">{ui.placeholder}</p>
              </div>
            )}
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

          {error && <p className="blog-chat-error">{ui.error}</p>}
        </div>

        <div className="blog-chat-panel-footer">
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
    </>
  );
}
