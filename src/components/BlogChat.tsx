/**
 * Per-post chat island. Streams answers from /api/chat via @ai-sdk/react's
 * useChat hook. The post body + title are sent on every request as the
 * grounding context (see api/chat.ts for the system prompt).
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
  const { messages, sendMessage, status, error } = useChat({ transport });
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
              {messages.map((m) => {
                const text = m.parts
                  .map((p) => (p.type === "text" ? p.text : ""))
                  .join("");
                return (
                  <div key={m.id} className={`blog-chat-msg blog-chat-msg-${m.role}`}>
                    {m.role === "assistant" ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
                    ) : (
                      text
                    )}
                  </div>
                );
              })}
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
