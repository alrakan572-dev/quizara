import { getQuestions } from "../src/services/questionService";

export async function testQuestions() {
  const result = await getQuestions();

  console.log(result);
}