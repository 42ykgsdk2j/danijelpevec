/**
 * Per-post chat island — Intercom-style floating launcher + slide-up panel.
 *
 * Streams answers from /api/chat via @ai-sdk/react's useChat hook. The post
 * body + title are sent on every request as the grounding context (see
 * api/chat.ts for the system prompt).
 *
 * Visual layout copies the Intercom Messenger pattern: white circular
 * launcher at bottom-right (with an unread-reply dot), and a dark slide-up
 * panel with an avatar/title header, a welcome bubble + AI-agent attribution,
 * the conversation thread, a pill input, and a privacy footer.
 */
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface UI {
  title: string;
  subtitle: string;
  placeholder: string;
  send: string;
  error: string;
  disclaimer: string;
  welcomeBody: string;
  agentLabel: string;
  justNow: string;
  minimize: string;
  openChat: string;
}

interface Props {
  postTitle: string;
  postBody: string;
  lang: "hr" | "en";
  ui: UI;
}

const MAX_TEXTAREA_HEIGHT = 180;

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
  const launcherRef = useRef<HTMLButtonElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    if (open && messages.length > 0) {
      listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [messages, open]);

  // Focus textarea on open, Esc to close.
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

  // Return focus to launcher when panel closes (skip first render).
  // preventScroll keeps the page from jumping toward the launcher if
  // the browser thinks it's not "in view" — the launcher is fixed so
  // this is defensive.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (!open) launcherRef.current?.focus({ preventScroll: true });
  }, [open]);

  // Body scroll lock while the chat is open — only on mobile (≤480px)
  // where the panel goes full-screen. On iOS the scroll context lives on
  // <html>, not <body>, so plain `overflow: hidden` on body doesn't lock
  // it. The reliable pattern is `position: fixed` on body with the
  // current scrollY captured into `top: -<scrollY>px`. On close we undo
  // the styles and restore the scroll position so the page doesn't jump.
  useEffect(() => {
    if (!open) return;
    const mql = window.matchMedia("(max-width: 480px)");
    if (!mql.matches) return;

    const scrollY = window.scrollY;
    const body = document.body;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
    body.classList.add("chat-open");

    return () => {
      // The site has `html { scroll-behavior: smooth }` globally, which
      // would animate the scrollTo below — making the page visibly glide
      // to its previous position when the user closes the chat. Pin
      // scroll-behavior to "auto" for the restoration, then put it back
      // on the next frame so other smooth-scrolling on the page is
      // unaffected.
      const html = document.documentElement;
      const prevBehavior = html.style.scrollBehavior;
      html.style.scrollBehavior = "auto";

      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.left = prev.left;
      body.style.right = prev.right;
      body.style.width = prev.width;
      body.style.overflow = prev.overflow;
      body.classList.remove("chat-open");
      window.scrollTo(0, scrollY);

      requestAnimationFrame(() => {
        html.style.scrollBehavior = prevBehavior;
      });
    };
  }, [open]);

  const busy = status === "submitted" || status === "streaming";
  const hasUnread = !open && messages.some((m) => m.role === "assistant");

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
      {/* Closed-state launcher — white circle, dark chat-bubble icon, red
          unread dot. */}
      <button
        ref={launcherRef}
        type="button"
        className="chat-launcher"
        onClick={() => setOpen(true)}
        aria-label={ui.openChat}
        aria-expanded={open}
        aria-controls="blog-chat-panel"
        hidden={open}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 32 32"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M16 3C8.82 3 3 8.16 3 14.53c0 3.66 1.95 6.91 4.97 9.02-.13 1.36-.6 3.18-1.27 4.6-.18.38.16.81.58.7 2.83-.7 5.27-2.13 6.31-3.04 0 0 1.43.21 2.41.21 7.18 0 13-5.16 13-11.49C29 8.16 23.18 3 16 3zm-5.5 13.4c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm5.5 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm5.5 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
        </svg>
        {hasUnread && <span className="chat-launcher-dot" aria-hidden="true" />}
      </button>

      {/* Open-state minimize button — sits below the panel in the same corner,
          smaller circle with a down-chevron. Clicking it minimizes back to
          the launcher. */}
      <button
        type="button"
        className="chat-minimize"
        onClick={() => setOpen(false)}
        aria-label={ui.minimize}
        hidden={!open}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Slide-up dark panel. */}
      <div
        id="blog-chat-panel"
        className="chat-panel"
        role="dialog"
        aria-modal="false"
        aria-labelledby="chat-panel-title"
        hidden={!open}
      >
        <header className="chat-panel-header">
          <div className="chat-panel-ident">
            <span className="chat-panel-avatar" aria-hidden="true">DP</span>
            <div className="chat-panel-meta">
              <span id="chat-panel-title" className="chat-panel-title">{ui.title}</span>
              <span className="chat-panel-subtitle">{ui.subtitle}</span>
            </div>
          </div>
          <button
            type="button"
            className="chat-panel-close"
            onClick={() => setOpen(false)}
            aria-label={ui.minimize}
          >
            <svg
              width="20"
              height="20"
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
        </header>

        <div className="chat-panel-body">
          {/* Persistent welcome bubble — modeled on Intercom's initial greeting */}
          <div className="chat-row chat-row-assistant">
            <div className="chat-bubble">
              <p>{ui.welcomeBody}</p>
            </div>
            <div className="chat-attribution">
              {ui.agentLabel} · {ui.justNow}
            </div>
          </div>

          {messages.map((m) => {
            const text = m.parts
              .map((p) => (p.type === "text" ? p.text : ""))
              .join("");
            return (
              <div key={m.id} className={`chat-row chat-row-${m.role}`}>
                <div className="chat-bubble">
                  {m.role === "assistant" ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
                  ) : (
                    text
                  )}
                </div>
              </div>
            );
          })}

          {error && <p className="chat-error">{ui.error}</p>}

          <div ref={listEndRef} />
        </div>

        <footer className="chat-panel-footer">
          <form onSubmit={onSubmit} className="chat-form">
            <div className="chat-input-shell">
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
                  className="chat-send"
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
                  className="chat-send"
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
          <p className="chat-disclaimer">{ui.disclaimer}</p>
        </footer>
      </div>
    </>
  );
}
