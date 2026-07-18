import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

function differencesCount(d: Difficulty) {
  if (d === "hard") return 7;
  if (d === "medium") return 5;
  return 3;
}

function supabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

async function findExistingImage(apiId: string, source: string) {
  const supabase = supabaseAdmin();

  const { data, error } = await supabase
    .from("find_the_difference")
    .select("id")
    .eq("api_id", apiId)
    .eq("source", source)
    .maybeSingle();

  if (error) throw error;

  return data;
}

async function uploadImageToStorage(params: {
  imageUrl: string;
  filePath: string;
}) {
  const supabase = supabaseAdmin();

  const response = await fetch(params.imageUrl);

  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }

  const imageBlob = await response.blob();

  const { error } = await supabase.storage
    .from("find-difference")
    .upload(params.filePath, imageBlob, {
      contentType: imageBlob.type || "image/jpeg",
      upsert: true,
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from("find-difference")
    .getPublicUrl(params.filePath);

  return data.publicUrl;
}

async function saveImageChallenge(item: any) {
  const supabase = supabaseAdmin();

  const existing = await findExistingImage(item.api_id, item.source);

  if (existing?.id) {
    const { error } = await supabase
      .from("find_the_difference")
      .update(item)
      .eq("id", existing.id);

    if (error) throw error;

    return "updated";
  }

  const { error } = await supabase
    .from("find_the_difference")
    .insert(item);

  if (error) throw error;

  return "inserted";
}

async function fetchPexelsImages(params: {
  amount: number;
  query: string;
  page: number;
}) {
  const apiKey = Deno.env.get("PEXELS_API_KEY");

  if (!apiKey) {
    throw new Error("Missing PEXELS_API_KEY");
  }

  const url = new URL("https://api.pexels.com/v1/search");
  url.searchParams.set("query", params.query);
  url.searchParams.set("per_page", String(params.amount));
  url.searchParams.set("page", String(params.page));

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: apiKey,
    },
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Pexels error: ${res.status} - ${text}`);
  }

  const data = JSON.parse(text);

  return data.photos ?? [];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const urlParams = new URL(req.url).searchParams;

    const body =
      req.method === "GET" ? {} : await req.json().catch(() => ({}));

    const amount = Number(body.amount ?? urlParams.get("amount") ?? 10);
    const query = String(body.query ?? urlParams.get("query") ?? "nature");
    const language = String(body.language ?? urlParams.get("language") ?? "en");
    const page = Number(body.page ?? urlParams.get("page") ?? 1);

    const force =
      body.force === true ||
      urlParams.get("force") === "1" ||
      urlParams.get("force") === "true";

    const photos = await fetchPexelsImages({
      amount,
      query,
      page,
    });

    let imported = 0;
    let updated = 0;
    let skipped = 0;

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const apiId = `pexels-${photo.id}`;

      const existing = await findExistingImage(apiId, "pexels");

      if (existing && !force) {
        skipped++;
        continue;
      }

      const d = difficulty(i);

      const originalPath = `${apiId}/image_1.jpg`;
      const editedPath = `${apiId}/image_2.jpg`;

      const originalUrl = await uploadImageToStorage({
        imageUrl: photo.src.large,
        filePath: originalPath,
      });

      const editedUrl = await uploadImageToStorage({
        imageUrl: photo.src.large,
        filePath: editedPath,
      });

      const result = await saveImageChallenge({
        image_1_url: originalUrl,
        image_2_url: editedUrl,
        differences_count: differencesCount(d),
        differences_data: [],
        difficulty: d,
        points: points(d),
        active: true,
        language,
        source: "pexels",
        api_id: apiId,
        used_count: 0,
        imported_at: new Date().toISOString(),
      });

      if (result === "updated") {
        updated++;
      } else {
        imported++;
      }
    }

    return Response.json(
      {
        success: true,
        source: "pexels",
        imported,
        updated,
        skipped,
        page,
        query,
        force,
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        message: error?.message ?? String(error),
        code: error?.code ?? null,
        details: error?.details ?? null,
        hint: error?.hint ?? null,
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});