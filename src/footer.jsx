// Footer — rendered on every page (mounted by app.jsx, blog-nav-mount.jsx,
// or AssessmentApp). Detects /blog/ subpath via siteRootPrefix() so links
// resolve correctly when the page is one level down.
function Footer({ openModal }) {
  const { t, lang } = useI18n();
  const onHome = isHomePage();
  const root = siteRootPrefix();
  const homeBase = onHome ? "" : `${root}index.html`;
  const insightsHref = lang === "hr" ? `${root}blog-hr.html` : `${root}blog.html`;
  const legalSuffix = lang === "hr" ? "-hr.html" : ".html";

  // In-page anchor scroll only when we're on the home page; otherwise links
  // to "index.html#section" navigate normally.
  const handleNav = (e, anchor) => {
    if (!onHome) return;
    e.preventDefault();
    const el = document.querySelector(anchor);
    if (el) window.scrollTo({ top: el.offsetTop - 80, behavior: "smooth" });
  };

  const navLink = (anchor, label) => {
    const href = onHome ? anchor : `${homeBase}${anchor}`;
    return <li><a href={href} onClick={(e) => handleNav(e, anchor)}>{label}</a></li>;
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="brand" style={{ cursor: "default" }}>
              <Monogram />
              <div>
                <div className="brand-name">Danijel Pevec</div>
                <div className="brand-tag">{t.brand.tag}</div>
              </div>
            </div>
            <p>{t.footer.tagline}</p>
          </div>

          <div>
            <h4>{t.footer.navTitle}</h4>
            <ul>
              {navLink("#approach", t.nav.approach)}
              {navLink("#who", t.nav.who)}
              {navLink("#work", t.nav.work)}
              <li><a href={insightsHref}>{t.nav.blog}</a></li>
              <li><a href={`${root}assessment.html`}>{t.nav.assessment}</a></li>
              {navLink("#about", t.nav.about)}
            </ul>
          </div>

          <div>
            <h4>{t.footer.contactTitle}</h4>
            <ul>
              <li><a href={`mailto:${t.footer.email}`}>{t.footer.email}</a></li>
              <li>{t.footer.city}</li>
              {openModal && (
                <li style={{ marginTop: 8 }}>
                  <button className="btn-link" onClick={openModal}>
                    {t.nav.cta} <Icon.Arrow size={12} />
                  </button>
                </li>
              )}
            </ul>
          </div>

          <div>
            <h4>{t.footer.affTitle}</h4>
            <ul>
              <li><a href="https://www.alphacapitalis.com" target="_blank" rel="noopener noreferrer">Alpha Capitalis ↗</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span className="copy">{t.footer.copy}</span>
          <div className="legal">
            <a href={`${root}privacy${legalSuffix}`}>{t.footer.privacy}</a>
            <a href={`${root}imprint${legalSuffix}`}>{t.footer.imprint}</a>
            <a href={`${root}colophon${legalSuffix}`}>{t.footer.colophon}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

window.Footer = Footer;
