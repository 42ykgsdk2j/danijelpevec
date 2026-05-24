// Contact modal with form, validation, and success state
function ContactModal({ open, onClose }) {
  const { t } = useI18n();
  const [form, setForm] = React.useState({
    name: "", role: "", company: "", email: "", stage: "", message: "", consent: false,
  });
  const [errors, setErrors] = React.useState({});
  const [submitted, setSubmitted] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    document.body.classList.toggle("modal-open", open);
    if (open) {
      setSubmitted(false);
      setErrors({});
    }
  }, [open]);

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && open) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const update = (k, v) => {
    setForm({ ...form, [k]: v });
    if (errors[k]) setErrors({ ...errors, [k]: null });
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = t.modal.err.name;
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t.modal.err.email;
    if (!form.message.trim() || form.message.trim().length < 10) e.message = t.modal.err.message;
    if (!form.consent) e.consent = t.modal.err.consent;
    return e;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
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
        setErrors({ submit: apiMsg || t.modal.err.submit });
      }
    } catch (err) {
      setErrors({ submit: t.modal.err.submit });
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setForm({ name: "", role: "", company: "", email: "", stage: "", message: "", consent: false });
    setErrors({});
    setSubmitted(false);
    onClose();
  };

  return (
    <div className={`modal-backdrop${open ? " open" : ""}`} onClick={reset}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={reset} aria-label="Close">
          <Icon.Close />
        </button>

        {!submitted ? (
          <React.Fragment>
            <div className="modal-eyebrow eyebrow">{t.modal.eyebrow}</div>
            <h2>{t.modal.titleA} <span className="accent">{t.modal.titleAccent}</span></h2>
            <p className="modal-sub">{t.modal.sub}</p>

            <form onSubmit={onSubmit} noValidate>
              <div className="form-row">
                <div className={`field${errors.name ? " error" : ""}`}>
                  <label>{t.modal.name} <span className="req">*</span></label>
                  <input type="text" placeholder={t.modal.namePh} value={form.name}
                    onChange={(e) => update("name", e.target.value)} />
                  {errors.name && <span className="err">{errors.name}</span>}
                </div>
                <div className="field">
                  <label>{t.modal.role}</label>
                  <input type="text" placeholder={t.modal.rolePh} value={form.role}
                    onChange={(e) => update("role", e.target.value)} />
                </div>
              </div>

              <div className="form-row">
                <div className={`field${errors.email ? " error" : ""}`}>
                  <label>{t.modal.email} <span className="req">*</span></label>
                  <input type="email" placeholder={t.modal.emailPh} value={form.email}
                    onChange={(e) => update("email", e.target.value)} />
                  {errors.email && <span className="err">{errors.email}</span>}
                </div>
                <div className="field">
                  <label>{t.modal.company}</label>
                  <input type="text" placeholder={t.modal.companyPh} value={form.company}
                    onChange={(e) => update("company", e.target.value)} />
                </div>
              </div>

              <div className="field">
                <label>{t.modal.stage}</label>
                <select value={form.stage} onChange={(e) => update("stage", e.target.value)}
                  style={{ background: "var(--bg-1)" }}>
                  <option value="">—</option>
                  {t.modal.stages.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className={`field${errors.message ? " error" : ""}`}>
                <label>{t.modal.message} <span className="req">*</span></label>
                <textarea placeholder={t.modal.messagePh} value={form.message}
                  onChange={(e) => update("message", e.target.value)} rows={4} />
                {errors.message && <span className="err">{errors.message}</span>}
              </div>

              <div className={`field${errors.consent ? " error" : ""}`} style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                <input type="checkbox" id="consent" checked={form.consent}
                  onChange={(e) => update("consent", e.target.checked)}
                  style={{ width: "auto", accentColor: "var(--gold)", marginTop: 4 }} />
                <label htmlFor="consent" style={{ letterSpacing: 0, textTransform: "none", fontSize: 13, color: "var(--ink-2)", fontWeight: 400, lineHeight: 1.5, cursor: "pointer" }}>
                  {t.modal.consent}
                  {errors.consent && <span className="err" style={{ display: "block", marginTop: 4 }}>{errors.consent}</span>}
                </label>
              </div>

              {errors.submit && (
                <div className="field error" style={{ marginTop: 4 }}>
                  <span className="err" role="alert">{errors.submit}</span>
                </div>
              )}

              <div className="modal-foot">
                <span className="note">{t.modal.note}</span>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "…" : t.modal.submit} <Icon.Arrow />
                </button>
              </div>
            </form>
          </React.Fragment>
        ) : (
          <div className="modal-success">
            <div className="seal">
              <Icon.Check size={36} />
            </div>
            <h2>{t.modal.successTitle}<span className="accent italic">{t.modal.successAccent}</span></h2>
            <p>{t.modal.successSub}</p>
            <button className="btn btn-ghost" onClick={reset}>
              {t.modal.close}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

window.ContactModal = ContactModal;
