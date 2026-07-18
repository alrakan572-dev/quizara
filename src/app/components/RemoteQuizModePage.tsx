import { useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, CheckCircle2, ChevronRight, Clock, Flame, Star, XCircle } from "lucide-react";
import type { AppLanguage, GameType } from "../../api";
import { useGame } from "../../hooks/useGame";

interface Props {
  title: string;
  emoji: string;
  accent: string;
  type: Exclude<GameType, "find_difference">;
  onBack: () => void;
  userPoints: number;
  onPointsUpdate: (points: number) => void;
  language?: AppLanguage;
  timeSeconds?: number;
  questionLimit?: number;
}

export function RemoteQuizModePage({
  title,
  emoji,
  accent,
  type,
  onBack,
  userPoints,
  onPointsUpdate,
  language = "en",
  timeSeconds = 20,
  questionLimit = 10,
}: Props) {
  const game = useGame({
    type,
    language,
    questionLimit,
    defaultTimeSeconds: timeSeconds,
  });

  const answers = useMemo(
    () => [
      game.currentQuestion?.option_a,
      game.currentQuestion?.option_b,
      game.currentQuestion?.option_c,
      game.currentQuestion?.option_d,
    ].filter((value): value is string => typeof value === "string" && value.trim().length > 0),
    [game.currentQuestion],
  );

  if (game.loading && !game.currentQuestion) {
    return <StatusCard emoji={emoji} title={`Loading ${title}...`} message="Preparing the next challenge." accent={accent} />;
  }

  if (game.error && !game.currentQuestion) {
    return <StatusCard emoji="⚠️" title="Unable to load" message={game.error.message} accent={accent} onBack={onBack} onAction={() => void game.retry()} />;
  }

  if (game.finished) {
    if (game.empty && game.currentIndex === 0) {
      return <StatusCard emoji="📭" title="No content available" message="There is no active content for this language right now." accent={accent} onBack={onBack} />;
    }
    const total = Math.max(game.currentIndex + (game.lastResult ? 1 : 0), 1);
    const accuracy = Math.round((game.correctCount / total) * 100);
    return (
      <div className="flex min-h-[480px] flex-col items-center justify-center gap-5 text-center">
        <motion.div initial={{ scale: 0.4 }} animate={{ scale: 1 }} className="flex h-24 w-24 items-center justify-center rounded-3xl text-5xl" style={{ background: `${accent}25`, border: `2px solid ${accent}66`, boxShadow: `0 0 42px ${accent}33` }}>
          {accuracy >= 70 ? "🏆" : "💪"}
        </motion.div>
        <div>
          <h2 style={{ color: accent, fontFamily: "'Rajdhani', sans-serif", fontWeight: 800, fontSize: "1.6rem" }}>{title} Complete</h2>
          <p style={{ color: "#9CA3AF" }}>{game.correctCount}/{total} correct · {accuracy}% accuracy</p>
        </div>
        <div className="grid w-full grid-cols-2 gap-3">
          <Stat label="Points" value={`+${game.score}`} icon="🪙" />
          <Stat label="Correct" value={String(game.correctCount)} icon="✅" />
        </div>
        <button type="button" onClick={() => void game.restart()} className="w-full rounded-2xl py-3.5" style={{ background: `linear-gradient(135deg, ${accent}, #6D28D9)`, color: "white", fontWeight: 800 }}>PLAY AGAIN</button>
        <button type="button" onClick={onBack} className="w-full rounded-2xl py-3" style={{ background: `${accent}12`, border: `1px solid ${accent}55`, color: accent }}>BACK TO HOME</button>
      </div>
    );
  }

  const question = game.currentQuestion;
  if (!question) return <StatusCard emoji="⚠️" title="Content unavailable" message="The next item could not be loaded." accent={accent} onBack={onBack} />;

  const isAnswered = Boolean(game.lastResult);
  const correctAnswer = game.lastResult?.correct_answer ?? null;
  const timeLimit = Number(question.time_limit) > 0 ? Number(question.time_limit) : timeSeconds;
  const timerPct = Math.max(0, Math.min((game.timeLeft / timeLimit) * 100, 100));
  const timerColor = game.timeLeft > timeLimit * 0.55 ? accent : game.timeLeft > timeLimit * 0.25 ? "#FBBF24" : "#F87171";

  async function next() {
    if (game.lastResult?.user?.points !== undefined) onPointsUpdate(game.lastResult.user.points);
    await game.goNextQuestion();
  }

  return (
    <div className="flex flex-col gap-4 pb-2">
      <div className="flex items-center justify-between">
        <motion.button type="button" whileTap={{ scale: 0.93 }} onClick={onBack} className="flex items-center gap-1.5 rounded-xl px-3 py-2" style={{ background: `${accent}14`, border: `1px solid ${accent}55`, color: accent }}>
          <ArrowLeft size={15} /> Back
        </motion.button>
        <div className="flex items-center gap-2">
          <Badge icon={<Flame size={12} />} value={String(game.correctCount)} color="#F97316" />
          <Badge icon={<Star size={12} />} value={`+${game.score}`} color="#FBBF24" />
        </div>
      </div>

      <div className="rounded-2xl px-4 py-3" style={{ background: `linear-gradient(135deg, ${accent}22, #111827)`, border: `1px solid ${accent}55` }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><span className="text-xl">{emoji}</span><strong style={{ color: "#F9FAFB", fontFamily: "'Rajdhani', sans-serif" }}>{title.toUpperCase()}</strong></div>
          <span style={{ color: accent, fontSize: "0.72rem", fontWeight: 700 }}>{String(question.difficulty ?? "easy").toUpperCase()}</span>
        </div>
        <div className="mt-2 flex justify-between text-xs" style={{ color: "#9CA3AF" }}><span>Q{game.currentIndex + 1}/{game.questionLimit}</span><span>{userPoints.toLocaleString()} XP</span></div>
      </div>

      <div className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: "#0F1C3A", border: `1.5px solid ${timerColor}66` }}>
        <Clock size={15} style={{ color: timerColor }} />
        <div className="h-2 flex-1 rounded-full" style={{ background: "rgba(255,255,255,.07)" }}><motion.div animate={{ width: `${timerPct}%` }} className="h-full rounded-full" style={{ background: timerColor }} /></div>
        <strong style={{ color: timerColor }}>{game.timeLeft}s</strong>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={question.id} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="rounded-2xl px-5 py-5" style={{ background: "linear-gradient(145deg,#0F1C3A,#1A1040)", border: `1.5px solid ${accent}44`, boxShadow: `0 0 28px ${accent}18` }}>
          <p style={{ color: "#F9FAFB", lineHeight: 1.65, margin: 0 }}>{String(question.question ?? "")}</p>
        </motion.div>
      </AnimatePresence>

      <div className="flex flex-col gap-2.5">
        {answers.map((answer, index) => {
          const selected = game.selectedAnswer === answer;
          const correct = isAnswered && correctAnswer !== null && normalize(answer) === normalize(correctAnswer);
          const wrong = isAnswered && selected && !correct;
          const dim = isAnswered && !correct && !wrong;
          return (
            <motion.button type="button" key={`${answer}-${index}`} whileTap={!isAnswered ? { scale: .98 } : {}} disabled={isAnswered || game.submitting} onClick={() => void game.submitAnswer(answer)} className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left" style={{
              background: correct ? "rgba(16,185,129,.16)" : wrong ? "rgba(248,113,113,.16)" : dim ? "#0a1122" : "linear-gradient(135deg,#0F1C3A,#111827)",
              border: `1.5px solid ${correct ? "#10B981" : wrong ? "#F87171" : `${accent}35`}`,
              color: correct ? "#6EE7B7" : wrong ? "#FCA5A5" : dim ? "#4B5563" : "#D1D5DB",
            }}>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: `${accent}18`, color: accent }}>{["A","B","C","D"][index]}</span>
              <span className="flex-1">{answer}</span>
              {correct && <CheckCircle2 size={16} style={{ color: "#10B981" }} />}
              {wrong && <XCircle size={16} style={{ color: "#F87171" }} />}
            </motion.button>
          );
        })}
      </div>

      {game.error && <div className="rounded-xl px-4 py-3 text-center" style={{ background: "rgba(248,113,113,.1)", color: "#FCA5A5" }}>{game.error.message}</div>}

      {isAnswered && (
        <motion.button type="button" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} onClick={() => void next()} className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5" style={{ background: `linear-gradient(135deg,${accent},#6D28D9)`, color: "white", fontWeight: 800 }}>
          {game.currentIndex + 1 >= game.questionLimit ? "SEE RESULTS" : "NEXT QUESTION"}<ChevronRight size={16} />
        </motion.button>
      )}
    </div>
  );
}

function normalize(value: string) { return value.trim().toLowerCase(); }
function Badge({ icon, value, color }: { icon: React.ReactNode; value: string; color: string }) { return <div className="flex items-center gap-1 rounded-xl px-2.5 py-1.5" style={{ background: `${color}18`, border: `1px solid ${color}44`, color }}>{icon}<strong>{value}</strong></div>; }
function Stat({ label, value, icon }: { label: string; value: string; icon: string }) { return <div className="rounded-2xl py-4 text-center" style={{ background: "#1F2937", color: "white" }}><div className="text-xl">{icon}</div><strong>{value}</strong><div style={{ color: "#9CA3AF", fontSize: ".7rem" }}>{label}</div></div>; }
function StatusCard({ emoji, title, message, accent, onAction, onBack }: { emoji: string; title: string; message: string; accent: string; onAction?: () => void; onBack?: () => void }) { return <div className="flex min-h-[440px] items-center justify-center"><div className="w-full rounded-2xl px-6 py-6 text-center" style={{ background: "#0F1C3A", color: "white", border: `1px solid ${accent}44` }}><div className="text-4xl">{emoji}</div><h2>{title}</h2><p style={{ color: "#9CA3AF" }}>{message}</p>{onAction && <button type="button" onClick={onAction} className="mt-3 w-full rounded-xl py-3" style={{ background: accent, color: "white" }}>TRY AGAIN</button>}{onBack && <button type="button" onClick={onBack} className="mt-3 w-full rounded-xl py-3" style={{ background: `${accent}18`, color: accent }}>BACK TO HOME</button>}</div></div>; }
