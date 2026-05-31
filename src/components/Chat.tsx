/**
 * Unified chat widget — used on three surfaces with mode-specific
 * grounding: "home" (home pages), "blog" (article pages), "discover"
 * (blog index page).
 *
 * Behaviour:
 *   - Floating pill button anchored bottom-center (always visible).
 *   - On mobile (≤480px): expands into a full-screen modal with body
 *     scroll lock + focus trap + aria-modal="true".
 *   - On desktop: expands into a bottom-right floating panel,
 *     non-modal — the page behind stays scrollable + interactive.
 *   - Minimize button collapses back to the pill.
 *   - Esc minimizes.
 *
 * Grounding:
 *   - home: streams from /api/chat with mode="home" using the home-page
 *     summary as context. Static welcome bubble.
 *   - blog: streams from /api/chat with mode="blog" using the article
 *     title + body. On first open, auto-triggers a 3-point summary via
 *     a sentinel user message that the API recognises. Sentinel is
 *     hidden from the rendered thread.
 *   - discover: streams from /api/chat with mode="discover" using the
 *     full blog catalog as context. On first open, auto-triggers a
 *     theme overview + "which theme interests you?" question. Once the
 *     user replies, the model recommends up to 3 posts as markdown
 *     links pointing back at /blog/<slug>/ URLs from the catalog.
 */
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { useBodyScrollLock } from "../lib/useBodyScrollLock";
import { TinyMarkdown } from "../lib/tinyMarkdown";

interface UI {
  pillLabel: string;
  panelTitle: string;
  welcomeBody: string;
  placeholder: string;
  send: string;
  stop: string;
  error: string;
  disclaimer: string;
  minimize: string;
  openChat: string;
}

type ChatMode = "home" | "blog" | "discover";

interface Props {
  mode: ChatMode;
  contextTitle: string;
  contextBody: string;
  lang: "hr" | "en";
  ui: UI;
}

const MAX_TEXTAREA_HEIGHT = 140;
// Sentinel user messages dispatched on first open in modes that
// auto-start the conversation. The API recognises them and
// substitutes a real prompt; the client hides them from the rendered
// thread so the visitor only sees the assistant reply.
const AUTO_SUMMARY_SENTINEL = "__auto_summary_request__";
const AUTO_THEME_INTRO_SENTINEL = "__auto_theme_intro__";

function autoTriggerFor(mode: ChatMode): string | null {
  if (mode === "blog") return AUTO_SUMMARY_SENTINEL;
  if (mode === "discover") return AUTO_THEME_INTRO_SENTINEL;
  return null;
}

export default function Chat({ mode, contextTitle, contextBody, lang, ui }: Props) {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        // Trailing slash matches vercel.json's `trailingSlash: true`
        // canonicalization — without it every chat send pays an extra
        // 308 redirect hop.
        api: "/api/chat/",
        body: { postTitle: contextTitle, postBody: contextBody, lang, mode },
      }),
    [contextTitle, contextBody, lang, mode],
  );
  const { messages, sendMessage, status, error, stop } = useChat({ transport });

  const taRef = useRef<HTMLTextAreaElement>(null);
  const listEndRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);
  const autoSummaryTriggered = useRef(false);

  // Mobile vs desktop is the layout-mode pivot for scroll lock + focus
  // trap + aria-modal. Tracking it in state lets a viewport resize
  // mid-session keep the modal semantics consistent.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 480px)");
    const handler = () => setIsMobile(mq.matches);
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Auto-stream a context-specific intro on first open (blog → 3-point
  // summary, discover → theme overview). The sentinel user message is
  // dispatched once per session and hidden from the rendered thread.
  useEffect(() => {
    if (!open) return;
    if (autoSummaryTriggered.current) return;
    if (messages.length > 0) return;
    const sentinel = autoTriggerFor(mode);
    if (!sentinel) return;
    autoSummaryTriggered.current = true;
    sendMessage({ text: sentinel });
  }, [open, mode, messages.length, sendMessage]);

  useEffect(() => {
    if (open && messages.length > 0) {
      listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [messages, open]);

  // Focus textarea on open; Esc minimizes. Focus trap is only active on
  // mobile (full-screen modal); on desktop the panel is non-modal so
  // Tab can leave it intentionally.
  useEffect(() => {
    if (!open) return;
    const ta = taRef.current;
    if (ta) setTimeout(() => ta.focus(), 90);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (!isMobile) return;
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, isMobile]);

  // Return focus to the pill when the panel closes (skip first render
  // so we don't yank focus on initial mount).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (!open) pillRef.current?.focus({ preventScroll: true });
  }, [open]);

  // Body scroll lock — useBodyScrollLock is mobile-only (≤480px) by
  // design, so calling it always still gives desktop visitors a free
  // scrolling page behind the floating panel.
  useBodyScrollLock(open);

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

  // The static welcome bubble shows only in modes without an
  // auto-trigger (currently just "home"). In blog + discover modes the
  // AI streams the intro itself.
  const showStaticWelcome = autoTriggerFor(mode) === null;

  return (
    <>
      <button
        ref={pillRef}
        type="button"
        className="home-chat-pill"
        onClick={() => setOpen(true)}
        aria-label={ui.openChat}
        aria-expanded={open}
        aria-controls="dp-chat-panel"
        hidden={open}
      >
        <span className="home-chat-pill-avatar" aria-hidden="true" />
        <span className="home-chat-pill-label">{ui.pillLabel}</span>
      </button>

      <section
        ref={panelRef}
        id="dp-chat-panel"
        className="home-chat-panel"
        role="dialog"
        aria-modal={isMobile ? "true" : "false"}
        aria-labelledby="dp-chat-panel-title"
        hidden={!open}
      >
        <header className="home-chat-panel-header">
          <span className="home-chat-panel-ident">
            <span className="home-chat-panel-avatar" aria-hidden="true" />
            <span className="home-chat-panel-title-block">
              <span id="dp-chat-panel-title" className="home-chat-panel-title">
                {ui.panelTitle}
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

        <div
          className="home-chat-panel-body"
          /* aria-live makes screen readers announce streamed assistant
             tokens as they arrive. Without it the user types a message,
             hears their own input echo, then gets no signal that a reply
             is landing — they'd have to Tab into the bubble to find it.
             "polite" so we don't interrupt other announcements; the
             whole bubble is read once each turn. */
          aria-live="polite"
          aria-atomic="false"
        >
          {showStaticWelcome && (
            <div className="home-chat-row home-chat-row-assistant">
              <div className="home-chat-bubble">
                <p>{ui.welcomeBody}</p>
              </div>
            </div>
          )}

          {messages.map((m) => {
            const text = m.parts
              .map((p) => (p.type === "text" ? p.text : ""))
              .join("");
            // Hide the synthetic user message that triggers the
            // mode's auto-intro; only the assistant reply is shown to
            // the visitor.
            if (
              m.role === "user" &&
              (text === AUTO_SUMMARY_SENTINEL || text === AUTO_THEME_INTRO_SENTINEL)
            ) {
              return null;
            }
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
                aria-label={ui.placeholder}
                rows={1}
              />
              {busy ? (
                <button
                  type="button"
                  onClick={() => stop()}
                  className="home-chat-send"
                  aria-label={ui.stop}
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
