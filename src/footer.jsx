// Footer
function Footer({ openModal }) {
  const { t } = useI18n();
  const handleNav = (e, href) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) window.scrollTo({ top: el.offsetTop - 80, behavior: "smooth" });
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
              <li><a href="#approach" onClick={(e) => handleNav(e, "#approach")}>{t.nav.approach}</a></li>
              <li><a href="#who" onClick={(e) => handleNav(e, "#who")}>{t.nav.who}</a></li>
              <li><a href="#work" onClick={(e) => handleNav(e, "#work")}>{t.nav.work}</a></li>
              <li><a href="blog.html">{t.nav.blog}</a></li>
              <li><a href="assessment.html">{t.nav.assessment}</a></li>
              <li><a href="#about" onClick={(e) => handleNav(e, "#about")}>{t.nav.about}</a></li>
            </ul>
          </div>

          <div>
            <h4>{t.footer.contactTitle}</h4>
            <ul>
              <li><a href={`mailto:${t.footer.email}`}>{t.footer.email}</a></li>
              <li>{t.footer.city}</li>
              <li style={{ marginTop: 8 }}>
                <button className="btn-link" onClick={openModal}>
                  {t.nav.cta} <Icon.Arrow size={12} />
                </button>
              </li>
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
            <a href="#">{t.footer.privacy}</a>
            <a href="#">{t.footer.imprint}</a>
            <a href="#">{t.footer.colophon}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

window.Footer = Footer;
