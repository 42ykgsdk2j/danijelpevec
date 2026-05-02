// Brand mark + Nav
const Monogram = () => (
  <div className="brand-mono">DP</div>
);

function isHomePage() {
  if (typeof window === "undefined") return true;
  const p = window.location.pathname;
  return p === "/" || p === "" || /\/index\.html$/.test(p);
}

// Path prefix needed to reach the site root from the current page.
// "" for root pages, "../" for pages under /blog/.
function siteRootPrefix() {
  if (typeof window === "undefined") return "";
  return /\/blog\/[^/]+$/.test(window.location.pathname) ? "../" : "";
}

function Brand() {
  const { t } = useI18n();
  const href = isHomePage() ? "#top" : `${siteRootPrefix()}index.html`;
  return (
    <a href={href} className="brand" aria-label="Danijel Pevec">
      <Monogram />
      <div className="brand-text">
        <div className="brand-name">Danijel Pevec</div>
        <div className="brand-tag">{t.brand.tag}</div>
      </div>
    </a>
  );
}

function LangToggle() {
  const { lang, setLang } = useI18n();
  return (
    <div className="toggle-group" role="group" aria-label="Language">
      <button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button>
      <button className={lang === "hr" ? "active" : ""} onClick={() => setLang("hr")}>HR</button>
    </div>
  );
}

function ThemeToggle({ theme, setTheme }) {
  return (
    <button
      className="theme-toggle"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
      title={theme === "dark" ? "Switch to light" : "Switch to dark"}
    >
      {theme === "dark" ? <Icon.Sun /> : <Icon.Moon />}
    </button>
  );
}

function Nav({ theme, setTheme, openModal }) {
  const { t } = useI18n();
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  React.useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const onHome = isHomePage();
  const root = siteRootPrefix();
  const homeBase = onHome ? "" : `${root}index.html`;

  const insightsUrl = useI18n().lang === "hr"
    ? `${root}blog-hr.html`
    : `${root}blog.html`;

  const links = [
    { href: `${homeBase}#approach`, label: t.nav.approach },
    { href: `${homeBase}#who`, label: t.nav.who },
    { href: `${homeBase}#work`, label: t.nav.work },
    { href: insightsUrl, label: t.nav.blog },
    { href: `${root}assessment.html`, label: t.nav.assessment },
    { href: `${homeBase}#about`, label: t.nav.about },
  ];

  const handleNav = (e, href) => {
    // Only smooth-scroll for in-page anchors. Cross-page anchors (e.g.
    // "index.html#approach") and external URLs navigate normally.
    if (!href.startsWith("#")) {
      setDrawerOpen(false);
      return;
    }
    e.preventDefault();
    setDrawerOpen(false);
    const el = document.querySelector(href);
    if (el) window.scrollTo({ top: el.offsetTop - 80, behavior: "smooth" });
  };

  return (
    <React.Fragment>
      <nav className="nav scrolled">
        <div className="container nav-inner">
          <Brand />
          <div className="nav-links">
            {links.map(l => (
              <a key={l.href} href={l.href} className="nav-link" onClick={(e) => handleNav(e, l.href)}>
                <span>{l.label}</span>
              </a>
            ))}
          </div>
          <div className="nav-actions">
            <LangToggle />
            <ThemeToggle theme={theme} setTheme={setTheme} />
            <button className="btn btn-primary nav-cta" onClick={openModal}>
              {t.nav.cta}
            </button>
            <button className="menu-btn" onClick={() => setDrawerOpen(true)} aria-label="Menu">
              <Icon.Menu />
            </button>
          </div>
        </div>
      </nav>

      <div className={`scrim${drawerOpen ? " show" : ""}`} onClick={() => setDrawerOpen(false)} />
      <aside className={`mobile-drawer${drawerOpen ? " open" : ""}`}>
        <button
          className="theme-toggle"
          style={{ position: "absolute", top: 24, right: 24 }}
          onClick={() => setDrawerOpen(false)}
          aria-label="Close menu"
        >
          <Icon.Close />
        </button>
        {links.map(l => (
          <a key={l.href} href={l.href} className="nav-link" onClick={(e) => handleNav(e, l.href)}>
            <span>{l.label}</span>
          </a>
        ))}
        <div className="mobile-drawer-bottom">
          <button className="btn btn-primary" onClick={() => { setDrawerOpen(false); openModal(); }}>
            {t.nav.cta} <Icon.Arrow />
          </button>
        </div>
      </aside>
    </React.Fragment>
  );
}

window.Nav = Nav;
window.Monogram = Monogram;
