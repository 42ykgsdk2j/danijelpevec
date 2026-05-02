// Mount the React Nav + Footer + ContactModal into #nav-root and #footer-root
// on every static page. The page sets <html lang="..."> in its head; we use
// that as initial language.
function BlogPageShell() {
  const initLang = document.documentElement.getAttribute("lang") || "en";
  const [lang, setLangState] = React.useState(initLang);
  const [theme, setThemeState] = React.useState(() => localStorage.getItem("dp_theme") || "dark");
  const [modalOpen, setModalOpen] = React.useState(false);

  const setTheme = (next) => {
    setThemeState(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("dp_theme", next);
  };

  // Language switching navigates to the page's EN/HR counterpart by toggling
  // the -hr suffix on the current filename. Works for blog index, article,
  // and legal stub pages alike (foo.html ↔ foo-hr.html).
  const setLang = (next) => {
    if (next === lang) return;
    localStorage.setItem("dp_lang", next);
    const path = window.location.pathname;
    const dir = path.substring(0, path.lastIndexOf("/") + 1);
    const filename = path.substring(path.lastIndexOf("/") + 1) || "index.html";
    const target = next === "hr"
      ? filename.replace(/(-hr)?\.html$/, "-hr.html")
      : filename.replace(/-hr\.html$/, ".html");
    window.location.href = dir + target;
  };

  const t = TRANSLATIONS[lang];
  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  const footerRoot = document.getElementById("footer-root");

  return (
    <I18nContext.Provider value={{ t, lang, setLang }}>
      <Nav theme={theme} setTheme={setTheme} openModal={openModal} />
      <ContactModal open={modalOpen} onClose={closeModal} />
      {footerRoot && ReactDOM.createPortal(<Footer openModal={openModal} />, footerRoot)}
    </I18nContext.Provider>
  );
}

(function () {
  var root = document.getElementById("nav-root");
  if (root) ReactDOM.createRoot(root).render(<BlogPageShell />);
})();
