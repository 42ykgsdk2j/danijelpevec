// Mount the React Nav + ContactModal into #nav-root on the static blog pages.
// The blog page sets <html lang="..."> in its head; we use that as initial language.
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

  // Language switching on blog pages navigates between blog.html / blog-hr.html
  // so the page content (which is server-rendered HTML) matches the chosen lang.
  const setLang = (next) => {
    if (next === lang) return;
    localStorage.setItem("dp_lang", next);
    window.location.href = next === "hr" ? "blog-hr.html" : "blog.html";
  };

  const t = TRANSLATIONS[lang];
  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  return (
    <I18nContext.Provider value={{ t, lang, setLang }}>
      <Nav theme={theme} setTheme={setTheme} openModal={openModal} />
      <ContactModal open={modalOpen} onClose={closeModal} />
    </I18nContext.Provider>
  );
}

(function () {
  var root = document.getElementById("nav-root");
  if (root) ReactDOM.createRoot(root).render(<BlogPageShell />);
})();
