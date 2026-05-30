/**
 * Per-post chat island. Streams answers from /api/chat via @ai-sdk/react's
 * useChat hook. The post body + title are sent on every request as the
 * grounding context (see api/chat.ts for the system prompt).
 */
import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";

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

export default function BlogChat({ postTitle, postBody, lang, ui }: Props) {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error } = useChat({
    api: "/api/chat",
    body: { postTitle, postBody, lang },
  });
  const listEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 0) {
      listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [messages]);

  const busy = status === "submitted" || status === "streaming";

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    sendMessage({ text });
    setInput("");
  };

  return (
    <section className="blog-chat-section">
      <div className="container">
        <div className="blog-chat">
          <h3>{ui.title}</h3>

          {messages.length > 0 && (
            <div className="blog-chat-messages">
              {messages.map((m) => (
                <div key={m.id} className={`blog-chat-msg blog-chat-msg-${m.role}`}>
                  {m.parts.map((p, i) =>
                    p.type === "text" ? <span key={i}>{p.text}</span> : null,
                  )}
                </div>
              ))}
              <div ref={listEndRef} />
            </div>
          )}

          {error && <p className="blog-chat-error">{ui.error}</p>}

          <form onSubmit={onSubmit} className="blog-chat-form">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={ui.placeholder}
              disabled={busy}
              aria-label={ui.placeholder}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={busy || !input.trim()}
            >
              {busy ? "…" : ui.send}
            </button>
          </form>

          <p className="blog-chat-disclaimer">{ui.disclaimer}</p>
        </div>
      </div>
    </section>
  );
}
