// Hero section
function Hero({ openModal }) {
  const { t } = useI18n();
  return (
    <section className="hero" id="top">
      <div className="hero-bg"></div>
      <div className="container">
        <div className="hero-eyebrow-row">
          <div className="hero-meta">
            <span>{t.hero.meta1}</span>
            <span className="dot"></span>
            <span>{t.hero.meta2}</span>
            <span className="dot"></span>
            <span>{t.hero.meta3}</span>
          </div>
          <div className="hero-meta">
            <span style={{ fontFamily: "var(--serif)", fontStyle: "italic", textTransform: "none", letterSpacing: 0, fontSize: 14, color: "var(--ink-2)" }}>
              MMXXVI
            </span>
          </div>
        </div>

        <h1 className="hero-headline reveal in">
          <span className="br">{t.hero.headlineA}</span>
          <span className="br">{t.hero.headlineB}</span>
          <span className="br accent">{t.hero.headlineC}</span>
          <span className="br">{t.hero.headlineD}</span>
        </h1>

        <div className="hero-sub-row">
          <p className="hero-sub">{t.hero.sub}</p>
          <div className="hero-cta-block">
            <span className="small">— {t.hero.ctaSmall}</span>
            <button className="btn btn-primary" onClick={openModal}>
              {t.hero.cta} <Icon.Arrow />
            </button>
          </div>
        </div>

        <div className="hero-marquee">
          <div className="item"><span className="num">{t.hero.m1Num}</span>{t.hero.m1}</div>
          <div className="item"><span className="num">{t.hero.m2Num}</span>{t.hero.m2}</div>
          <div className="item"><span className="num">{t.hero.m3Num}</span>{t.hero.m3}</div>
        </div>
      </div>
    </section>
  );
}

window.Hero = Hero;
