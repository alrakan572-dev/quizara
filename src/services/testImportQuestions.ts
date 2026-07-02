import { importFromOpenTrivia } from "./questionService";

export async function testImportQuestions() {
  const result = await importFromOpenTrivia(5);

  console.log("Imported Questions:", result);
}