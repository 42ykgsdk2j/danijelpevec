/**
 * Contact modal — React island.
 *
 * Listens for `dp:open-modal` custom events dispatched by buttons elsewhere in
 * the page (the Astro Nav, Footer, and final CTA buttons all have a tiny
 * inline `addEventListener("click")` that dispatches this event). That avoids
 * having to make every "Private conversation" button a React island too.
 */
import { useEffect, useRef, useState } from "react";

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
  consent: string;
  submit: string;
  note: string;
  successTitle: string;
  successAccent: string;
  successSub: string;
  close: string;
  err: { name: string; email: string; message: string; consent: string; submit: string };
};

interface Props {
  t: T;
}

interface FormState {
  name: string;
  role: string;
  company: string;
  email: string;
  stage: string;
  message: string;
  consent: boolean;
}

const initial: FormState = { name: "", role: "", company: "", email: "", stage: "", message: "", consent: false };

export default function Modal({ t }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("dp:open-modal", handler);
    return () => window.removeEventListener("dp:open-modal", handler);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("modal-open", open);
    if (open) {
      setSubmitted(false);
      setErrors({});
      setTimeout(() => firstFieldRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm({ ...form, [key]: value });
    if (errors[key as string]) setErrors({ ...errors, [key as string]: null });
  }

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = t.err.name;
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t.err.email;
    if (!form.message.trim() || form.message.trim().length < 10) e.message = t.err.message;
    if (!form.consent) e.consent = t.err.consent;
    return e;
  }

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
      const res = await fetch("https://formspree.io/f/mykoyaap", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          name: form.name,
          role: form.role,
          company: form.company,
          email: form.email,
          stage: form.stage,
          message: form.message,
          consent: form.consent ? "Yes" : "No",
          _subject: `Private conversation request from ${form.name}`,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json().catch(() => ({}));
        const apiMsg = data && data.errors && data.errors[0] && data.errors[0].message;
        setErrors({ submit: apiMsg || t.err.submit });
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
  }

  return (
    <div className={`modal-backdrop${open ? " open" : ""}`} onClick={close}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={close} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {!submitted ? (
          <>
            <div className="modal-eyebrow eyebrow">{t.eyebrow}</div>
            <h2>{t.titleA} <span className="accent">{t.titleAccent}</span></h2>
            <p className="modal-sub">{t.sub}</p>

            <form onSubmit={onSubmit} noValidate>
              <div className="form-row">
                <div className={`field${errors.name ? " error" : ""}`}>
                  <label>{t.name} <span className="req">*</span></label>
                  <input ref={firstFieldRef} type="text" placeholder={t.namePh} value={form.name}
                    onChange={(e) => update("name", e.target.value)} />
                  {errors.name && <span className="err">{errors.name}</span>}
                </div>
                <div className="field">
                  <label>{t.role}</label>
                  <input type="text" placeholder={t.rolePh} value={form.role}
                    onChange={(e) => update("role", e.target.value)} />
                </div>
              </div>

              <div className="form-row">
                <div className={`field${errors.email ? " error" : ""}`}>
                  <label>{t.email} <span className="req">*</span></label>
                  <input type="email" placeholder={t.emailPh} value={form.email}
                    onChange={(e) => update("email", e.target.value)} />
                  {errors.email && <span className="err">{errors.email}</span>}
                </div>
                <div className="field">
                  <label>{t.company}</label>
                  <input type="text" placeholder={t.companyPh} value={form.company}
                    onChange={(e) => update("company", e.target.value)} />
                </div>
              </div>

              <div className="field">
                <label>{t.stage}</label>
                <select value={form.stage} onChange={(e) => update("stage", e.target.value)} style={{ background: "var(--bg-1)" }}>
                  <option value="">—</option>
                  {t.stages.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className={`field${errors.message ? " error" : ""}`}>
                <label>{t.message} <span className="req">*</span></label>
                <textarea placeholder={t.messagePh} value={form.message}
                  onChange={(e) => update("message", e.target.value)} rows={4} />
                {errors.message && <span className="err">{errors.message}</span>}
              </div>

              <div className={`field${errors.consent ? " error" : ""}`} style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                <input type="checkbox" id="consent" checked={form.consent}
                  onChange={(e) => update("consent", e.target.checked)}
                  style={{ width: "auto", accentColor: "var(--gold)", marginTop: 4 }} />
                <label htmlFor="consent" style={{ letterSpacing: 0, textTransform: "none", fontSize: 13, color: "var(--ink-2)", fontWeight: 400, lineHeight: 1.5, cursor: "pointer" }}>
                  {t.consent}
                  {errors.consent && <span className="err" style={{ display: "block", marginTop: 4 }}>{errors.consent}</span>}
                </label>
              </div>

              {errors.submit && (
                <div className="field error" style={{ marginTop: 4 }}>
                  <span className="err" role="alert">{errors.submit}</span>
                </div>
              )}

              <div className="modal-foot">
                <span className="note">{t.note}</span>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "…" : t.submit}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="modal-success">
            <div className="seal">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2>{t.successTitle}<span className="accent italic">{t.successAccent}</span></h2>
            <p>{t.successSub}</p>
            <button className="btn btn-ghost" onClick={close}>{t.close}</button>
          </div>
        )}
      </div>
    </div>
  );
}
