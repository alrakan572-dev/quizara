import { useState } from "react";
import { useRiddles } from "../hooks/useRiddles";

export function RiddlesTestPage() {
  const {
    riddle,
    loading,
    answering,
    result,
    loadRiddle,
    submitAnswer,
  } = useRiddles(123456789, "en");

  const [answer, setAnswer] = useState("");

  if (loading) {
    return (
      <div style={{ color: "white", padding: 20 }}>
        Loading Riddle...
      </div>
    );
  }

  if (!riddle) {
    return (
      <div style={{ color: "white", padding: 20 }}>
        <h2>No Riddle Found</h2>

        <button onClick={loadRiddle}>
          Reload
        </button>
      </div>
    );
  }

  return (
    <div style={{ color: "white", padding: 20 }}>

      <h2>Riddle Test</h2>

      <h3>{riddle.question}</h3>

      <input
        type="text"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Type your answer..."
        style={{
          width: "100%",
          padding: 10,
          marginTop: 20,
        }}
      />

      <br />
      <br />

      <button
        disabled={answering}
        onClick={() => submitAnswer(answer)}
      >
        Submit Answer
      </button>

      <button
        style={{ marginLeft: 10 }}
        onClick={() => {
          setAnswer("");
          loadRiddle();
        }}
      >
        Next Riddle
      </button>

      {result && (
        <div style={{ marginTop: 30 }}>

          <h3>
            {result.isCorrect
              ? "Correct ✅"
              : "Wrong ❌"}
          </h3>

          <p>
            Correct Answer:
            {" "}
            {result.correctAnswer}
          </p>

          <p>
            Earned Points:
            {" "}
            {result.earnedPoints}
          </p>

        </div>
      )}

    </div>
  );
}