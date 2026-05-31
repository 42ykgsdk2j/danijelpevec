/**
 * Contact modal — React island.
 *
 * Listens for `dp:open-modal` custom events dispatched by buttons elsewhere in
 * the page (the Astro Nav, Footer, and final CTA buttons all have a tiny
 * inline `addEventListener("click")` that dispatches this event). That avoids
 * having to make every "Private conversation" button a React island too.
 *
 * Accessibility:
 *   - role="dialog" + aria-modal + aria-labelledby on the modal container.
 *   - Esc + click-outside dismiss.
 *   - Tab/Shift+Tab focus trap inside the modal while open.
 *   - Focus moves to the first form field on open; returns to the trigger
 *     element on close.
 *   - Each label is htmlFor-linked to its input id; required inputs carry
 *     `required` + `aria-required`; inputs with errors carry `aria-invalid`
 *     and `aria-describedby` pointing at the inline error span (role="alert").
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useBodyScrollLock } from "../lib/useBodyScrollLock";

type T = {
  eyebrow: string;
  titleA: string;
  titleAccent: string;
  sub: string;
  name: string;
  namePh: string;
  role: string;
  rolePh: string;
  company: string;
  companyPh: string;
  email: string;
  emailPh: string;
  stage: string;
  stages: string[];
  message: string;
  messagePh: string;
  submit: string;
  successTitle: string;
  successAccent: string;
  successSub: string;
  close: string;
  err: { name: string; email: string; message: string; submit: string };
};

interface Props {
  t: T;
  lang: "hr" | "en";
}

interface FormState {
  name: string;
  role: string;
  company: string;
  email: string;
  stage: string;
  message: string;
}

const initial: FormState = { name: "", role: "", company: "", email: "", stage: "", message: "" };

export default function Modal({ t, lang }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  // Element that had focus when the modal opened — we return focus there on close.
  const triggerRef = useRef<Element | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      // Prefer the trigger button passed via event detail (set by
      // Modal.astro's click handler). Falls back to document.activeElement
      // for any caller that dispatches the event without a trigger.
      // Safari doesn't focus buttons on click, so activeElement is often
      // document.body — the detail.trigger path is what makes focus return
      // work reliably across browsers.
      const detail = (e as CustomEvent).detail;
      triggerRef.current =
        (detail && (detail.trigger as Element)) || document.activeElement;
      setOpen(true);
    };
    window.addEventListener("dp:open-modal", handler);
    return () => window.removeEventListener("dp:open-modal", handler);
  }, []);

  useEffect(() => {
    if (open) {
      setSubmitted(false);
      setErrors({});
      setTimeout(() => firstFieldRef.current?.focus(), 50);
    }
  }, [open]);

  // Body scroll lock — mobile only. Uses the shared reference-counted
  // hook so opening this modal while the Chat panel is also open
  // doesn't strand the body in `position: fixed`.
  useBodyScrollLock(open);

  // `modal-open` class toggle is kept for the desktop overflow: hidden
  // fallback (CSS rule in styles.css). The shared hook handles the
  // mobile position-fixed pattern.
  useEffect(() => {
    document.body.classList.toggle("modal-open", open);
    return () => document.body.classList.remove("modal-open");
  }, [open]);

  // Keyboard handling while the modal is open: Esc closes; Tab/Shift+Tab is
  // trapped inside the modal.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key !== "Tab" || !modalRef.current) return;
      const focusables = modalRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm({ ...form, [key]: value });
    if (errors[key as string]) setErrors({ ...errors, [key as string]: null });
  }

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = t.err.name;
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t.err.email;
    if (!form.message.trim()) e.message = t.err.message;
    return e;
  }

  // Drives the submit button's enabled state — the button stays disabled
  // until name, a valid email, and a non-empty message are all present.
  // Re-runs only when the inputs that gate validity change.
  const isFormValid = useMemo(
    () =>
      form.name.trim().length > 0 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) &&
      form.message.trim().length > 0,
    [form.name, form.email, form.message],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    setErrors({});
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          name: form.name,
          role: form.role,
          company: form.company,
          email: form.email,
          stage: form.stage,
          message: form.message,
          lang,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setErrors({ submit: (data && data.error) || t.err.submit });
      }
    } catch {
      setErrors({ submit: t.err.submit });
    } finally {
      setSubmitting(false);
    }
  }

  function close() {
    setForm(initial);
    setErrors({});
    setSubmitted(false);
    setOpen(false);
    // Return focus to whatever opened the modal so keyboard users don't lose
    // their place. setTimeout because the modal is still in the DOM at this
    // point and would steal focus back.
    setTimeout(() => {
      const t = triggerRef.current as HTMLElement | null;
      if (t && typeof t.focus === "function") t.focus();
    }, 50);
  }

  return (
    <div className={`modal-backdrop${open ? " open" : ""}`} onClick={close}>
      <div
        ref={modalRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={close} aria-label={t.close}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {!submitted ? (
          <form onSubmit={onSubmit} noValidate className="modal-form">
            <div className="modal-scroll">
              <div className="modal-eyebrow eyebrow">{t.eyebrow}</div>
              <h2 id="modal-title">{t.titleA} {t.titleAccent}</h2>
              <p className="modal-sub">{t.sub}</p>

              <div className="form-row">
                <div className={`field${errors.name ? " error" : ""}`}>
                  <label htmlFor="contact-name">{t.name} <span className="req" aria-hidden="true">*</span></label>
                  <input
                    ref={firstFieldRef}
                    id="contact-name"
                    name="name"
                    type="text"
                    placeholder={t.namePh}
                    value={form.name}
                    required
                    aria-required="true"
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "contact-name-error" : undefined}
                    onChange={(e) => update("name", e.target.value)}
                  />
                  {errors.name && <span className="err" id="contact-name-error" role="alert">{errors.name}</span>}
                </div>
                <div className="field">
                  <label htmlFor="contact-role">{t.role}</label>
                  <input
                    id="contact-role"
                    name="role"
                    type="text"
                    placeholder={t.rolePh}
                    value={form.role}
                    onChange={(e) => update("role", e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className={`field${errors.email ? " error" : ""}`}>
                  <label htmlFor="contact-email">{t.email} <span className="req" aria-hidden="true">*</span></label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    placeholder={t.emailPh}
                    value={form.email}
                    required
                    aria-required="true"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "contact-email-error" : undefined}
                    onChange={(e) => update("email", e.target.value)}
                  />
                  {errors.email && <span className="err" id="contact-email-error" role="alert">{errors.email}</span>}
                </div>
                <div className="field">
                  <label htmlFor="contact-company">{t.company}</label>
                  <input
                    id="contact-company"
                    name="company"
                    type="text"
                    placeholder={t.companyPh}
                    value={form.company}
                    onChange={(e) => update("company", e.target.value)}
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="contact-stage">{t.stage}</label>
                <select
                  id="contact-stage"
                  name="stage"
                  value={form.stage}
                  onChange={(e) => update("stage", e.target.value)}
                  style={{ background: "var(--bg-1)" }}
                >
                  <option value="">—</option>
                  {t.stages.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className={`field${errors.message ? " error" : ""}`}>
                <label htmlFor="contact-message">{t.message} <span className="req" aria-hidden="true">*</span></label>
                <textarea
                  id="contact-message"
                  name="message"
                  placeholder={t.messagePh}
                  value={form.message}
                  required
                  aria-required="true"
                  aria-invalid={!!errors.message}
                  aria-describedby={errors.message ? "contact-message-error" : undefined}
                  onChange={(e) => update("message", e.target.value)}
                  rows={4}
                />
                {errors.message && <span className="err" id="contact-message-error" role="alert">{errors.message}</span>}
              </div>

              {errors.submit && (
                <div className="field error" style={{ marginTop: 4 }}>
                  <span className="err" role="alert">{errors.submit}</span>
                </div>
              )}
            </div>

            <div className="modal-foot">
              <button type="submit" className="btn btn-primary" disabled={submitting || !isFormValid}>
                {submitting ? "…" : t.submit}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          </form>
        ) : (
          <div className="modal-success">
            <div className="seal">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 id="modal-title">{t.successTitle}{t.successAccent}</h2>
            <p>{t.successSub}</p>
            <button className="btn btn-ghost" onClick={close}>{t.close}</button>
          </div>
        )}
      </div>
    </div>
  );
}
