/**
 * Home-page chat — floating pill + non-modal half-screen panel.
 *
 * UX pattern modelled on the ElevenLabs site:
 *   - Always-visible pill anchored bottom-center (no scroll lock).
 *   - Click expands into a panel that sits in the corner / center-bottom
 *     with margins around it — the page behind remains scrollable and
 *     interactive (no aria-modal, no backdrop, no body scroll lock).
 *   - Minimize button collapses the panel back to the pill.
 *
 * Streams from /api/chat with mode="home" so the API uses the
 * services-level system prompt + the home-page context blob from
 * src/lib/homeContext.ts.
 */
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { TinyMarkdown } from "../lib/tinyMarkdown";

interface UI {
  pillLabel: string;
  pillStatus: string;
  panelTitle: string;
  welcomeBody: string;
  placeholder: string;
  send: string;
  error: string;
  disclaimer: string;
  minimize: string;
  openChat: string;
}

interface Props {
  homeTitle: string;
  homeBody: string;
  lang: "hr" | "en";
  ui: UI;
}

const MAX_TEXTAREA_HEIGHT = 140;

export default function HomeChat({ homeTitle, homeBody, lang, ui }: Props) {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { postTitle: homeTitle, postBody: homeBody, lang, mode: "home" },
      }),
    [homeTitle, homeBody, lang],
  );
  const { messages, sendMessage, status, error, stop } = useChat({ transport });
  const taRef = useRef<HTMLTextAreaElement>(null);
  const listEndRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open && messages.length > 0) {
      listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [messages, open]);

  // Focus textarea on open; Esc minimizes back to pill. No focus trap —
  // this is a non-modal panel; keyboard users can Tab out into the page
  // behind, which is the intended behavior since the page is still
  // interactive.
  useEffect(() => {
    if (!open) return;
    const ta = taRef.current;
    if (ta) setTimeout(() => ta.focus(), 90);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Return focus to the pill when the panel closes (skip first render).
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (!open) pillRef.current?.focus({ preventScroll: true });
  }, [open]);

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
    <>
      {/* Floating pill — bottom-center, always visible until expanded. */}
      <button
        ref={pillRef}
        type="button"
        className="home-chat-pill"
        onClick={() => setOpen(true)}
        aria-label={ui.openChat}
        aria-expanded={open}
        aria-controls="home-chat-panel"
        hidden={open}
      >
        <span className="home-chat-pill-avatar" aria-hidden="true" />
        <span className="home-chat-pill-label">{ui.pillLabel}</span>
      </button>

      {/* Expanded panel — non-modal, page behind stays interactive. */}
      <section
        id="home-chat-panel"
        className="home-chat-panel"
        aria-labelledby="home-chat-panel-title"
        hidden={!open}
      >
        <header className="home-chat-panel-header">
          <span className="home-chat-panel-ident">
            <span className="home-chat-panel-avatar" aria-hidden="true" />
            <span className="home-chat-panel-title-block">
              <span id="home-chat-panel-title" className="home-chat-panel-title">
                {ui.panelTitle}
              </span>
              <span className="home-chat-panel-status">
                <span className="home-chat-panel-status-dot" aria-hidden="true" />
                {ui.pillStatus}
              </span>
            </span>
          </span>
          <button
            type="button"
            className="home-chat-panel-minimize"
            onClick={() => setOpen(false)}
            aria-label={ui.minimize}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="4 14 10 14 10 20" />
              <polyline points="20 10 14 10 14 4" />
              <line x1="14" y1="10" x2="21" y2="3" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          </button>
        </header>

        <div className="home-chat-panel-body">
          <div className="home-chat-row home-chat-row-assistant">
            <div className="home-chat-bubble">
              <p>{ui.welcomeBody}</p>
            </div>
          </div>

          {messages.map((m) => {
            const text = m.parts
              .map((p) => (p.type === "text" ? p.text : ""))
              .join("");
            return (
              <div key={m.id} className={`home-chat-row home-chat-row-${m.role}`}>
                <div className="home-chat-bubble">
                  {m.role === "assistant" ? <TinyMarkdown>{text}</TinyMarkdown> : text}
                </div>
              </div>
            );
          })}

          {error && <p className="home-chat-error">{ui.error}</p>}

          <div ref={listEndRef} />
        </div>

        <footer className="home-chat-panel-footer">
          <form onSubmit={onSubmit} className="home-chat-form">
            <div className="home-chat-input-shell">
              <textarea
                ref={taRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  adjustHeight();
                }}
                onKeyDown={onKeyDown}
                placeholder={ui.placeholder}
                aria-labelledby="home-chat-panel-title"
                rows={1}
              />
              {busy ? (
                <button
                  type="button"
                  onClick={() => stop()}
                  className="home-chat-send"
                  aria-label="Stop"
                >
                  <svg
                    width="12"
                    height="12"
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
                  className="home-chat-send"
                  disabled={!input.trim()}
                  aria-label={ui.send}
                >
                  <svg
                    width="14"
                    height="14"
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
          <p className="home-chat-disclaimer">{ui.disclaimer}</p>
        </footer>
      </section>
    </>
  );
}
