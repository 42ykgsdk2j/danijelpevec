// Sections: Who, Challenges, Approach, Work
function WhoSection() {
  const { t } = useI18n();
  return (
    <section className="section-pad" id="who">
      <div className="container">
        <div className="two-col">
          <div className="col-left">
            <div className="section-head reveal">
              <div className="eyebrow">{t.who.eyebrow}</div>
              <h2>{t.who.title} <span className="accent italic">{t.who.titleAccent}</span></h2>
              <p className="lead">{t.who.lead}</p>
            </div>
          </div>
          <div>
            <div className="who-list reveal-stagger">
              {t.who.items.map((item, i) => (
                <div className="who-item reveal" key={i}>
                  <span className="num">0{i + 1}.</span>
                  <span className="label">{item}</span>
                </div>
              ))}
            </div>
            <div className="disclaimer reveal">
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
        <div className="section-head reveal" style={{ textAlign: "center", maxWidth: "920px", margin: "0 auto 80px", justifyItems: "center" }}>
          <div className="eyebrow">{t.challenges.eyebrow}</div>
          <h2>{t.challenges.title} <span className="accent italic">{t.challenges.titleAccent}</span></h2>
          <p className="lead" style={{ maxWidth: "60ch", margin: "0 auto" }}>{t.challenges.lead}</p>
        </div>

        <div className="challenge-grid reveal-stagger">
          {t.challenges.items.map((item, i) => (
            <div className="challenge-card reveal" key={i}>
              <span className="ord">{item.ord}</span>
              <h3>{item.text}</h3>
            </div>
          ))}
        </div>

        <p className="reveal" style={{
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
            <div className="reveal">
              <div className="eyebrow" style={{ marginBottom: 32 }}>{t.approach.eyebrow}</div>
              <div className="approach-quote">
                {t.approach.quoteA} <span className="accent">{t.approach.quoteAccent}</span> {t.approach.quoteB}
              </div>
            </div>
          </div>
          <div className="reveal">
            <p className="lead" style={{ marginBottom: 8 }}>{t.approach.lead}</p>
            <div className="approach-list reveal-stagger">
              {t.approach.items.map((item, i) => (
                <div className="approach-list-item reveal" key={i}>
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
        <div className="section-head reveal" style={{ maxWidth: "780px" }}>
          <div className="eyebrow">{t.work.eyebrow}</div>
          <h2>{t.work.title} <span className="accent italic">{t.work.titleAccent}</span></h2>
          <p className="lead">{t.work.lead}</p>
        </div>

        <div className="services-grid reveal-stagger">
          {t.work.services.map((s, i) => (
            <div className="service-card reveal" key={i}>
              <span className="num">{s.num}</span>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
              <span className="glyph">
                {i === 0 ? <Icon.Compass /> : i === 1 ? <Icon.Tree /> : <Icon.Hourglass />}
              </span>
            </div>
          ))}
        </div>

        <div className="start-cta reveal">
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

function AssessmentCtaSection() {
  const { t } = useI18n();
  return (
    <section className="assessment-cta-section section-pad">
      <div className="container">
        <div className="assessment-cta-box reveal">
          <div className="eyebrow">{t.assessmentCta.eyebrow}</div>
          <h2>
            {t.assessmentCta.title} <span className="accent italic">{t.assessmentCta.titleAccent}</span>
          </h2>
          <p className="lead">{t.assessmentCta.lead}</p>
          <a className="btn btn-primary" href="assessment.html">
            {t.assessmentCta.btn} <Icon.Arrow />
          </a>
          <p className="assessment-cta-note">{t.assessmentCta.note}</p>
        </div>
      </div>
    </section>
  );
}

window.WhoSection = WhoSection;
window.ChallengesSection = ChallengesSection;
window.ApproachSection = ApproachSection;
window.WorkSection = WorkSection;
window.AssessmentCtaSection = AssessmentCtaSection;
