// Family Business Readiness Assessment — React app.
// Three states: 'intro' → 'questions' → 'results'.
// State persists in React only (intentionally not localStorage — the
// assessment is meant to be a one-sitting reflection and the brand emphasises
// privacy: nothing leaves the browser tab.)

function AssessmentApp() {
  const [lang, setLang] = React.useState(() => localStorage.getItem("dp_lang") || "en");
  const [theme, setTheme] = React.useState(() => localStorage.getItem("dp_theme") || "dark");
  const [step, setStep] = React.useState("intro"); // intro | questions | analyzing | results
  const [currentQ, setCurrentQ] = React.useState(0);
  const [answers, setAnswers] = React.useState({});
  const [modalOpen, setModalOpen] = React.useState(false);
  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("dp_theme", theme);
  }, [theme]);

  React.useEffect(() => {
    document.documentElement.setAttribute("lang", lang);
    localStorage.setItem("dp_lang", lang);
  }, [lang]);

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step, currentQ]);

  const ui = ASSESSMENT_UI[lang];
  const dims = ASSESSMENT_DIMENSIONS;
  const questions = ASSESSMENT_QUESTIONS;

  const handleBegin = () => { setStep("questions"); setCurrentQ(0); };
  const handleAnswer = (qid, score) => {
    const next = { ...answers, [qid]: score };
    setAnswers(next);
    // Auto-advance with a small delay so the selection registers visually
    setTimeout(() => {
      if (currentQ < questions.length - 1) {
        setCurrentQ(currentQ + 1);
      } else {
        setStep("analyzing");
      }
    }, 280);
  };
  const handleAnalyzingComplete = () => setStep("results");
  const handleBack = () => {
    if (currentQ > 0) setCurrentQ(currentQ - 1);
    else setStep("intro");
  };
  const handleRestart = () => {
    setAnswers({});
    setCurrentQ(0);
    setStep("intro");
  };

  return (
    <I18nContext.Provider value={{ t: TRANSLATIONS[lang], lang, setLang }}>
      <Nav theme={theme} setTheme={setTheme} openModal={openModal} />
      <main>
        {step === "intro" && (
          <AssessmentIntro ui={ui} dims={dims} lang={lang} onBegin={handleBegin} />
        )}
        {step === "questions" && (
          <AssessmentQuestion
            ui={ui}
            dims={dims}
            lang={lang}
            q={questions[currentQ]}
            qIndex={currentQ}
            qTotal={questions.length}
            currentAnswer={answers[questions[currentQ].id]}
            onAnswer={handleAnswer}
            onBack={handleBack}
            isLast={currentQ === questions.length - 1}
          />
        )}
        {step === "analyzing" && (
          <AssessmentAnalyzing ui={ui} onComplete={handleAnalyzingComplete} />
        )}
        {step === "results" && (
          <AssessmentResults
            ui={ui}
            dims={dims}
            lang={lang}
            answers={answers}
            onRestart={handleRestart}
            openModal={openModal}
          />
        )}
      </main>
      <Footer openModal={openModal} />
      <ContactModal open={modalOpen} onClose={closeModal} />
    </I18nContext.Provider>
  );
}

// ===== Intro screen =====
function AssessmentIntro({ ui, dims, lang, onBegin }) {
  return (
    <section className="assessment-section section-pad assessment-intro">
      <div className="container">
        <div className="assessment-card reveal in">
          <div className="eyebrow">{ui.intro.eyebrow}</div>
          <h1 className="assessment-title">
            {ui.intro.title}
            <br />
            <span className="accent italic">{ui.intro.titleAccent}</span>
          </h1>
          <p className="assessment-lead">{ui.intro.lead}</p>

          <div className="assessment-meta-row">
            <span className="assessment-meta-item">{ui.intro.time}</span>
          </div>

          <div className="assessment-dim-list">
            <div className="assessment-dim-list-label">{ui.intro.dimensionsLabel}</div>
            {dims.map((d) => (
              <div className="assessment-dim-item" key={d.id}>
                <span className="dim-name">{d[lang].name}</span>
                <span className="dim-desc">{d[lang].desc}</span>
              </div>
            ))}
          </div>

          <p className="assessment-privacy">{ui.intro.privacy}</p>

          <div className="assessment-cta-row">
            <button className="btn btn-primary" onClick={onBegin}>
              {ui.intro.cta} <Icon.Arrow />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ===== Single-question step =====
function AssessmentQuestion({ ui, dims, lang, q, qIndex, qTotal, currentAnswer, onAnswer, onBack, isLast }) {
  const dim = dims.find((d) => d.id === q.dim);
  const progressText = ui.question.progress.replace("{n}", qIndex + 1).replace("{total}", qTotal);
  const progressPct = ((qIndex + 1) / qTotal) * 100;

  return (
    <section className="assessment-section section-pad assessment-question-wrap">
      <div className="container">
        <div className="assessment-progress">
          <div className="assessment-progress-meta">
            <span className="assessment-progress-text">{progressText}</span>
            <span className="assessment-progress-dim">{dim[lang].name}</span>
          </div>
          <div className="assessment-progress-bar">
            <div className="assessment-progress-fill" style={{ width: progressPct + "%" }} />
          </div>
        </div>

        <div className="assessment-card assessment-question-card">
          <h2 className="assessment-question-text">{q[lang].q}</h2>

          <div className="assessment-options">
            {q[lang].options.map((opt, i) => {
              const selected = currentAnswer === opt.score;
              return (
                <button
                  key={i}
                  className={`assessment-option${selected ? " selected" : ""}`}
                  onClick={() => onAnswer(q.id, opt.score)}
                >
                  <span className="assessment-option-marker">{String.fromCharCode(65 + i)}</span>
                  <span className="assessment-option-text">{opt.text}</span>
                </button>
              );
            })}
          </div>

          <div className="assessment-actions">
            <button className="btn-link" onClick={onBack}>
              ← {ui.question.back}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ===== Analyzing screen (between last question and results) =====
function AssessmentAnalyzing({ ui, onComplete }) {
  const messages = ui.analyzing.messages;
  const stepDuration = 600; // ms per message
  const total = stepDuration * messages.length; // total visible time
  const [msgIndex, setMsgIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i < messages.length - 1 ? i + 1 : i));
    }, stepDuration);
    const timer = setTimeout(onComplete, total + 200);
    return () => { clearInterval(interval); clearTimeout(timer); };
  }, []);

  return (
    <section className="assessment-section section-pad assessment-analyzing-wrap">
      <div className="container">
        <div className="assessment-card assessment-analyzing-card">
          <div className="eyebrow">{ui.analyzing.eyebrow}</div>
          <div className="assessment-analyzing-message" key={msgIndex}>
            {messages[msgIndex]}
            <span className="assessment-analyzing-dots">
              <span></span><span></span><span></span>
            </span>
          </div>
          <div className="assessment-analyzing-bar">
            <div
              className="assessment-analyzing-bar-fill"
              style={{ animationDuration: total + "ms" }}
            />
          </div>
          <div className="assessment-analyzing-counter">
            {msgIndex + 1} / {messages.length}
          </div>
        </div>
      </div>
    </section>
  );
}

// ===== Results screen =====
function AssessmentResults({ ui, dims, lang, answers, onRestart, openModal }) {
  const r = calculateAssessmentResults(answers);
  const profile = ASSESSMENT_PROFILES[r.profile][lang];

  const dimById = (id) => dims.find((d) => d.id === id);

  return (
    <section className="assessment-section section-pad assessment-results">
      <div className="container">
        <div className="assessment-card assessment-results-card reveal in">
          <div className="eyebrow">{ui.results.eyebrow}</div>
          <h1 className="assessment-results-title">{profile.title}</h1>

          <div className="assessment-overall">
            <div className="assessment-overall-meta">
              <span className="assessment-overall-label">{ui.results.overallLabel}</span>
              <span className="assessment-overall-score">
                {r.overall.score} {ui.results.scoreOf} {r.overall.max} <span className="muted">· {r.overall.pct}%</span>
              </span>
            </div>
            <div className="assessment-overall-bar">
              <div className="assessment-overall-fill" style={{ width: r.overall.pct + "%" }} />
            </div>
          </div>

          <div className="assessment-narrative">
            <h3>{ui.results.narrativeTitle}</h3>
            <p>{profile.narrative}</p>
          </div>

          <div className="assessment-dim-bars">
            {dims.map((d) => {
              const ds = r.dimensions[d.id];
              return (
                <div className="assessment-dim-bar" key={d.id}>
                  <div className="assessment-dim-bar-meta">
                    <span className="dim-name">{d[lang].name}</span>
                    <span className="dim-score">{ds.score} {ui.results.scoreOf} {ds.max}</span>
                  </div>
                  <div className="assessment-dim-bar-track">
                    <div className="assessment-dim-bar-fill" style={{ width: ds.pct + "%" }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="assessment-strength-priority-grid">
            <div className="assessment-sp-block">
              <h3 className="assessment-sp-title">{ui.results.strengthsTitle}</h3>
              <ul className="assessment-sp-list">
                {r.strengths.map((id) => {
                  const d = dimById(id);
                  return (
                    <li key={id}>
                      <span className="assessment-sp-name">{d[lang].name}</span>
                      <span className="assessment-sp-desc">{d[lang].desc}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="assessment-sp-block">
              <h3 className="assessment-sp-title">{ui.results.prioritiesTitle}</h3>
              <ul className="assessment-sp-list">
                {r.priorities.map((id) => {
                  const d = dimById(id);
                  return (
                    <li key={id}>
                      <span className="assessment-sp-name">{d[lang].name}</span>
                      <span className="assessment-sp-desc">{d[lang].desc}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="assessment-final-cta">
            <h3>{ui.results.ctaTitle}</h3>
            <p>{ui.results.ctaSub}</p>
            <button className="btn btn-primary" onClick={openModal}>
              {ui.results.ctaBtn} <Icon.Arrow />
            </button>
            <button className="btn-link assessment-restart" onClick={onRestart}>
              ↻ {ui.results.restart}
            </button>
          </div>

          <p className="assessment-disclaimer">{ui.results.disclaimer}</p>
        </div>
      </div>
    </section>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<AssessmentApp />);
