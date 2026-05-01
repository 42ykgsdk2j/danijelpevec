// Brand mark + Nav
const Monogram = ({ size = 42 }) => (
  <div className="brand-mono" style={{ width: size, height: size, fontSize: size * 0.4 }}>
    DP
  </div>
);

function Brand() {
  const { t } = useI18n();
  return (
    <a href="#top" className="brand" aria-label="Danijel Pevec">
      <Monogram />
      <div>
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
  const [scrolled, setScrolled] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const links = [
    { href: "#approach", label: t.nav.approach },
    { href: "#who", label: t.nav.who },
    { href: "#work", label: t.nav.work },
    { href: "#about", label: t.nav.about },
  ];

  const handleNav = (e, href) => {
    e.preventDefault();
    setDrawerOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView ? window.scrollTo({ top: el.offsetTop - 80, behavior: "smooth" }) : null;
  };

  return (
    <React.Fragment>
      <nav className={`nav${scrolled ? " scrolled" : ""}`}>
        <div className="container nav-inner">
          <Brand />
          <div className="nav-links">
            {links.map(l => (
              <a key={l.href} href={l.href} className="nav-link" onClick={(e) => handleNav(e, l.href)}>
                {l.label}
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
            {l.label}
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
