"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/**
 * Use same idea as Foliopool.jsx
 *  - In dev you can proxy /foliomax -> http://localhost:4000
 */
const API_BASE = import.meta.env.VITE_API_BASE || "";
const API = {
  COMPANIES: `${API_BASE}/foliomax/companies/all-companies`,
  // QUIZZES now accepts (companyId, pageName)
  QUIZZES: (companyId, pageName) =>
    `${API_BASE}/foliomax/quizzes/all-quizzes?companyId=${encodeURIComponent(
      companyId
    )}${pageName ? `&pageName=${encodeURIComponent(pageName)}` : ""}&shuffle=true`,
};
;

const QUESTION_TIME = 60; // seconds per question

/* ---------- shared styles (very similar to Foliopool) ---------- */
const styles = {
  section: { paddingBottom: 40 },
  container: { maxWidth: "1400px", marginInline: "auto" },
  row: { display: "flex", gap: 20 },
  sidebar: { flex: "0 0 290px", maxWidth: 290 },
  stickySidebar: { position: "sticky", top: 24 },
  widget: { padding: 16, borderRadius: 12, background: "#ecf7f5" },
  input: {
    width: "100%",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
    marginBottom: 10,
    outline: "none",
  },
  list: {
    display: "block",
    maxHeight: "60vh",
    overflowY: "auto",
    padding: 0,
    margin: 0,
    listStyle: "none",
  },
  companyBtn: (active) => ({
    width: "100%",
    textAlign: "left",
    padding: "10px 12px",
    borderRadius: 10,
    background: active ? "#0f172a" : "#fff",
    color: active ? "#fff" : "#0b1220",
    border: "1px solid #e6eef0",
    cursor: "pointer",
    fontSize: 14,
  }),
  emptyLi: {
    padding: "12px 10px",
    color: "#64748b",
    fontSize: 14,
    textAlign: "center",
    background: "#f8fafc",
    borderRadius: 12,
  },
  content: { flex: "1 1 auto" },
  emptyBlock: {
    padding: "16px 12px",
    color: "#64748b",
    fontSize: 14,
    background: "#f8fafc",
    borderRadius: 12,
  },

  // quiz card
  quizCard: {
    background: "#fff",
    borderRadius: 16,
    border: "1px solid #e2e8f0",
    padding: 24,
    marginBottom: 20,
    boxShadow: "0 8px 20px rgba(15,23,42,0.03)",
  },
  resultCard: {
    background: "#fff",
    borderRadius: 16,
    border: "1px solid #e2e8f0",
    padding: 24,
    marginBottom: 20,
    boxShadow: "0 8px 20px rgba(15,23,42,0.03)",
    minHeight: 220,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },
  questionTitle: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 16,
    color: "#020617",
  },
  optionBtn: (isSelected, isCorrect, isIncorrect, isDisabled) => ({
    width: "100%",
    textAlign: "left",
    padding: "12px 16px",
    borderRadius: 12,
    border: "1px solid",
    background: isCorrect 
      ? "#dcfce7" 
      : isIncorrect 
        ? "#fee2e2" 
        : isSelected 
          ? "#0f172a" 
          : "#f8fafc",
    color: isCorrect || isIncorrect 
      ? (isCorrect ? "#166534" : "#991b1b") 
      : (isSelected ? "#fff" : "#020617"),
    fontSize: 14,
    cursor: isDisabled ? "not-allowed" : "pointer",
    marginBottom: 10,
    borderColor: isCorrect 
      ? "#86efac" 
      : isIncorrect 
        ? "#fca5a5" 
        : isSelected 
          ? "#0f172a" 
          : "#e2e8f0",
  }),
  footerRow: {
    marginTop: 16,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  nextBtn: (disabled) => ({
    padding: "10px 18px",
    borderRadius: 999,
    border: "none",
    background: disabled ? "#cbd5f5" : "#0f172a",
    color: disabled ? "#e2e8f0" : "#fff",
    fontSize: 14,
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 600,
  }),
  // timer / progress
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    marginBottom: 14,
  },
  progressOuter: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    background: "#e2e8f0",
    overflow: "hidden",
  },
  progressInner: (percent) => ({
    width: `${percent}%`,
    height: "100%",
    borderRadius: 999,
    background: "#0f172a",
    transition: "width 0.25s ease-out",
  }),
  timerPill: {
    padding: "4px 10px",
    borderRadius: 999,
    background: "#0f172a",
    color: "#fff",
    fontSize: 12,
    fontVariantNumeric: "tabular-nums",
  },
  feedbackText: {
    marginTop: 8,
    padding: "8px 12px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
  },
  correctFeedback: {
    background: "#dcfce7",
    color: "#166534",
    border: "1px solid #86efac",
  },
  incorrectFeedback: {
    background: "#fee2e2",
    color: "#991b1b",
    border: "1px solid #fca5a5",
  },
  note: {
    marginTop: 16,
    padding: "12px 16px",
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    color: "#334155",
    fontSize: 14,
    borderLeft: "4px solid #94a3b8",
  }
};

const CompanyItem = React.memo(function CompanyItem({
  company,
  activeId,
  onSelect,
}) {
  return (
    <li style={{ marginBottom: 8 }}>
      <button
        onClick={() => onSelect(company.id)}
        style={styles.companyBtn(String(activeId) === String(company.id))}
        title={company.name}
      >
        {company.name}
      </button>
    </li>
  );
});

const safeParseOptions = (options) => {
  if (Array.isArray(options)) return options;
  if (!options) return [];
  try {
    const parsed = JSON.parse(options);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const formatTime = (totalSeconds) => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return `${mm}:${ss}`;
};

export default function KnowYourCompanyQuiz() {
  // companies
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [companiesError, setCompaniesError] = useState("");

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const queryTimer = useRef(null);

  const [activeCompanyId, setActiveCompanyId] = useState(null);
  const [activeCompanyName, setActiveCompanyName] = useState("");

  // quizzes for selected company
  const [quizzes, setQuizzes] = useState([]);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [quizError, setQuizError] = useState("");

  // question navigation
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);

  // timer per question
  const [remainingSeconds, setRemainingSeconds] = useState(QUESTION_TIME);

  // answers & scoring
  const [userAnswers, setUserAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // ---------- fetch companies (once) ----------
  useEffect(() => {
    let mounted = true;
    const ac = new AbortController();

    setLoadingCompanies(true);
    setCompaniesError("");

    (async () => {
      try {
        const res = await fetch(API.COMPANIES, { signal: ac.signal });
        if (!res.ok) {
          throw new Error(`Failed to load companies (${res.status})`);
        }
        const data = await res.json();
        if (!mounted) return;
        setCompanies(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err?.name === "AbortError") return;
        setCompaniesError(err?.message || "Could not load companies");
      } finally {
        if (mounted) setLoadingCompanies(false);
      }
    })();

    return () => {
      mounted = false;
      ac.abort();
    };
  }, []);

  // ---------- debounced search ----------
  useEffect(() => {
    if (queryTimer.current) clearTimeout(queryTimer.current);
    queryTimer.current = setTimeout(
      () => setDebouncedQuery(query.trim().toLowerCase()),
      200
    );
    return () => {
      if (queryTimer.current) clearTimeout(queryTimer.current);
    };
  }, [query]);

  const filteredCompanies = useMemo(() => {
    if (!debouncedQuery) return companies;
    return companies.filter((c) =>
      (c.name || "").toLowerCase().includes(debouncedQuery)
    );
  }, [companies, debouncedQuery]);

  // ---------- select company ----------
  const handleSelectCompany = useCallback(
    (companyId) => {
      if (String(companyId) === String(activeCompanyId)) return;
      setActiveCompanyId(companyId);
      const c = companies.find((x) => String(x.id) === String(companyId));
      setActiveCompanyName(c?.name || "");
      // reset quiz state
      setQuizzes([]);
      setCurrentIndex(0);
      setSelectedOption(null);
      setIsAnswered(false);
      setQuizError("");
      setRemainingSeconds(QUESTION_TIME);
      setUserAnswers([]);
      setScore(0);
      setIsFinished(false);
    },
    [activeCompanyId, companies]
  );

  // ---------- fetch quizzes for active company ----------
  useEffect(() => {
    if (!activeCompanyId) return;

    let mounted = true;
    const ac = new AbortController();
    setLoadingQuiz(true);
    setQuizError("");
    setQuizzes([]);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setRemainingSeconds(QUESTION_TIME);
    setUserAnswers([]);
    setScore(0);
    setIsFinished(false);

    (async () => {
      try {
        // fetch only quizzes whose pageName = "kyow-your-company"
const PAGE_SLUG = "know-your-company";

const res = await fetch(API.QUIZZES(activeCompanyId, PAGE_SLUG), {
  signal: ac.signal,
});

        if (!res.ok) {
          throw new Error(`Failed to load quiz (${res.status})`);
        }
        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.quizzes || [];
        const normalized = list.map((q) => ({
          id: q.id,
          question: q.question,
          options: safeParseOptions(q.options),
          correctIndex: typeof q.correctIndex === "number" ? q.correctIndex : 0,
          note: q.note || "",
        }));
        const shuffled = normalized.sort(() => Math.random() - 0.5);

        if (!mounted) return;
        setQuizzes(shuffled);
        setUserAnswers(Array(shuffled.length).fill(null));
      } catch (err) {
        if (err?.name === "AbortError") return;
        setQuizError(err?.message || "Could not load quiz");
      } finally {
        if (mounted) setLoadingQuiz(false);
      }
    })();

    return () => {
      mounted = false;
      ac.abort();
    };
  }, [activeCompanyId]);

  const totalQuestions = quizzes.length;
  const currentQuiz = totalQuestions > 0 ? quizzes[currentIndex] : null;
  const progressPercent =
    totalQuestions === 0 ? 0 : ((currentIndex + 1) / totalQuestions) * 100;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  // ---------- reset timer whenever question changes / new quiz ----------
  useEffect(() => {
    if (!activeCompanyId || totalQuestions === 0 || isFinished) return;
    setRemainingSeconds(QUESTION_TIME);
    setSelectedOption(null);
    setIsAnswered(false);
  }, [activeCompanyId, totalQuestions, currentIndex, isFinished]);

  // ---------- countdown effect ----------
  useEffect(() => {
    if (!activeCompanyId || totalQuestions === 0 || isFinished || isAnswered) return;
    if (remainingSeconds <= 0) return;

    const id = setInterval(() => {
      setRemainingSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(id);
  }, [activeCompanyId, totalQuestions, isFinished, isAnswered, remainingSeconds]);

  // ---------- when timer hits 0: auto move to next / finish ----------
  useEffect(() => {
    if (
      !activeCompanyId ||
      totalQuestions === 0 ||
      isFinished ||
      remainingSeconds > 0 ||
      isAnswered
    )
      return;

    // store answer (if any) & update score
    setUserAnswers((prev) => {
      const copy = [...prev];
      copy[currentIndex] = selectedOption;
      return copy;
    });

    if (
      selectedOption != null &&
      currentQuiz &&
      selectedOption === currentQuiz.correctIndex
    ) {
      setScore((s) => s + 1);
    }

    if (isLastQuestion) {
      setIsFinished(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    }
  }, [
    remainingSeconds,
    activeCompanyId,
    totalQuestions,
    isFinished,
    currentIndex,
    selectedOption,
    currentQuiz,
    isLastQuestion,
    isAnswered
  ]);

  const handleOptionSelect = (optionIndex) => {
    if (isAnswered) return; // Prevent changing answer after submission
    
    setSelectedOption(optionIndex);
    setIsAnswered(true);

    // Update user answers
    setUserAnswers((prev) => {
      const copy = [...prev];
      copy[currentIndex] = optionIndex;
      return copy;
    });

    // Update score if correct
    if (optionIndex === currentQuiz.correctIndex) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (!currentQuiz) return;

    if (isLastQuestion) {
      // finish quiz
      setIsFinished(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    }
  };

  const handleRestart = () => {
    if (quizzes.length === 0) return;
    const reshuffled = [...quizzes].sort(() => Math.random() - 0.5);
    setQuizzes(reshuffled);
    setUserAnswers(Array(reshuffled.length).fill(null));
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setRemainingSeconds(QUESTION_TIME);
    setScore(0);
    setIsFinished(false);
  };

  /* ---------- render ---------- */
  return (
    <section className="account-details service-details" style={styles.section}>
      <div className="auto-container" style={styles.container}>
        <div className="row clearfix" style={styles.row}>
          {/* LEFT: Sidebar - Companies */}
          <div
            className="col-lg-3 col-md-12 col-sm-12 sidebar-side"
            style={styles.sidebar}
          >
            <div
              className="account-sidebar default-sidebar"
              style={styles.stickySidebar}
            >
              <div
                className="sidebar-widget category-widget"
                style={styles.widget}
              >
                <div className="widget-title">
                  <h3 style={{ margin: 0 }}>Quiz Companies</h3>
                </div>

                <div className="widget-content" style={{ marginTop: 12 }}>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search company..."
                    style={styles.input}
                    aria-label="Search companies"
                  />

                  <ul className="category-list clearfix" style={styles.list}>
                    {loadingCompanies && (
                      <li style={styles.emptyLi}>Loading companies…</li>
                    )}
                    {companiesError && !loadingCompanies && (
                      <li style={styles.emptyLi}>⚠ {companiesError}</li>
                    )}
                    {!loadingCompanies &&
                      !companiesError &&
                      filteredCompanies.length === 0 && (
                        <li style={styles.emptyLi}>No companies found</li>
                      )}

                    {!loadingCompanies &&
                      !companiesError &&
                      filteredCompanies.map((c) => (
                        <CompanyItem
                          key={c.id}
                          company={c}
                          activeId={activeCompanyId}
                          onSelect={handleSelectCompany}
                        />
                      ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Quiz content */}
          <div
            className="col-lg-9 col-md-12 col-sm-12 content-side"
            style={styles.content}
          >
            <div className="account-details-content" style={{ width: "100%" }}>
              {!activeCompanyId && (
                <div className="content-one">
                   <img
        src="/assets/images/quiz-img.png"
        alt="Select company"
        style={{ width: "200px", margin: "0 auto 20px" }}
      />
                  <p>Select a company from the left to start the quiz.</p>
                </div>
              )}

              {activeCompanyId && (
                <div className="content-two" style={{ marginTop: 8 }}>
                  {loadingQuiz && (
                    <div style={styles.emptyBlock}>Loading quiz…</div>
                  )}
                  {quizError && !loadingQuiz && (
                    <div style={styles.emptyBlock}>⚠ {quizError}</div>
                  )}

                  {!loadingQuiz &&
                    !quizError &&
                    activeCompanyId &&
                    totalQuestions === 0 && (
                      <div style={styles.emptyBlock}>
                        No quiz found for <strong>{activeCompanyName}</strong>.
                      </div>
                    )}

                  {/* RESULT / FINISH CARD */}
                  {!loadingQuiz &&
                    !quizError &&
                    activeCompanyId &&
                    totalQuestions > 0 &&
                    isFinished && (
                      <div style={styles.resultCard}>
                        <h2 style={{ fontSize: 22, marginBottom: 8 }}>
                          Quiz Completed 🎉
                        </h2>
                        <p
                          style={{
                            fontSize: 16,
                            marginBottom: 4,
                            color: "#0f172a",
                          }}
                        >
                          {activeCompanyName}
                        </p>
                        <p
                          style={{
                            fontSize: 15,
                            marginBottom: 16,
                            color: "#64748b",
                          }}
                        >
                          You scored{" "}
                          <strong>
                            {score} / {totalQuestions}
                          </strong>
                        </p>

                        <button
                          type="button"
                          onClick={handleRestart}
                          style={styles.nextBtn(false)}
                        >
                          Restart Quiz
                        </button>
                      </div>
                    )}

                  {/* QUESTION CARD */}
                  {!loadingQuiz &&
                    !quizError &&
                    activeCompanyId &&
                    currentQuiz &&
                    !isFinished && (
                      <div style={styles.quizCard}>
                        {/* timer & progress */}
                        <div style={styles.topBar}>
                          <div style={styles.progressOuter}>
                            <div
                              style={styles.progressInner(progressPercent)}
                            />
                          </div>
                          <div style={styles.timerPill}>
                            ⏱ {formatTime(remainingSeconds)}
                          </div>
                        </div>

                        <h2 style={styles.questionTitle}>
                          Q{currentIndex + 1}. {currentQuiz.question}
                        </h2>

                        <div>
                          {currentQuiz.options.map((opt, idx) => {
                            const isSelected = selectedOption === idx;
                            const isCorrect = currentQuiz.correctIndex === idx;
                            const isIncorrect = isAnswered && isSelected && !isCorrect;
                            
                            return (
                              <button
                                key={idx}
                                type="button"
                                style={styles.optionBtn(
                                  isSelected,
                                  isCorrect && isAnswered, // Only show correct if answered
                                  isIncorrect,
                                  isAnswered
                                )}
                                onClick={() => handleOptionSelect(idx)}
                                disabled={isAnswered}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>

                        {/* Feedback message */}
                        {isAnswered && (
                          <div
                            style={{
                              ...styles.feedbackText,
                              ...(selectedOption === currentQuiz.correctIndex
                                ? styles.correctFeedback
                                : styles.incorrectFeedback),
                            }}
                          >
                            {selectedOption === currentQuiz.correctIndex
                              ? "Correct! Well done."
                              : `Incorrect. The correct answer is: ${currentQuiz.options[currentQuiz.correctIndex]}`}
                          </div>
                        )}

                        {/* Note display - only shown after selecting an option */}
                        {isAnswered && currentQuiz.note && (
                          <div style={styles.note}>
                            <strong>Note:</strong> {currentQuiz.note}
                          </div>
                        )}

                        <div style={styles.footerRow}>
                          <div
                            style={{
                              fontSize: 13,
                              color: "#64748b",
                            }}
                          >
                            Question {currentIndex + 1} of {totalQuestions}
                          </div>

                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              type="button"
                              onClick={handleRestart}
                              style={styles.nextBtn(false)}
                            >
                              Restart
                            </button>
                            <button
                              type="button"
                              onClick={handleNext}
                              disabled={!isAnswered}
                              style={styles.nextBtn(!isAnswered)}
                            >
                              {isLastQuestion ? "Finish" : "Next"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}