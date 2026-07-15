import { useState } from "react";
import { CheckCircle, XCircle, ChevronRight, Award } from "lucide-react";
import type { QuizQuestion } from "../../data/courses";

interface QuizBlockProps {
  questions: QuizQuestion[];
  courseId: string;
  onPass: (score: number) => void;
}

export default function QuizBlock({ questions, onPass }: QuizBlockProps) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);

  const score = submitted
    ? questions.filter((q, i) => answers[i] === q.correctAnswerIndex).length
    : 0;
  const passed = submitted && score >= Math.ceil(questions.length * 0.7);

  const handleSubmit = () => {
    if (Object.keys(answers).length < questions.length) return;
    setSubmitted(true);
    if (score >= Math.ceil(questions.length * 0.7)) {
      onPass(score);
    }
  };

  const handleReset = () => {
    setAnswers({});
    setSubmitted(false);
    setCurrentQ(0);
  };

  if (submitted) {
    return (
      <div style={{ maxWidth: "640px" }}>
        {/* Score Card */}
        <div className="glass" style={{ padding: "2rem", textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{
            width: "72px", height: "72px", borderRadius: "50%",
            background: passed ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
            border: `2px solid ${passed ? "#4ade80" : "#f87171"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1rem",
          }}>
            {passed
              ? <Award size={32} style={{ color: "#4ade80" }} />
              : <XCircle size={32} style={{ color: "#f87171" }} />
            }
          </div>
          <div className="heading-lg" style={{ marginBottom: "0.375rem" }}>
            {passed ? "Mission Passed" : "Mission Failed"}
          </div>
          <div style={{ color: "var(--text-2)", marginBottom: "1.25rem" }}>
            {score} / {questions.length} correct
            {" "}({Math.round((score / questions.length) * 100)}%)
          </div>
          {!passed && (
            <button className="btn btn-accent" onClick={handleReset}>
              Retry Quiz
            </button>
          )}
        </div>

        {/* Review */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {questions.map((q, qi) => {
            const userAns = answers[qi];
            const correct = q.correctAnswerIndex;
            const isRight = userAns === correct;
            return (
              <div key={q.id} className="glass" style={{ padding: "1.25rem" }}>
                <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem" }}>
                  {isRight
                    ? <CheckCircle size={16} style={{ color: "#4ade80", flexShrink: 0, marginTop: "2px" }} />
                    : <XCircle    size={16} style={{ color: "#f87171", flexShrink: 0, marginTop: "2px" }} />
                  }
                  <span style={{ fontSize: "0.875rem", color: "var(--text-1)", fontWeight: 500 }}>
                    {q.question}
                  </span>
                </div>
                {q.options.map((opt, oi) => (
                  <div
                    key={oi}
                    style={{
                      padding: "0.5rem 0.75rem",
                      borderRadius: "6px",
                      marginBottom: "0.25rem",
                      fontSize: "0.8125rem",
                      background:
                        oi === correct
                          ? "rgba(74,222,128,0.08)"
                          : oi === userAns && !isRight
                            ? "rgba(248,113,113,0.08)"
                            : "transparent",
                      color:
                        oi === correct
                          ? "#4ade80"
                          : oi === userAns && !isRight
                            ? "#f87171"
                            : "var(--text-2)",
                      border: `1px solid ${
                        oi === correct
                          ? "rgba(74,222,128,0.2)"
                          : oi === userAns && !isRight
                            ? "rgba(248,113,113,0.2)"
                            : "transparent"
                      }`,
                    }}
                  >
                    {opt}
                  </div>
                ))}
                {q.explanation && (
                  <div style={{
                    marginTop: "0.75rem",
                    padding: "0.625rem 0.875rem",
                    background: "var(--accent-dim)",
                    border: "1px solid rgba(34,211,238,0.15)",
                    borderRadius: "6px",
                    fontSize: "0.8rem",
                    color: "var(--text-2)",
                    borderLeft: "3px solid var(--accent)",
                  }}>
                    <strong style={{ color: "var(--accent)", fontSize: "0.75rem" }}>DEBRIEF: </strong>
                    {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const q = questions[currentQ];

  return (
    <div style={{ maxWidth: "640px" }}>
      {/* Progress */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
          <span className="label-mono" style={{ fontSize: "0.6875rem" }}>
            Mission Briefing — Question {currentQ + 1} of {questions.length}
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>
            {Object.keys(answers).length} answered
          </span>
        </div>
        <div className="xp-bar-track">
          <div className="xp-bar-fill" style={{ width: `${((currentQ) / questions.length) * 100}%` }} />
        </div>
      </div>

      {/* Question */}
      <div className="glass" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
        <p style={{ fontSize: "0.9375rem", fontWeight: 500, color: "var(--text-1)", lineHeight: 1.6 }}>
          {q.question}
        </p>
      </div>

      {/* Options */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.25rem" }}>
        {q.options.map((opt, oi) => (
          <button
            key={oi}
            onClick={() => setAnswers(prev => ({ ...prev, [currentQ]: oi }))}
            style={{
              padding: "0.875rem 1rem",
              borderRadius: "var(--radius-sm)",
              border: `1px solid ${answers[currentQ] === oi ? "var(--accent)" : "var(--border)"}`,
              background: answers[currentQ] === oi ? "var(--accent-dim)" : "var(--surface)",
              color: answers[currentQ] === oi ? "var(--accent)" : "var(--text-2)",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "0.875rem",
              fontFamily: "var(--font-sans)",
              transition: "all 0.15s",
            }}
          >
            <span style={{ opacity: 0.4, marginRight: "0.5rem", fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
              {String.fromCharCode(65 + oi)}.
            </span>
            {opt}
          </button>
        ))}
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "space-between" }}>
        {currentQ > 0 ? (
          <button className="btn btn-ghost btn-sm" onClick={() => setCurrentQ(q => q - 1)}>
            ← Previous
          </button>
        ) : <div />}

        {currentQ < questions.length - 1 ? (
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setCurrentQ(q => q + 1)}
            disabled={answers[currentQ] === undefined}
            style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}
          >
            Next <ChevronRight size={14} />
          </button>
        ) : (
          <button
            className="btn btn-accent btn-sm"
            onClick={handleSubmit}
            disabled={Object.keys(answers).length < questions.length}
          >
            Submit Assessment
          </button>
        )}
      </div>
    </div>
  );
}
