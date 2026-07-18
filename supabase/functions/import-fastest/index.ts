import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Difficulty = "easy" | "medium" | "hard";

function difficulty(value: any, index = 0): Difficulty {
  const v = String(value ?? "").toLowerCase();
  if (v === "easy" || v === "medium" || v === "hard") return v;
  return (["easy", "medium", "hard"] as Difficulty[])[index % 3];
}

function points(d: Difficulty) {
  if (d === "hard") return 50;
  if (d === "medium") return 30;
  return 15;
}

function timeLimit(d: Difficulty) {
  if (d === "hard") return 8;
  if (d === "medium") return 10;
  return 15;
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

async function fastestExists(apiId: string, source: string) {
  const supabase = supabaseAdmin();

  const { data, error } = await supabase
    .from("fastest")
    .select("id")
    .eq("api_id", apiId)
    .eq("source", source)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

async function insertFastest(item: any) {
  const supabase = supabaseAdmin();

  const { error } = await supabase
    .from("fastest")
    .insert(item);

  if (error) throw error;
}

async function fetchOpenTrivia(amount: number, language: "ar" | "en") {
  const res = await fetch(
    `https://opentdb.com/api.php?amount=${amount}&type=multiple`
  );

  const data = await res.json();

  return (data.results ?? []).map((item: any, index: number) => {
    const correct = decodeHtml(String(item.correct_answer ?? ""));

    const options = shuffle([
      correct,
      ...(item.incorrect_answers ?? []).map((x: string) =>
        decodeHtml(String(x))
      ),
    ]);

    const d = difficulty(item.difficulty, index);

    return {
      question: decodeHtml(String(item.question ?? "")),
      option_a: options[0] ?? "",
      option_b: options[1] ?? "",
      option_c: options[2] ?? "",
      option_d: options[3] ?? "",
      correct_answer: correct,
      difficulty: d,
      points: points(d),
      time_limit: timeLimit(d),
      active: true,
      language,
      source: "open_trivia",
      api_id: `open_trivia-fastest-${item.question}`,
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
    const body =
      req.method === "GET"
        ? {}
        : await req.json().catch(() => ({}));

    const amount = Number(body.amount ?? 10);
    const language = body.language ?? "en";

    const questions = await fetchOpenTrivia(amount, language);

    let imported = 0;
    let skipped = 0;

    for (const item of questions) {
      if (await fastestExists(item.api_id, item.source)) {
        skipped++;
        continue;
      }

      await insertFastest(item);
      imported++;
    }

    return Response.json(
      {
        success: true,
        source: "open_trivia",
        imported,
        skipped,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});