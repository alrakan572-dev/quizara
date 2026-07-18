import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Difficulty = "easy" | "medium" | "hard";

function points(d: Difficulty) {
  if (d === "hard") return 50;
  if (d === "medium") return 30;
  return 15;
}

function difficulty(value: any, index = 0): Difficulty {
  const v = String(value ?? "").toLowerCase();
  if (v === "easy" || v === "medium" || v === "hard") return v;
  return (["easy", "medium", "hard"] as Difficulty[])[index % 3];
}

function decodeHtml(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function shuffle<T>(arr: T[]) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function supabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

async function exists(apiId: string, source: string) {
  const supabase = supabaseAdmin();

  const { data, error } = await supabase
    .from("questions")
    .select("id")
    .eq("api_id", apiId)
    .eq("source", source)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

async function insertQuestion(question: any) {
  const supabase = supabaseAdmin();

  const { error } = await supabase.from("questions").insert(question);

  if (error) throw error;
}

async function fetchOpenTrivia(amount: number, language: "ar" | "en") {
  const res = await fetch(`https://opentdb.com/api.php?amount=${amount}&type=multiple`);
  const data = await res.json();

  return (data.results ?? []).map((item: any, index: number) => {
    const correct = decodeHtml(String(item.correct_answer ?? ""));
    const options = shuffle([
      correct,
      ...(item.incorrect_answers ?? []).map((x: string) => decodeHtml(String(x))),
    ]);

    const correctIndex = options.findIndex((x) => x === correct);
    const correctAnswer = ["A", "B", "C", "D"][correctIndex] ?? "A";
    const d = difficulty(item.difficulty, index);

    return {
      question: decodeHtml(String(item.question ?? "")),
      option_a: options[0] ?? "",
      option_b: options[1] ?? "",
      option_c: options[2] ?? "",
      option_d: options[3] ?? "",
      correct_answer: correctAnswer,
      difficulty: d,
      points: points(d),
      active: true,
      category: item.category ?? "general",
      source: "open_trivia",
      api_id: `open_trivia-${item.question}`,
      language,
      used_count: 0,
      imported_at: new Date().toISOString(),
    };
  });
}

async function fetchTheTrivia(amount: number, language: "ar" | "en") {
  const res = await fetch(`https://the-trivia-api.com/v2/questions?limit=${amount}`);
  const data = await res.json();

  return (Array.isArray(data) ? data : []).map((item: any, index: number) => {
    const correct = String(item.correctAnswer ?? "");
    const options = shuffle([correct, ...(item.incorrectAnswers ?? [])]);

    const correctIndex = options.findIndex((x) => x === correct);
    const correctAnswer = ["A", "B", "C", "D"][correctIndex] ?? "A";
    const d = difficulty(item.difficulty, index);

    return {
      question: String(item.question?.text ?? item.question ?? ""),
      option_a: options[0] ?? "",
      option_b: options[1] ?? "",
      option_c: options[2] ?? "",
      option_d: options[3] ?? "",
      correct_answer: correctAnswer,
      difficulty: d,
      points: points(d),
      active: true,
      category: Array.isArray(item.categories) ? item.categories[0] ?? "general" : "general",
      source: "the_trivia",
      api_id: `the_trivia-${item.id ?? item.question?.text ?? item.question}`,
      language,
      used_count: 0,
      imported_at: new Date().toISOString(),
    };
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = req.method === "GET" ? {} : await req.json().catch(() => ({}));
    const amount = Number(body.amount ?? 10);
    const language = body.language ?? "en";

    const sources = [
      () => fetchOpenTrivia(amount, language),
      () => fetchTheTrivia(amount, language),
    ];

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const load of sources) {
      try {
        const questions = await load();

        for (const question of questions) {
          if (await exists(question.api_id, question.source)) {
            skipped++;
            continue;
          }

          await insertQuestion(question);
          imported++;
        }
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }
    }

    return Response.json(
      { success: imported > 0, imported, skipped, errors },
      { headers: corsHeaders }
    );
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500, headers: corsHeaders }
    );
  }
});