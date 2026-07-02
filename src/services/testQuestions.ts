import { getQuestions } from "./questionService";

export async function testQuestions() {
  const result = await getQuestions();

  console.log(result);
}