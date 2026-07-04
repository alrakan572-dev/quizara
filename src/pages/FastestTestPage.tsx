import { useFastest } from "../hooks/useFastest";

export function FastestTestPage() {
  const {
    question,
    loading,
    answering,
    result,
    loadQuestion,
    submitAnswer,
  } = useFastest(123456789, "en");

  if (loading) {
    return (
      <div style={{ color: "white", padding: 20 }}>
        Loading Fastest Question...
      </div>
    );
  }

  if (!question) {
    return (
      <div style={{ color: "white", padding: 20 }}>
        <h2>No Fastest Question Found</h2>
        <button onClick={loadQuestion}>Reload</button>
      </div>
    );
  }

  const options = [
    question.option_a,
    question.option_b,
    question.option_c,
    question.option_d,
  ];

  return (
    <div style={{ color: "white", padding: 20 }}>
      <h2>Fastest Test</h2>

      <h3>{question.question}</h3>

      {options.map((option) => (
        <button
          key={option}
          disabled={answering}
          onClick={() => submitAnswer(option)}
          style={{
            display: "block",
            width: "100%",
            padding: 12,
            marginBottom: 10,
          }}
        >
          {option}
        </button>
      ))}

      <button onClick={loadQuestion}>Next Question</button>

      {result && (
        <div style={{ marginTop: 30 }}>
          <h3>{result.isCorrect ? "Correct ✅" : "Wrong ❌"}</h3>
          <p>Correct Answer: {result.correctAnswer}</p>
          <p>Earned Points: {result.earnedPoints}</p>
        </div>
      )}
    </div>
  );
}