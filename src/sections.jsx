// Sections: Who, Challenges, Approach, Work
function WhoSection() {
  const { t } = useI18n();
  return (
    <section className="section-pad" id="who">
      <div className="container">
        <div className="two-col">
          <div className="col-left">
            <div className="section-head">
              <div className="eyebrow">{t.who.eyebrow}</div>
              <h2>{t.who.title} <span className="accent italic">{t.who.titleAccent}</span></h2>
              <p className="lead">{t.who.lead}</p>
            </div>
          </div>
          <div>
            <div className="who-list">
              {t.who.items.map((item, i) => (
                <div className="who-item" key={i}>
                  <span className="num">0{i + 1}.</span>
                  <span className="label">{item}</span>
                  <span className="icon"><Icon.Arrow size={18} /></span>
                </div>
              ))}
            </div>
            <div className="disclaimer">
              <p>{t.who.disclaimer}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ChallengesSection() {
  const { t } = useI18n();
  return (
    <section className="challenges-section section-pad">
      <div className="container">
        <div className="section-head" style={{ textAlign: "center", maxWidth: "920px", margin: "0 auto 80px", justifyItems: "center" }}>
          <div className="eyebrow">{t.challenges.eyebrow}</div>
          <h2>{t.challenges.title} <span className="accent italic">{t.challenges.titleAccent}</span></h2>
          <p className="lead" style={{ maxWidth: "60ch", margin: "0 auto" }}>{t.challenges.lead}</p>
        </div>

        <div className="challenge-grid">
          {t.challenges.items.map((item, i) => (
            <div className="challenge-card" key={i}>
              <span className="ord">{item.ord}</span>
              <h3>{item.text}</h3>
            </div>
          ))}
        </div>

        <p style={{
          marginTop: "72px",
          textAlign: "center",
          fontFamily: "var(--serif)",
          fontStyle: "italic",
          fontSize: "clamp(20px, 1.8vw, 26px)",
          color: "var(--gold)",
          lineHeight: 1.4,
          maxWidth: "30ch",
          marginLeft: "auto",
          marginRight: "auto",
        }}>
          {t.challenges.coda}
        </p>
      </div>
    </section>
  );
}

function ApproachSection() {
  const { t } = useI18n();
  return (
    <section className="section-pad" id="approach">
      <div className="container">
        <div className="two-col">
          <div className="col-left">
            <div className="eyebrow" style={{ marginBottom: 32 }}>{t.approach.eyebrow}</div>
            <div className="approach-quote">
              {t.approach.quoteA} <span className="accent">{t.approach.quoteAccent}</span> {t.approach.quoteB}
            </div>
          </div>
          <div>
            <p className="lead" style={{ marginBottom: 8 }}>{t.approach.lead}</p>
            <div className="approach-list">
              {t.approach.items.map((item, i) => (
                <div className="approach-list-item" key={i}>
                  <span className="marker">— {String.fromCharCode(8544 + i)}.</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <p className="approach-coda">{t.approach.coda}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function WorkSection({ openModal }) {
  const { t } = useI18n();
  return (
    <section className="howwework-section section-pad" id="work">
      <div className="container">
        <div className="section-head" style={{ maxWidth: "780px" }}>
          <div className="eyebrow">{t.work.eyebrow}</div>
          <h2>{t.work.title} <span className="accent italic">{t.work.titleAccent}</span></h2>
          <p className="lead">{t.work.lead}</p>
        </div>

        <div className="services-grid">
          {t.work.services.map((s, i) => (
            <div className="service-card" key={i}>
              <span className="num">{s.num}</span>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
              <span className="glyph">
                {i === 0 ? <Icon.Compass /> : i === 1 ? <Icon.Tree /> : <Icon.Hourglass />}
              </span>
            </div>
          ))}
        </div>

        <div className="start-cta">
          <div className="start-cta-text">
            {t.work.ctaText} <span className="accent">{t.work.ctaAccent}</span>
          </div>
          <button className="btn btn-primary" onClick={openModal}>
            {t.work.ctaBtn} <Icon.Arrow />
          </button>
        </div>
      </div>
    </section>
  );
}

window.WhoSection = WhoSection;
window.ChallengesSection = ChallengesSection;
window.ApproachSection = ApproachSection;
window.WorkSection = WorkSection;
