/**
 * Contact page — a guided conversation that drafts a proposal for a
 * first private conversation, then sends it.
 *
 * Three phases on one island:
 *   1. intro    — headline + large composer with the forms of work as chips
 *   2. chat     — thread on the left, the proposal filling in live on the
 *                 right (a bottom sheet on phones)
 *   3. sent     — confirmation
 *
 * The assistant (api/proposal.ts) calls an `updateDraft` tool every turn;
 * the newest call, even mid-stream, is the proposal shown in the panel.
 * Sending posts the finished draft + transcript to api/proposal-submit.ts.
 *
 * The thread is kept in sessionStorage so a reload doesn't lose a long
 * conversation; it never leaves the browser until the visitor sends.
 */
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Draft, Engagement } from "../lib/proposalSchema";
import type { Translations } from "../lib/i18n";
import { TinyMarkdown } from "../lib/tinyMarkdown";
import { useBodyScrollLock } from "../lib/useBodyScrollLock";

type UI = Translations["contactPage"];
type ModalUI = Translations["modal"];

interface Props {
  lang: "hr" | "en";
  ui: UI;
  modalUi: ModalUI;
  email: string;
  homeHref: string;
  hasRecaptcha: boolean;
}

type PartialDraft = Partial<Draft>;

const STORAGE_KEY = "dp_proposal_v1";
const MIN_COMPLETENESS_TO_SEND = 40;
const ENGAGEMENTS: Engagement[] = ["private-advisory", "family-sessions", "long-term", "not-sure"];

// ---------- draft helpers ----------

type DraftToolPart = { type: "tool-updateDraft"; state: string; input?: { draft?: PartialDraft; suggestions?: string[] } };

function isDraftPart(part: UIMessage["parts"][number]): part is UIMessage["parts"][number] & DraftToolPart {
  return part.type === "tool-updateDraft";
}

// The newest updateDraft call wins; it can be mid-stream, which lets the panel fill in live.
function latestDraft(messages: UIMessage[]): { draft: PartialDraft | null; suggestions: string[] } {
  for (let m = messages.length - 1; m >= 0; m--) {
    const message = messages[m];
    if (message.role !== "assistant") continue;
    for (let p = message.parts.length - 1; p >= 0; p--) {
      const part = message.parts[p];
      if (isDraftPart(part) && part.input?.draft) {
        const done = part.state === "input-available" || part.state === "output-available";
        return {
          draft: part.input.draft,
          suggestions: done && m === messages.length - 1 ? (part.input.suggestions ?? []).filter(Boolean) : [],
        };
      }
    }
  }
  return { draft: null, suggestions: [] };
}

function messageText(message: UIMessage) {
  return message.parts
    .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
    .map((p) => p.text)
    .join("");
}

function isDraftComplete(d: PartialDraft | null): d is Draft {
  return Boolean(d && d.engagement && d.title && d.situation && typeof d.completeness === "number");
}

// ---------- reCAPTCHA (same Enterprise setup as Modal.tsx) ----------

async function getRecaptchaToken(): Promise<string> {
  const w = window as unknown as {
    __dpRecaptchaSiteKey?: string;
    grecaptcha?: {
      enterprise: {
        ready: (cb: () => void) => void;
        execute: (key: string, opts: { action: string }) => Promise<string>;
      };
    };
  };
  const siteKey = w.__dpRecaptchaSiteKey;
  if (!siteKey || !w.grecaptcha?.enterprise) return "";
  return await new Promise<string>((resolve) => {
    w.grecaptcha!.enterprise.ready(() => {
      w.grecaptcha!.enterprise
        .execute(siteKey, { action: "proposal_form" })
        .then((tok) => resolve(tok), () => resolve(""));
    });
  });
}

// ---------- small pieces ----------

const ArrowUp = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </svg>
);

const ArrowRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

function useRotatingPlaceholder(items: string[], active: boolean) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setI((n) => (n + 1) % items.length), 4200);
    return () => clearInterval(id);
  }, [active, items.length]);
  return items[i];
}

interface ComposerProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  busy: boolean;
  placeholder: string;
  label: string;
  sendLabel: string;
  stopLabel: string;
  large?: boolean;
  autoFocus?: boolean;
  children?: ReactNode;
}

function Composer({ value, onChange, onSubmit, onStop, busy, placeholder, label, sendLabel, stopLabel, large, autoFocus, children }: ComposerProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, large ? 260 : 180)}px`;
  }, [value, large]);
  useEffect(() => {
    if (autoFocus) ref.current?.focus({ preventScroll: true });
  }, [autoFocus]);

  return (
    <form
      className={`cs-composer${large ? " cs-composer--large" : ""}`}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            onSubmit();
          }
        }}
        rows={large ? 3 : 1}
        maxLength={2000}
        placeholder={placeholder}
        aria-label={label}
      />
      <div className="cs-composer-bar">
        <div className="cs-composer-extras">{children}</div>
        {busy && onStop ? (
          <button type="button" className="cs-send cs-send--stop" onClick={onStop} aria-label={stopLabel}>
            <span className="cs-stop-square" />
          </button>
        ) : (
          <button type="submit" className="cs-send" disabled={busy || !value.trim()} aria-label={sendLabel}>
            <ArrowUp />
          </button>
        )}
      </div>
    </form>
  );
}

function Field({ label, value }: { label: string; value?: string | string[] }) {
  const items = Array.isArray(value) ? value.filter(Boolean) : [];
  const empty = Array.isArray(value) ? items.length === 0 : !value;
  return (
    <div className="cs-field">
      <div className="cs-field-label">{label}</div>
      {empty ? (
        <div className="cs-field-empty" aria-hidden="true" />
      ) : Array.isArray(value) ? (
        <ul>
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      ) : (
        <p>{value}</p>
      )}
    </div>
  );
}

function ProposalPanel({ ui, draft, canSend, onSend, onClose }: { ui: UI; draft: PartialDraft | null; canSend: boolean; onSend: () => void; onClose?: () => void }) {
  const pct = Math.max(0, Math.min(100, draft?.completeness ?? 0));
  const f = ui.fields;
  return (
    <div className="cs-panel">
      <div className="cs-panel-head">
        <div>
          <div className="eyebrow">{ui.panel.label}</div>
          <div className="cs-panel-kind">{draft?.engagement ? ui.engagement[draft.engagement] : ui.panel.shaping}</div>
        </div>
        <div className="cs-panel-pct">
          <span>{pct}%</span>
          <small>{ui.panel.ready}</small>
        </div>
        {onClose && (
          <button type="button" className="cs-icon-btn" onClick={onClose} aria-label={ui.panel.close}>
            <CloseIcon />
          </button>
        )}
      </div>
      <div className="cs-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={ui.panel.ready}>
        <span style={{ transform: `scaleX(${pct / 100})` }} />
      </div>

      <div className="cs-panel-body">
        <h3 className="cs-panel-title">{draft?.title || <span className="cs-muted">{ui.panel.untitled}</span>}</h3>
        <Field label={f.situation} value={draft?.situation} />
        {(draft?.role || draft?.stage) && (
          <div className="cs-field-row">
            {draft?.role && <Field label={f.role} value={draft.role} />}
            {draft?.stage && <Field label={f.stage} value={draft.stage} />}
          </div>
        )}
        <Field label={f.decisions} value={draft?.decisions} />
        {draft?.people && <Field label={f.people} value={draft.people} />}
        <Field label={f.goals} value={draft?.goals} />
        <Field label={f.timing} value={draft?.timing} />
        {draft?.sensitivities && <Field label={f.sensitivities} value={draft.sensitivities} />}
        {(draft?.openQuestions?.length ?? 0) > 0 && <Field label={f.openQuestions} value={draft?.openQuestions} />}
      </div>

      <div className="cs-panel-foot">
        <button type="button" className="btn btn-primary" onClick={onSend} disabled={!canSend}>
          {ui.panel.review}
          <ArrowRight />
        </button>
        <p>{canSend ? ui.panel.hintReady : ui.panel.hintLocked}</p>
      </div>
    </div>
  );
}

// ---------- send dialog ----------

interface SendDialogProps {
  ui: UI;
  modalUi: ModalUI;
  lang: "hr" | "en";
  draft: Draft;
  transcript: { role: "user" | "assistant"; text: string }[];
  hasRecaptcha: boolean;
  onClose: () => void;
  onSent: (email: string) => void;
}

function SendDialog({ ui, modalUi, lang, draft, transcript, hasRecaptcha, onClose, onSent }: SendDialogProps) {
  const d = ui.dialog;
  const [form, setForm] = useState({ name: "", email: "", company: "", phone: "" });
  const [errors, setErrors] = useState<{ name?: string; email?: string; submit?: string }>({});
  const [sending, setSending] = useState(false);
  const [open, setOpen] = useState(false);
  const first = useRef<HTMLInputElement>(null);
  const escape = useRef(() => {});
  escape.current = () => !sending && onClose();

  useEffect(() => {
    // Next frame, so the backdrop's opacity transition runs.
    const id = requestAnimationFrame(() => setOpen(true));
    first.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && escape.current();
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!form.name.trim()) errs.name = ui.errors.name;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = ui.errors.email;
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setSending(true);
    setErrors({});
    try {
      const recaptchaToken = await getRecaptchaToken();
      const res = await fetch("/api/proposal-submit/", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          draft,
          contact: {
            name: form.name.trim(),
            email: form.email.trim(),
            company: form.company.trim() || undefined,
            phone: form.phone.trim() || undefined,
          },
          transcript,
          lang,
          recaptchaToken: recaptchaToken || undefined,
        }),
      });
      if (res.ok) {
        onSent(form.email.trim());
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (data.error === "name" || data.error === "email") setErrors({ [data.error]: ui.errors[data.error] });
      else if (data.error === "limit" || data.error === "bot" || data.error === "unavailable") setErrors({ submit: ui.errors[data.error] });
      else setErrors({ submit: ui.errors.generic });
    } catch {
      setErrors({ submit: ui.errors.generic });
    } finally {
      setSending(false);
    }
  }

  const input = (key: keyof typeof form, label: string, opts: { type?: string; placeholder?: string; required?: boolean; autoComplete?: string; max: number }) => {
    const err = key === "name" || key === "email" ? errors[key] : undefined;
    const id = `proposal-${key}`;
    return (
      <div className={`field${err ? " error" : ""}`}>
        <label htmlFor={id}>
          {label} {opts.required && <span className="req" aria-hidden="true">*</span>}
        </label>
        <input
          ref={key === "name" ? first : undefined}
          id={id}
          type={opts.type ?? "text"}
          placeholder={opts.placeholder}
          value={form[key]}
          maxLength={opts.max}
          autoComplete={opts.autoComplete}
          required={opts.required}
          aria-required={opts.required || undefined}
          aria-invalid={!!err}
          aria-describedby={err ? `${id}-error` : undefined}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        />
        {err && (
          <span className="err" id={`${id}-error`} role="alert">
            {err}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className={`modal-backdrop${open ? " open" : ""}`} onClick={() => !sending && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="proposal-send-title" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} disabled={sending} aria-label={d.keep}>
          <CloseIcon />
        </button>
        <form onSubmit={submit} noValidate className="modal-form">
          <div className="modal-scroll">
            <div className="modal-eyebrow eyebrow">{ui.panel.label}</div>
            <h2 id="proposal-send-title">{d.title}</h2>
            <p className="modal-sub">
              <span className="cs-dialog-title">{draft.title}.</span> {d.sub}
            </p>
            <div className="form-row">
              {input("name", d.name, { placeholder: d.namePh, required: true, autoComplete: "name", max: 120 })}
              {input("email", d.email, { type: "email", placeholder: d.emailPh, required: true, autoComplete: "email", max: 200 })}
            </div>
            <div className="form-row">
              {input("company", d.company, { placeholder: d.optional, autoComplete: "organization", max: 160 })}
              {input("phone", d.phone, { type: "tel", placeholder: d.optional, autoComplete: "tel", max: 40 })}
            </div>
            {errors.submit && (
              <div className="field error" style={{ marginTop: 4 }}>
                <span className="err" role="alert">
                  {errors.submit}
                </span>
              </div>
            )}
          </div>
          <div className="modal-foot">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={sending}>
              {d.keep}
            </button>
            <button type="submit" className="btn btn-primary" disabled={sending}>
              {sending ? d.sending : d.submit}
              <ArrowRight />
            </button>
            {hasRecaptcha && (
              <p className="modal-recaptcha-notice">
                {modalUi.recaptchaNoticeBefore}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
                  {modalUi.recaptchaPrivacyLink}
                </a>
                {modalUi.recaptchaNoticeBetween}
                <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">
                  {modalUi.recaptchaTermsLink}
                </a>
                {modalUi.recaptchaNoticeAfter}
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------- the studio ----------

export default function ContactStudio({ lang, ui, modalUi, email, homeHref, hasRecaptcha }: Props) {
  const transport = useMemo(
    () =>
      // Trailing slash matches vercel.json's `trailingSlash: true` (no 308 hop).
      new DefaultChatTransport({ api: "/api/proposal/", body: { lang } }),
    [lang],
  );
  const { messages, sendMessage, status, error, regenerate, setMessages, stop } = useChat({ transport });
  const [input, setInput] = useState("");
  const [engagement, setEngagement] = useState<Engagement | null>(null);
  const [showSend, setShowSend] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const top = useRef<HTMLDivElement>(null);

  const started = messages.length > 0;
  const busy = status === "submitted" || status === "streaming";
  const placeholder = useRotatingPlaceholder(ui.placeholders, !started && !input);
  const { draft, suggestions } = useMemo(() => latestDraft(messages), [messages]);
  const canSend = isDraftComplete(draft) && draft.completeness >= MIN_COMPLETENESS_TO_SEND && !busy;

  useBodyScrollLock(showSheet, { media: "(max-width: 1023px)" });

  const transcript = useMemo(
    () =>
      messages
        .map((m) => ({ role: m.role as "user" | "assistant", text: messageText(m).slice(0, 4000) }))
        .filter((t) => (t.role === "user" || t.role === "assistant") && t.text.trim())
        .slice(-60),
    [messages],
  );

  // Restore a conversation from this tab, once.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { lang?: string; messages?: UIMessage[] };
        if (saved.lang === lang && Array.isArray(saved.messages) && saved.messages.length) setMessages(saved.messages);
      }
    } catch {
      /* storage blocked or corrupt — start fresh */
    }
    setRestored(true);
  }, [lang, setMessages]);

  // Persist settled turns only (not every streamed token).
  useEffect(() => {
    if (!restored || busy) return;
    try {
      if (messages.length) sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ lang, messages }));
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* quota / private mode */
    }
  }, [messages, busy, lang, restored]);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    const prefix = !started && engagement ? `${ui.interestedIn}${ui.engagement[engagement]}.\n\n` : "";
    sendMessage({ text: prefix + t });
    setInput("");
    if (!started) top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function reset() {
    stop();
    setMessages([]);
    setSentTo(null);
    setEngagement(null);
    setInput("");
    setShowSheet(false);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  const last = messages[messages.length - 1];
  const waiting = status === "submitted" || (status === "streaming" && last?.role === "assistant" && !messageText(last));

  if (sentTo) {
    return (
      <div className="cs cs--sent" ref={top}>
        <div className="container">
          <div className="modal-success cs-sent">
            <div className="seal">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1>{ui.sent.title}</h1>
            <p>
              {ui.sent.bodyA} <strong>{sentTo}</strong>. {ui.sent.bodyB}
            </p>
            <div className="cs-sent-actions">
              <a className="btn btn-ghost" href={homeHref}>
                {ui.sent.home}
              </a>
              <button type="button" className="btn-link" onClick={reset}>
                {ui.sent.again} <ArrowRight />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="cs cs--intro" ref={top}>
        <div className="hero-bg" aria-hidden="true" />
        <div className="container cs-intro">
          <div className="eyebrow">{ui.eyebrow}</div>
          <h1 className="cs-headline">
            {ui.titleA} <span className="accent">{ui.titleAccent}</span>
          </h1>
          <p className="cs-sub">{ui.sub}</p>

          <Composer
            value={input}
            onChange={setInput}
            onSubmit={() => send(input)}
            busy={busy}
            placeholder={placeholder}
            label={ui.composerLabel}
            sendLabel={ui.send}
            stopLabel={ui.stop}
            large
          >
            {ENGAGEMENTS.map((key) => (
              <button
                key={key}
                type="button"
                className={`cs-chip${engagement === key ? " is-on" : ""}`}
                aria-pressed={engagement === key}
                onClick={() => setEngagement((e) => (e === key ? null : key))}
              >
                {ui.engagement[key]}
              </button>
            ))}
          </Composer>

          <p className="cs-trust">
            {ui.trust} {ui.aiNote}
          </p>
          <p className="cs-direct">
            {ui.direct} <a href={`mailto:${email}`}>{email}</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="cs cs--chat" ref={top}>
      <div className="container cs-chat">
        <section className="cs-thread-col" aria-label={ui.composerLabel}>
          <div className="cs-thread-head">
            <div className="eyebrow">{ui.eyebrow}</div>
            <button type="button" className="cs-text-btn" onClick={reset}>
              {ui.startOver}
            </button>
          </div>

          <div ref={scroller} className="cs-thread" aria-live="polite">
            {messages.map((m) => {
              const text = messageText(m);
              if (!text) return null;
              return m.role === "user" ? (
                <div key={m.id} className="cs-msg cs-msg--user">
                  {text}
                </div>
              ) : (
                <div key={m.id} className="cs-msg cs-msg--bot">
                  <span className="cs-avatar" aria-hidden="true">
                    DP
                  </span>
                  <div className="cs-msg-body">
                    <TinyMarkdown>{text}</TinyMarkdown>
                  </div>
                </div>
              );
            })}

            {waiting && (
              <div className="cs-msg cs-msg--bot cs-waiting">
                <span className="cs-avatar" aria-hidden="true">
                  DP
                </span>
                <span className="cs-dots" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                <span className="cs-muted">{draft ? ui.updating : ui.thinking}</span>
              </div>
            )}

            {error && !busy && (
              <div role="alert" className="cs-error">
                {ui.error}
                <button type="button" className="cs-text-btn" onClick={() => regenerate()}>
                  {ui.retry}
                </button>
              </div>
            )}
          </div>

          <div className="cs-dock">
            {suggestions.length > 0 && !busy && (
              <div className="cs-suggestions">
                {suggestions.map((s) => (
                  <button key={s} type="button" className="cs-chip" onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
            <Composer
              value={input}
              onChange={setInput}
              onSubmit={() => send(input)}
              onStop={stop}
              busy={busy}
              placeholder={ui.replyPh}
              label={ui.composerLabel}
              sendLabel={ui.send}
              stopLabel={ui.stop}
              autoFocus
            >
              <button type="button" className="cs-chip cs-sheet-toggle" onClick={() => setShowSheet(true)}>
                {ui.panel.view} · {draft?.completeness ?? 0}%
              </button>
            </Composer>
          </div>
        </section>

        <aside className="cs-aside">
          <ProposalPanel ui={ui} draft={draft} canSend={canSend} onSend={() => setShowSend(true)} />
        </aside>
      </div>

      {showSheet && (
        <div className="cs-sheet-backdrop" onClick={() => setShowSheet(false)}>
          <div className="cs-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={ui.panel.label}>
            <ProposalPanel
              ui={ui}
              draft={draft}
              canSend={canSend}
              onClose={() => setShowSheet(false)}
              onSend={() => {
                setShowSheet(false);
                setShowSend(true);
              }}
            />
          </div>
        </div>
      )}

      {showSend && isDraftComplete(draft) && (
        <SendDialog
          ui={ui}
          modalUi={modalUi}
          lang={lang}
          draft={draft}
          transcript={transcript}
          hasRecaptcha={hasRecaptcha}
          onClose={() => setShowSend(false)}
          onSent={(addr) => {
            setShowSend(false);
            setSentTo(addr);
            // Clearing the thread also clears the saved copy (persist effect).
            setMessages([]);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}
    </div>
  );
}
