import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Difficulty = "easy" | "medium" | "hard";

function difficulty(index: number): Difficulty {
  return (["easy", "medium", "hard"] as Difficulty[])[index % 3];
}

function points(d: Difficulty) {
  if (d === "hard") return 50;
  if (d === "medium") return 30;
  return 15;
}

function supabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

async function riddleExists(apiId: string, source: string) {
  const supabase = supabaseAdmin();

  const { data, error } = await supabase
    .from("riddles")
    .select("id")
    .eq("api_id", apiId)
    .eq("source", source)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

async function insertRiddle(riddle: any) {
  const supabase = supabaseAdmin();

  const { error } = await supabase.from("riddles").insert(riddle);

  if (error) throw error;
}

async function fetchOneRiddle(index: number, language: "ar" | "en") {
  const apiKey = Deno.env.get("API_NINJAS_KEY");

  if (!apiKey) {
    throw new Error("Missing API_NINJAS_KEY");
  }

  const res = await fetch("https://api.api-ninjas.com/v1/riddles", {
    headers: {
      "X-Api-Key": apiKey,
    },
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`API Ninjas error: ${res.status} - ${text}`);
  }

  const data = JSON.parse(text);
  const item = data?.[0];

  if (!item) return null;

  const d = difficulty(index);

  return {
    question: String(item.question ?? ""),
    correct_answer: String(item.answer ?? ""),
    difficulty: d,
    points: points(d),
    active: true,
    language,
    source: "api_ninjas",
    api_id: `api_ninjas-${item.title ?? item.question}`,
    used_count: 0,
    imported_at: new Date().toISOString(),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = req.method === "GET" ? {} : await req.json().catch(() => ({}));
    const amount = Number(body.amount ?? 10);
    const language = body.language ?? "en";

    let imported = 0;
    let skipped = 0;

    for (let i = 0; i < amount; i++) {
      const riddle = await fetchOneRiddle(i, language);

      if (!riddle) continue;

      if (await riddleExists(riddle.api_id, riddle.source)) {
        skipped++;
        continue;
      }

      await insertRiddle(riddle);
      imported++;
    }

    return Response.json(
      { success: true, source: "api_ninjas", imported, skipped },
      { headers: corsHeaders }
    );
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500, headers: corsHeaders }
    );
  }
});