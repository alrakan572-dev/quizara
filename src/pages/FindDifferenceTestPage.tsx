import { useFindDifference } from "../hooks/useFindDifference";

export function FindDifferenceTestPage() {
  const {
    image,
    loading,
    finishing,
    result,
    foundCount,
    loadImage,
    addFoundDifference,
    finishGame,
  } = useFindDifference(123456789, "en");

  if (loading) {
    return (
      <div style={{ color: "white", padding: 20 }}>
        Loading Find Difference...
      </div>
    );
  }

  if (!image) {
    return (
      <div style={{ color: "white", padding: 20 }}>
        <h2>No Image Found</h2>
        <button onClick={loadImage}>Reload</button>
      </div>
    );
  }

  return (
    <div style={{ color: "white", padding: 20 }}>
      <h2>Find Difference Test</h2>

      <p>
        Found: {foundCount} / {image.differences_count}
      </p>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <img
          src={image.image_1_url}
          alt="Image 1"
          style={{ width: "45%", borderRadius: 10 }}
        />

        <img
          src={image.image_2_url}
          alt="Image 2"
          style={{ width: "45%", borderRadius: 10 }}
        />
      </div>

      <button onClick={addFoundDifference}>
        Add Found Difference +1
      </button>

      <br />
      <br />

      <button onClick={finishGame} disabled={finishing}>
        Finish Game
      </button>

      <br />
      <br />

      <button onClick={loadImage}>
        Next Image
      </button>

      {result && (
        <div style={{ marginTop: 30 }}>
          <h3>
            {result.isCorrect ? "Completed ✅" : "Not Completed ❌"}
          </h3>

          <p>Required: {result.requiredCount}</p>
          <p>Found: {result.foundCount}</p>
          <p>Earned Points: {result.earnedPoints}</p>
        </div>
      )}
    </div>
  );
}