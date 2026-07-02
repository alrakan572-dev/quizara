import { useGame } from "../hooks/useGame";

export function GameTestPage() {
  const {
    currentQuestion,
    currentIndex,
    score,
    finished,
    loading,
    lastResult,
    submitAnswer,
  } = useGame(5);

  if (loading) {
    return <div style={{ color: "white", padding: 20 }}>Loading questions...</div>;
  }

  if (!currentQuestion) {
    return <div style={{ color: "white", padding: 20 }}>No questions found.</div>;
  }

  if (finished) {
    return (
      <div style={{ color: "white", padding: 20 }}>
        <h2>Game Finished</h2>
        <p>Final Score: {score}</p>
      </div>
    );
  }

  const options = [
    currentQuestion.option_a,
    currentQuestion.option_b,
    currentQuestion.option_c,
    currentQuestion.option_d,
  ];

  return (
    <div style={{ color: "white", padding: 20 }}>
      <h2>Question {currentIndex + 1}</h2>

      <p>{currentQuestion.question}</p>

      {options.map((option) => (
        <button
          key={option}
          onClick={() => submitAnswer(option)}
          style={{
            display: "block",
            width: "100%",
            marginBottom: 10,
            padding: 12,
            borderRadius: 10,
          }}
        >
          {option}
        </button>
      ))}

      <p>Score: {score}</p>

      {lastResult && (
        <p>
          {lastResult.isCorrect ? "Correct ✅" : "Wrong ❌"} — Correct answer:{" "}
          {lastResult.correctAnswer}
        </p>
      )}
    </div>
  );
}