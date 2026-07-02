export function checkAnswer(
  selectedAnswer: string,
  correctAnswer: string
) {
  return selectedAnswer.trim().toLowerCase() ===
    correctAnswer.trim().toLowerCase();
}