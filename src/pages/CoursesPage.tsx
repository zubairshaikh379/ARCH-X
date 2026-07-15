import { useState } from "react";
import type { ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { COURSES } from "../data/courses";
import type { UserProfile, VmStatus } from "../types";
import Terminal from "../components/courses/Terminal";
import QuizBlock from "../components/courses/QuizBlock";
import CertificateModal from "../components/CertificateModal";
import {
  ArrowLeft, Zap, Clock, CheckCircle, Play, Power,
  BookOpen, Terminal as TermIcon, FlaskConical, FileText,
  Flag, Loader, ChevronRight, ChevronLeft, Award,
} from "lucide-react";

type Course = (typeof COURSES)[number];

interface CoursesPageProps {
  selectedCourse: Course | null;
  onSelectCourse: (c: Course | null) => void;
  userProfile: UserProfile;
  vmStatus: VmStatus;
  vmIP: string;
  vmPort: number;
  vmFlag: string;
  vmCpuHistory: number[];
  vmRamHistory: number[];
  terminalHistory: string[];
  onCommand: (cmd: string) => void;
  onClearTerminal: () => void;
  onProvisionVM: () => void;
  onShutdownVM: () => void;
  onSubmitFlag: (input: string) => void;
  onAddXp: (amount: number, message: string) => void;
  onNotify: (msg: string, type?: "success" | "error" | "info" | "warning") => void;
}

type WorkspaceTab = "overview" | "guidebook" | "theory" | "practice";

const DIFF_FILTER = ["All", "Beginner", "Intermediate", "Advanced"] as const;

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const cls =
    difficulty === "Beginner"     ? "badge-beginner" :
    difficulty === "Intermediate" ? "badge-intermediate" :
    difficulty === "Advanced"     ? "badge-advanced" : "";
  return <span className={`badge ${cls}`}>{difficulty}</span>;
}

/* ─── Course Grid ──────────────────────────────────────────────── */
function CourseGrid({ userProfile, onSelectCourse }: {
  userProfile: UserProfile;
  onSelectCourse: (c: Course) => void;
}) {
  const [filter, setFilter] = useState<typeof DIFF_FILTER[number]>("All");

  const shown = COURSES.filter(c =>
    filter === "All" || c.difficulty === filter
  );
  const completed = userProfile.completedCourses || [];

  return (
    <div style={{ padding: "2rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div className="label-mono" style={{ marginBottom: "0.625rem" }}>◈ TRAINING TRACKS</div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 className="heading-lg">{COURSES.length} Courses Available</h1>
            <p style={{ color: "var(--text-2)", fontSize: "0.875rem", marginTop: "0.375rem" }}>
              {completed.length} completed · {COURSES.length - completed.length} remaining
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.375rem" }}>
            {DIFF_FILTER.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "0.35rem 0.75rem", borderRadius: "999px",
                  border: `1px solid ${filter === f ? "var(--accent)" : "var(--border)"}`,
                  background: filter === f ? "var(--accent-dim)" : "transparent",
                  color: filter === f ? "var(--accent)" : "var(--text-3)",
                  fontSize: "0.75rem", fontWeight: 500, cursor: "pointer",
                  fontFamily: "var(--font-sans)", transition: "all 0.15s",
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: "0.875rem",
      }}>
        {shown.map((course, i) => {
          const done = completed.includes(course.id);
          return (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.35 }}
              className="course-card"
              onClick={() => onSelectCourse(course)}
            >
              {/* Top */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem", flexWrap: "wrap" }}>
                    <DifficultyBadge difficulty={course.difficulty} />
                    {done && (
                      <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.65rem", color: "#4ade80" }}>
                        <CheckCircle size={10} /> Done
                      </span>
                    )}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: "0.9375rem", lineHeight: 1.3, color: "var(--text-1)" }}>
                    {course.title}
                  </div>
                </div>
              </div>

              {/* Description */}
              <p style={{ fontSize: "0.8125rem", color: "var(--text-2)", lineHeight: 1.55 }}>
                {course.shortDesc}
              </p>

              {/* MITRE bars */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                {course.mitreCoverage.slice(0, 2).map(m => (
                  <div key={m.tactic}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.15rem" }}>
                      <span style={{ fontSize: "0.65rem", color: "var(--text-3)" }}>{m.tactic}</span>
                      <span style={{ fontSize: "0.65rem", color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>{m.percentage}%</span>
                    </div>
                    <div className="xp-bar-track">
                      <div className="xp-bar-fill" style={{ width: `${m.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <Clock size={11} style={{ color: "var(--text-3)" }} />
                    <span style={{ fontSize: "0.7rem", color: "var(--text-3)" }}>{course.estimatedTime}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <Zap size={11} style={{ color: "var(--accent)" }} />
                    <span style={{ fontSize: "0.7rem", color: "var(--accent)", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                      +400 XP
                    </span>
                  </div>
                </div>
                <span style={{ fontSize: "0.8rem", color: "var(--accent)", fontWeight: 500 }}>
                  Launch →
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Course Workspace ─────────────────────────────────────────── */
function CourseWorkspace({
  course,
  userProfile,
  vmStatus, vmIP, vmPort, vmFlag,
  terminalHistory,
  onCommand, onClearTerminal,
  onProvisionVM, onShutdownVM,
  onSubmitFlag, onAddXp, onNotify,
  onBack,
}: {
  course: Course;
  userProfile: UserProfile;
  vmStatus: VmStatus;
  vmIP: string; vmPort: number; vmFlag: string;
  terminalHistory: string[];
  onCommand: (cmd: string) => void;
  onClearTerminal: () => void;
  onProvisionVM: () => void;
  onShutdownVM: () => void;
  onSubmitFlag: (input: string) => void;
  onAddXp: (amount: number, message: string) => void;
  onNotify: (msg: string, type?: "success" | "error" | "info" | "warning") => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<WorkspaceTab>("overview");
  const [lessonIdx, setLessonIdx] = useState(0);
  const [flagInput, setFlagInput] = useState("");
  const [quizPassed, setQuizPassed] = useState(userProfile.completedCourses.includes(course.id));
  const [lessonQuizDone, setLessonQuizDone] = useState<Record<number, boolean>>({});
  const [certOpen, setCertOpen] = useState(false);

  // Quiz volume (per user pref ≈30/course): show a SMALL 2-question check after
  // each lesson, and a Final Exam of ~1 question/lesson drawn from questions NOT
  // shown in the per-lesson check (so the exam feels fresh, not a repeat).
  const LESSON_QUIZ_COUNT = 2;
  const allQuizzes = course.lessons.flatMap(l => l.quizzes);
  const finalExam = course.lessons.length > 2
    ? course.lessons.map(l => l.quizzes[LESSON_QUIZ_COUNT] ?? l.quizzes[0]).filter(Boolean)
    : allQuizzes;

  const currentLesson = course.lessons[lessonIdx];
  const isCompleted = userProfile.completedCourses.includes(course.id);

  const TABS: { id: WorkspaceTab; label: string; icon: ReactNode }[] = [
    { id: "overview",  label: "Overview",        icon: <FileText    size={13} /> },
    { id: "guidebook", label: "Guidebook",        icon: <BookOpen    size={13} /> },
    { id: "theory",    label: "Final Exam",       icon: <FlaskConical size={13} /> },
    { id: "practice",  label: "Practice Lab",     icon: <TermIcon    size={13} /> },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      {/* ── Workspace Header ──────────────────────────────── */}
      <div style={{
        padding: "1rem 1.5rem",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", gap: "1rem",
        background: "rgba(4,4,13,0.7)", backdropFilter: "blur(10px)",
        flexShrink: 0,
      }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ gap: "0.375rem" }}>
          <ArrowLeft size={14} /> Courses
        </button>
        <div style={{ width: "1px", height: "20px", background: "var(--border)" }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flexWrap: "wrap" }}>
            <h2 style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-1)" }}>
              {course.title}
            </h2>
            <DifficultyBadge difficulty={course.difficulty} />
            {isCompleted && (
              <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.65rem", color: "#4ade80" }}>
                <CheckCircle size={10} /> Completed
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
          {isCompleted && (
            <button className="btn btn-accent btn-sm" onClick={() => setCertOpen(true)} style={{ gap: "0.35rem" }}>
              <Award size={13} /> Certificate
            </button>
          )}
          <Clock size={12} style={{ color: "var(--text-3)" }} />
          <span style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>{course.estimatedTime}</span>
          <Zap size={12} style={{ color: "var(--accent)" }} />
          <span style={{ fontSize: "0.75rem", color: "var(--accent)", fontFamily: "var(--font-mono)" }}>+400 XP</span>
        </div>
      </div>

      <CertificateModal
        open={certOpen}
        onClose={() => setCertOpen(false)}
        operatorName={userProfile.callsign || userProfile.username}
        username={userProfile.username}
        courseTitle={course.title}
        courseId={course.id}
        level={userProfile.level}
        xp={userProfile.xp}
      />

      {/* ── Tab Bar ───────────────────────────────────────── */}
      <div className="tab-bar" style={{ padding: "0 1.5rem", flexShrink: 0 }}>
        {TABS.map(t => {
          const locked = t.id === "practice" && !quizPassed && course.lessons.length > 2;
          return (
          <button
            key={t.id}
            className={`tab-btn ${tab === t.id ? "active" : ""}`}
            onClick={() => {
              if (locked) { onNotify("Pass the Final Exam to unlock the Practice Lab.", "warning"); setTab("theory"); return; }
              setTab(t.id);
            }}
            style={{ display: "flex", alignItems: "center", gap: "0.375rem", opacity: locked ? 0.5 : 1 }}
            title={locked ? "Locked — pass the Final Exam first" : undefined}
          >
            {t.icon} {t.label}{locked ? " 🔒" : ""}
          </button>
          );
        })}
      </div>

      {/* ── Tab Content ───────────────────────────────────── */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
        <AnimatePresence mode="wait">
          {/* ── Overview ──────────────────────────────────── */}
          {tab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ flex: 1, overflowY: "auto", padding: "1.75rem" }}
            >
              <div style={{ maxWidth: "800px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {/* Objective */}
                <div className="glass" style={{ padding: "1.5rem" }}>
                  <div className="label-mono" style={{ fontSize: "0.65rem", marginBottom: "0.875rem" }}>◈ MISSION OBJECTIVE</div>
                  <p style={{ color: "var(--text-1)", lineHeight: 1.7, fontWeight: 500 }}>{course.sopObjective}</p>
                  <div style={{ marginTop: "1rem", padding: "0.875rem 1rem", background: "var(--accent-dim)", border: "1px solid rgba(34,211,238,0.12)", borderRadius: "var(--radius-sm)", borderLeft: "3px solid var(--accent)" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--accent)", fontWeight: 600, fontFamily: "var(--font-mono)", marginBottom: "0.375rem" }}>ANALOGY</div>
                    <p style={{ fontSize: "0.875rem", color: "var(--text-2)", lineHeight: 1.6 }}>{course.sopAnalogy}</p>
                  </div>
                </div>

                {/* Prerequisites & Learning Outcomes (deep guidebooks) */}
                {(course.prerequisites?.length || course.learningOutcomes?.length) && (
                  <div className="glass" style={{ padding: "1.5rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem" }}>
                    {course.prerequisites?.length ? (
                      <div>
                        <div className="label-mono" style={{ fontSize: "0.65rem", marginBottom: "0.875rem" }}>◈ PREREQUISITES</div>
                        <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          {course.prerequisites.map((p, i) => (
                            <li key={i} style={{ display: "flex", gap: "0.5rem", fontSize: "0.85rem", color: "var(--text-2)", lineHeight: 1.5 }}>
                              <span style={{ color: "var(--accent)" }}>▹</span>{p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {course.learningOutcomes?.length ? (
                      <div>
                        <div className="label-mono" style={{ fontSize: "0.65rem", marginBottom: "0.875rem" }}>◈ BY THE END, YOU CAN</div>
                        <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          {course.learningOutcomes.map((p, i) => (
                            <li key={i} style={{ display: "flex", gap: "0.5rem", fontSize: "0.85rem", color: "var(--text-2)", lineHeight: 1.5 }}>
                              <CheckCircle size={13} style={{ color: "#4ade80", flexShrink: 0, marginTop: "3px" }} />{p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* SOP Steps */}
                <div className="glass" style={{ padding: "1.5rem" }}>
                  <div className="label-mono" style={{ fontSize: "0.65rem", marginBottom: "1rem" }}>◈ STANDARD OPERATING PROCEDURE</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                    {course.sopSteps.map((step, i) => (
                      <div key={i} style={{ display: "flex", gap: "0.875rem", alignItems: "flex-start" }}>
                        <div style={{
                          width: "22px", height: "22px", borderRadius: "50%",
                          background: "var(--accent-dim)", border: "1px solid rgba(34,211,238,0.25)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontFamily: "var(--font-mono)", fontSize: "0.7rem", fontWeight: 700,
                          color: "var(--accent)", flexShrink: 0,
                        }}>
                          {i + 1}
                        </div>
                        <p style={{ fontSize: "0.875rem", color: "var(--text-2)", lineHeight: 1.6, marginTop: "2px" }}>{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Interview Tips */}
                <div className="glass" style={{ padding: "1.5rem" }}>
                  <div className="label-mono" style={{ fontSize: "0.65rem", marginBottom: "1rem" }}>◈ INTERVIEW INTEL</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {course.interviewTips.map((tip, i) => (
                      <div key={i}>
                        <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-1)", marginBottom: "0.375rem" }}>
                          Q: {tip.question}
                        </div>
                        <div style={{ fontSize: "0.8125rem", color: "var(--text-2)", lineHeight: 1.65, paddingLeft: "0.875rem", borderLeft: "2px solid var(--border)" }}>
                          {tip.answer}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Must-Know Topics (deep guidebooks) */}
                {course.mustKnow?.length ? (
                  <div className="glass" style={{ padding: "1.5rem" }}>
                    <div className="label-mono" style={{ fontSize: "0.65rem", marginBottom: "1rem" }}>◈ MUST-KNOW TOPICS</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                      {course.mustKnow.map((m, i) => (
                        <span key={i} className="badge badge-accent" style={{ fontSize: "0.7rem", textTransform: "none", letterSpacing: 0 }}>{m}</span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Commonly Under-Studied Gaps (deep guidebooks) */}
                {course.commonGaps?.length ? (
                  <div className="glass" style={{ padding: "1.5rem" }}>
                    <div className="label-mono" style={{ fontSize: "0.65rem", marginBottom: "1rem" }}>◈ WHAT MOST LEARNERS MISS</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                      {course.commonGaps.map((g, i) => (
                        <div key={i} style={{ display: "flex", gap: "0.625rem" }}>
                          <div style={{ color: "#facc15", flexShrink: 0, marginTop: "2px" }}>◑</div>
                          <p style={{ fontSize: "0.875rem", color: "var(--text-2)", lineHeight: 1.6 }}>{g}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Loopholes */}
                <div className="glass" style={{ padding: "1.5rem" }}>
                  <div className="label-mono" style={{ fontSize: "0.65rem", marginBottom: "1rem" }}>◈ KNOWN ATTACK LOOPHOLES</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                    {course.loopholes.map((l, i) => (
                      <div key={i} style={{ display: "flex", gap: "0.625rem" }}>
                        <div style={{ color: "#f87171", flexShrink: 0, marginTop: "2px" }}>⚠</div>
                        <p style={{ fontSize: "0.875rem", color: "var(--text-2)", lineHeight: 1.6 }}>{l}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pros & Cons (deep guidebooks) */}
                {(course.prosCons?.pros?.length || course.prosCons?.cons?.length) ? (
                  <div className="glass" style={{ padding: "1.5rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem" }}>
                    <div>
                      <div className="label-mono" style={{ fontSize: "0.65rem", marginBottom: "0.875rem", color: "#4ade80" }}>◈ STRENGTHS OF THIS APPROACH</div>
                      <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {course.prosCons!.pros.map((p, i) => (
                          <li key={i} style={{ display: "flex", gap: "0.5rem", fontSize: "0.85rem", color: "var(--text-2)", lineHeight: 1.5 }}>
                            <span style={{ color: "#4ade80" }}>+</span>{p}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="label-mono" style={{ fontSize: "0.65rem", marginBottom: "0.875rem", color: "#f87171" }}>◈ LIMITATIONS / TRADE-OFFS</div>
                      <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {course.prosCons!.cons.map((p, i) => (
                          <li key={i} style={{ display: "flex", gap: "0.5rem", fontSize: "0.85rem", color: "var(--text-2)", lineHeight: 1.5 }}>
                            <span style={{ color: "#f87171" }}>−</span>{p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : null}

                {/* Career Outlook (deep guidebooks) */}
                {course.careerNotes ? (
                  <div className="glass" style={{ padding: "1.5rem" }}>
                    <div className="label-mono" style={{ fontSize: "0.65rem", marginBottom: "0.875rem" }}>◈ CAREER OUTLOOK</div>
                    <p style={{ fontSize: "0.875rem", color: "var(--text-2)", lineHeight: 1.7 }}>{course.careerNotes}</p>
                  </div>
                ) : null}
              </div>
            </motion.div>
          )}

          {/* ── Guidebook ─────────────────────────────────── */}
          {tab === "guidebook" && (
            <motion.div
              key="guidebook"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ flex: 1, display: "flex", overflow: "hidden" }}
            >
              {/* Lesson nav sidebar */}
              {course.lessons.length > 1 && (
                <div style={{
                  width: "220px", flexShrink: 0,
                  borderRight: "1px solid var(--border)",
                  overflowY: "auto", padding: "1rem 0.625rem",
                }}>
                  {course.lessons.map((lesson, i) => (
                    <button
                      key={i}
                      onClick={() => setLessonIdx(i)}
                      style={{
                        width: "100%", padding: "0.625rem 0.75rem",
                        borderRadius: "6px", border: "1px solid transparent",
                        background: lessonIdx === i ? "var(--accent-dim)" : "transparent",
                        borderColor: lessonIdx === i ? "rgba(34,211,238,0.15)" : "transparent",
                        color: lessonIdx === i ? "var(--accent)" : "var(--text-2)",
                        cursor: "pointer", textAlign: "left",
                        fontSize: "0.8125rem", fontFamily: "var(--font-sans)",
                        transition: "all 0.15s",
                        display: "flex", alignItems: "center", gap: "0.5rem",
                      }}
                    >
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", opacity: 0.6 }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {lesson.title}
                    </button>
                  ))}
                </div>
              )}

              {/* Lesson content */}
              <div style={{ flex: 1, overflowY: "auto", padding: "1.75rem" }}>
                <div style={{ maxWidth: "760px" }}>
                  {/* Lesson header */}
                  <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
                    <div>
                      <div className="label-mono" style={{ fontSize: "0.65rem", marginBottom: "0.375rem" }}>
                        LESSON {lessonIdx + 1} OF {course.lessons.length}
                        {lessonQuizDone[lessonIdx] && (
                          <span style={{ color: "#4ade80", marginLeft: "0.5rem" }}>✓ COMPLETE</span>
                        )}
                      </div>
                      <h2 style={{ fontWeight: 700, fontSize: "1.25rem" }}>{currentLesson?.title}</h2>
                      {currentLesson?.summary && (
                        <p style={{ color: "var(--text-2)", fontSize: "0.875rem", marginTop: "0.5rem", lineHeight: 1.55, maxWidth: "640px" }}>
                          {currentLesson.summary}
                        </p>
                      )}
                    </div>
                    {course.lessons.length > 1 && (
                      <div style={{ display: "flex", gap: "0.375rem", flexShrink: 0 }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setLessonIdx(i => Math.max(0, i - 1))}
                          disabled={lessonIdx === 0}
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setLessonIdx(i => Math.min(course.lessons.length - 1, i + 1))}
                          disabled={lessonIdx === course.lessons.length - 1}
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Render HTML content from course data */}
                  {currentLesson?.content && (
                    <div
                      className="md-content"
                      dangerouslySetInnerHTML={{ __html: currentLesson.content }}
                      style={{ lineHeight: 1.75 }}
                    />
                  )}

                  {/* Per-lesson knowledge check */}
                  {currentLesson?.quizzes && currentLesson.quizzes.length > 0 && (
                    <div style={{ marginTop: "2.5rem", paddingTop: "2rem", borderTop: "1px solid var(--border)" }}>
                      <div className="label-mono" style={{ fontSize: "0.65rem", marginBottom: "0.5rem" }}>
                        ◈ LESSON {lessonIdx + 1} — KNOWLEDGE CHECK
                      </div>
                      <p style={{ color: "var(--text-2)", fontSize: "0.8125rem", marginBottom: "1.25rem" }}>
                        Answer all {Math.min(LESSON_QUIZ_COUNT, currentLesson.quizzes.length)} questions. Score 70%+ to bank this lesson's XP. The full question bank is used in the Final Exam.
                      </p>
                      <QuizBlock
                        key={`lesson-${lessonIdx}`}
                        questions={currentLesson.quizzes.slice(0, LESSON_QUIZ_COUNT)}
                        courseId={course.id}
                        onPass={(score) => {
                          if (!lessonQuizDone[lessonIdx]) {
                            setLessonQuizDone(prev => ({ ...prev, [lessonIdx]: true }));
                            onAddXp(score * 15, `Lesson ${lessonIdx + 1} passed: ${currentLesson.title}`);
                          }
                          if (lessonIdx < course.lessons.length - 1) {
                            onNotify("Lesson complete — advancing to the next lesson.", "success");
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Theory & Quiz ────────────────────────────── */}
          {tab === "theory" && (
            <motion.div
              key="theory"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ flex: 1, overflowY: "auto", padding: "1.75rem" }}
            >
              <div style={{ maxWidth: "720px" }}>
                <div style={{ marginBottom: "1.5rem" }}>
                  <div className="label-mono" style={{ fontSize: "0.65rem", marginBottom: "0.5rem" }}>◈ FINAL EXAM</div>
                  <h2 style={{ fontWeight: 700, fontSize: "1.25rem", marginBottom: "0.375rem" }}>
                    {course.title}
                  </h2>
                  <p style={{ color: "var(--text-2)", fontSize: "0.875rem" }}>
                    {course.lessons.length > 2
                      ? `A ${finalExam.length}-question comprehensive exam drawn across all ${course.lessons.length} lessons. Score 70%+ to certify your mastery and unlock the Practice Lab.`
                      : "Complete the assessment to unlock the Practice Lab. Score 70% or higher to pass."}
                  </p>
                </div>

                {finalExam.length > 0 ? (
                  <QuizBlock
                    questions={finalExam}
                    courseId={course.id}
                    onPass={(score) => {
                      onAddXp(score * 20, `Final exam passed for ${course.title}`);
                      onNotify(`Final exam passed! ${score}/${finalExam.length} correct`, "success");
                      setQuizPassed(true);
                    }}
                  />
                ) : (
                  <div className="glass" style={{ padding: "2rem", textAlign: "center", color: "var(--text-3)" }}>
                    No quiz questions available for this course yet.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── Practice Lab ─────────────────────────────── */}
          {tab === "practice" && (
            <motion.div
              key="practice"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
            >
              {/* VM Control bar */}
              <div style={{
                padding: "0.875rem 1.5rem",
                borderBottom: "1px solid var(--border)",
                display: "flex", alignItems: "center", gap: "1rem",
                flexShrink: 0, background: "rgba(255,255,255,0.01)",
              }}>
                {/* VM Status */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div className={
                    vmStatus === "running"     ? "dot-online" :
                    vmStatus === "provisioning" ? "dot-pending" : "dot-offline"
                  } />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-2)" }}>
                    {vmStatus === "running"      ? `Container online — ${vmIP}:${vmPort}` :
                     vmStatus === "provisioning" ? "Provisioning container…" :
                     "Container offline"}
                  </span>
                  {vmStatus === "provisioning" && (
                    <Loader size={13} style={{ color: "var(--accent)", animation: "spin 1s linear infinite" }} />
                  )}
                </div>

                <div style={{ flex: 1 }} />

                {/* VM Controls */}
                {vmStatus === "off" && (
                  <button className="btn btn-accent btn-sm" onClick={onProvisionVM}>
                    <Play size={13} /> Start Container
                  </button>
                )}
                {vmStatus === "running" && (
                  <button className="btn btn-danger btn-sm" onClick={onShutdownVM}>
                    <Power size={13} /> Shutdown
                  </button>
                )}

                {/* Flag submission */}
                {vmStatus === "running" && (
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      onSubmitFlag(flagInput);
                      setFlagInput("");
                    }}
                    style={{ display: "flex", gap: "0.375rem" }}
                  >
                    <input
                      className="input-field"
                      value={flagInput}
                      onChange={e => setFlagInput(e.target.value)}
                      placeholder="ARCHX_…_CTF_…"
                      style={{ width: "220px", fontSize: "0.8125rem", fontFamily: "var(--font-mono)" }}
                    />
                    <button type="submit" className="btn btn-outline btn-sm" disabled={!flagInput.trim()}>
                      <Flag size={13} /> Submit Flag
                    </button>
                  </form>
                )}
              </div>

              {/* Terminal (takes remaining height) */}
              <div style={{ flex: 1, overflow: "hidden", padding: "1rem" }}>
                <div style={{ height: "100%" }}>
                  <Terminal
                    history={terminalHistory}
                    vmStatus={vmStatus}
                    vmIP={vmIP}
                    vmPort={vmPort}
                    username={userProfile.username}
                    courseTitle={course.title}
                    onCommand={onCommand}
                    onClear={onClearTerminal}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─── Courses Page (router) ────────────────────────────────────── */
export default function CoursesPage(props: CoursesPageProps) {
  const { selectedCourse, onSelectCourse } = props;

  if (selectedCourse) {
    return (
      <CourseWorkspace
        course={selectedCourse}
        userProfile={props.userProfile}
        vmStatus={props.vmStatus}
        vmIP={props.vmIP}
        vmPort={props.vmPort}
        vmFlag={props.vmFlag}
        terminalHistory={props.terminalHistory}
        onCommand={props.onCommand}
        onClearTerminal={props.onClearTerminal}
        onProvisionVM={props.onProvisionVM}
        onShutdownVM={props.onShutdownVM}
        onSubmitFlag={props.onSubmitFlag}
        onAddXp={props.onAddXp}
        onNotify={props.onNotify}
        onBack={() => onSelectCourse(null)}
      />
    );
  }

  return (
    <CourseGrid
      userProfile={props.userProfile}
      onSelectCourse={onSelectCourse}
    />
  );
}
