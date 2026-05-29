/**
 * Family Business Readiness Assessment — React island.
 *
 * Three-state machine: intro → questions → analyzing → results. Scoring
 * helpers live in src/lib/assessment.ts; question/dimension/profile data
 * lives in src/data/assessment-*.json (edited via Decap or by hand).
 *
 * Triggers the contact modal via the `dp:open-modal` window event that
 * Modal.tsx listens for — no prop drilling required.
 */
import { useEffect, useState } from "react";
import dimensionsData from "../data/assessment-dimensions.json";
import questionsData from "../data/assessment-questions.json";
import profilesData from "../data/assessment-profiles.json";
import { calculateAssessmentResults } from "../lib/assessment";

const dims = dimensionsData;
const questions = questionsData;
const profiles = profilesData as Record<string, { threshold: number } & Record<"en" | "hr", { title: string; narrative: string }>>;

type Lang = "en" | "hr";

interface UI {
  intro: {
    eyebrow: string; title: string; titleAccent: string; lead: string;
    dimensionsLabel: string; privacy: string; time: string; cta: string;
  };
  question: { progress: string; back: string };
  analyzing: { eyebrow: string; messages: string[] };
  results: {
    eyebrow: string; overallLabel: string; strengthsTitle: string;
    prioritiesTitle: string; narrativeTitle: string; ctaTitle: string;
    ctaSub: string; ctaBtn: string; restart: string; disclaimer: string;
    scoreOf: string;
  };
}

interface Props { ui: UI; lang: Lang }

type Step = "intro" | "questions" | "analyzing" | "results";

const Arrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

export default function Assessment({ ui, lang }: Props) {
  const [step, setStep] = useState<Step>("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step, currentQ]);

  function handleBegin() { setStep("questions"); setCurrentQ(0); }
  function handleAnswer(qid: string, score: number) {
    const next = { ...answers, [qid]: score };
    setAnswers(next);
    setTimeout(() => {
      if (currentQ < questions.length - 1) setCurrentQ(currentQ + 1);
      else setStep("analyzing");
    }, 280);
  }
  function handleBack() {
    if (currentQ > 0) setCurrentQ(currentQ - 1);
    else setStep("intro");
  }
  function handleRestart() {
    setAnswers({});
    setCurrentQ(0);
    setStep("intro");
  }
  function openModal() { window.dispatchEvent(new CustomEvent("dp:open-modal")); }

  if (step === "intro") return <Intro ui={ui} lang={lang} onBegin={handleBegin} />;
  if (step === "questions") {
    const q = questions[currentQ];
    return (
      <Question
        ui={ui}
        lang={lang}
        q={q}
        qIndex={currentQ}
        qTotal={questions.length}
        currentAnswer={answers[q.id]}
        onAnswer={handleAnswer}
        onBack={handleBack}
      />
    );
  }
  if (step === "analyzing") return <Analyzing ui={ui} onComplete={() => setStep("results")} />;
  return <Results ui={ui} lang={lang} answers={answers} onRestart={handleRestart} openModal={openModal} />;
}

function Intro({ ui, lang, onBegin }: { ui: UI; lang: Lang; onBegin: () => void }) {
  return (
    <section className="assessment-section section-pad assessment-intro">
      <div className="container">
        <div className="assessment-card reveal in">
          <h1 className="assessment-title">
            {ui.intro.title}<br />
            {ui.intro.titleAccent}
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
              {ui.intro.cta} <Arrow />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Question({
  ui, lang, q, qIndex, qTotal, currentAnswer, onAnswer, onBack,
}: {
  ui: UI; lang: Lang; q: typeof questions[number]; qIndex: number; qTotal: number;
  currentAnswer: number | undefined; onAnswer: (qid: string, score: number) => void; onBack: () => void;
}) {
  const dim = dims.find((d) => d.id === q.dim)!;
  const progressText = ui.question.progress.replace("{n}", String(qIndex + 1)).replace("{total}", String(qTotal));
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
            <button className="btn-link" onClick={onBack}>← {ui.question.back}</button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Analyzing({ ui, onComplete }: { ui: UI; onComplete: () => void }) {
  const messages = ui.analyzing.messages;
  const stepDuration = 600;
  const total = stepDuration * messages.length;
  const [msgIndex, setMsgIndex] = useState(0);
  useEffect(() => {
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
          <div className="assessment-analyzing-message" key={msgIndex}>
            {messages[msgIndex]}
            <span className="assessment-analyzing-dots"><span></span><span></span><span></span></span>
          </div>
          <div className="assessment-analyzing-bar">
            <div className="assessment-analyzing-bar-fill" style={{ animationDuration: total + "ms" }} />
          </div>
          <div className="assessment-analyzing-counter">{msgIndex + 1} / {messages.length}</div>
        </div>
      </div>
    </section>
  );
}

function Results({
  ui, lang, answers, onRestart, openModal,
}: {
  ui: UI; lang: Lang; answers: Record<string, number>; onRestart: () => void; openModal: () => void;
}) {
  const r = calculateAssessmentResults(answers);
  const profile = profiles[r.profile][lang];
  const dimById = (id: string) => dims.find((d) => d.id === id)!;

  return (
    <section className="assessment-section section-pad assessment-results">
      <div className="container">
        <div className="assessment-card assessment-results-card reveal in">
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
              {ui.results.ctaBtn} <Arrow />
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
