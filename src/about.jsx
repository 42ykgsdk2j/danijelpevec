// About + Final CTA
function AboutSection({ openModal }) {
  const { t } = useI18n();
  return (
    <section className="about-section section-pad" id="about">
      <div className="container">
        <div className="section-head" style={{ maxWidth: "640px", marginBottom: 64 }}>
          <div className="eyebrow">{t.about.eyebrow}</div>
        </div>

        <div className="about-grid">
          <div className="about-card">
            <div className="about-portrait">
              <div className="mono">DP</div>
            </div>
            <div>
              <div className="role">{t.about.role}</div>
              <div className="name" style={{ marginTop: 6 }}>{t.about.name}</div>
            </div>
            <div className="meta-list">
              {t.about.meta.map((m, i) => (
                <div className="row" key={i}>
                  <span className="lbl">{m.lbl}</span>
                  <span className="val">{m.val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="about-text">
            <p className="lead">{t.about.lead}</p>
            <p>{t.about.p1}</p>
            <p>{t.about.p2}</p>
            <p className="pull">{t.about.pull}</p>
            <p>{t.about.p3}</p>
            <p>{t.about.p4}</p>
            <p style={{
              fontFamily: "var(--serif)",
              fontStyle: "italic",
              fontSize: "clamp(18px, 1.5vw, 22px)",
              color: "var(--ink-0)",
              lineHeight: 1.4,
              marginTop: 16,
            }}>
              {t.about.closing}
            </p>

            <div className="alpha-block">
              <div className="alpha-logo"></div>
              <div className="alpha-text">
                <span className="alpha-name">{t.about.alphaName}</span>
                <span className="alpha-desc">{t.about.alphaDesc}</span>
              </div>
              <a href="https://www.alphacapitalis.com" target="_blank" rel="noopener noreferrer" className="alpha-link">
                {t.about.alphaLink} <Icon.ArrowDiag />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCta({ openModal }) {
  const { t } = useI18n();
  return (
    <section className="final-cta">
      <div className="container final-cta-content">
        <div className="eyebrow" style={{ justifyContent: "center", marginBottom: 28 }}>{t.final.eyebrow}</div>
        <h2>
          {t.final.titleA} <span className="accent">{t.final.titleB}</span>{t.final.titleC} <span className="accent">{t.final.titleAccent}</span>
        </h2>
        <p>{t.final.sub}</p>
        <button className="btn btn-primary" onClick={openModal}>
          {t.final.cta} <Icon.Arrow />
        </button>
      </div>
    </section>
  );
}

window.AboutSection = AboutSection;
window.FinalCta = FinalCta;
