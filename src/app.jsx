// App entry
function App() {
  const [lang, setLang] = React.useState(() => localStorage.getItem("dp_lang") || "en");
  const [theme, setTheme] = React.useState(() => localStorage.getItem("dp_theme") || "dark");
  const [modalOpen, setModalOpen] = React.useState(false);

  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("dp_theme", theme);
  }, [theme]);

  React.useEffect(() => {
    document.documentElement.setAttribute("lang", lang);
    localStorage.setItem("dp_lang", lang);
  }, [lang]);

  const t = TRANSLATIONS[lang];
  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  // IntersectionObserver for reveal animations
  React.useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
      return;
    }
    const els = document.querySelectorAll('.reveal:not(.in)');
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [lang]);

  return (
    <I18nContext.Provider value={{ t, lang, setLang }}>
      <Nav theme={theme} setTheme={setTheme} openModal={openModal} />
      <main>
        <Hero openModal={openModal} />
        <WhoSection />
        <ChallengesSection />
        <AssessmentCtaSection />
        <ApproachSection />
        <WorkSection openModal={openModal} />
        <BlogSection />
        <AboutSection openModal={openModal} />
        <FinalCta openModal={openModal} />
      </main>
      <Footer openModal={openModal} />
      <ContactModal open={modalOpen} onClose={closeModal} />
    </I18nContext.Provider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
