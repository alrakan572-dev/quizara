import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-import-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

type Difficulty = "easy" | "medium" | "hard";
type Language = "ar" | "en";

type DifferencePoint = {
  id: number;
  x: number;
  y: number;
  radius: number;
  label?: string;
};

type ChallengeInput = {
  external_id: string;
  source?: string;
  image_1_url: string;
  image_2_url: string;
  differences: unknown;
  difficulty?: Difficulty;
  language?: Language;
  active?: boolean;
  time_limit?: number;
};

const MAX_BATCH_SIZE = 25;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  });
}

function supabaseAdmin() {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase server environment is incomplete");
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function requireImportSecret(req: Request): void {
  const expected = Deno.env.get("IMPORT_IMAGES_SECRET");
  const received = req.headers.get("x-import-secret");

  if (!expected) {
    throw new Error("IMPORT_IMAGES_SECRET is not configured");
  }

  if (!received || received !== expected) {
    const error = new Error("Unauthorized image import request");
    error.name = "UNAUTHORIZED";
    throw error;
  }
}

function assertHttpsUrl(value: unknown, field: string): string {
  const url = new URL(String(value ?? ""));

  if (url.protocol !== "https:") {
    throw new Error(`${field} must use HTTPS`);
  }

  return url.toString();
}

function normalizeDifficulty(value: unknown): Difficulty {
  if (value === undefined || value === null || value === "") return "medium";
  if (value === "easy" || value === "medium" || value === "hard") return value;
  throw new Error("difficulty must be easy, medium, or hard");
}

function normalizeLanguage(value: unknown): Language {
  if (value === undefined || value === null || value === "") return "en";
  if (value === "ar" || value === "en") return value;
  throw new Error("language must be ar or en");
}

function normalizeCoordinate(value: unknown, field: string): number {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    throw new Error(`${field} must be a finite number`);
  }

  const percent = numeric >= 0 && numeric <= 1 ? numeric * 100 : numeric;

  if (percent < 0 || percent > 100) {
    throw new Error(`${field} must be between 0 and 100`);
  }

  return Number(percent.toFixed(4));
}

function normalizeRadius(value: unknown): number {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    throw new Error("difference radius must be a finite number");
  }

  const percent = numeric > 0 && numeric <= 1 ? numeric * 100 : numeric;

  if (percent < 1.5 || percent > 20) {
    throw new Error("difference radius must be between 1.5 and 20 percent");
  }

  return Number(percent.toFixed(4));
}

function normalizeDifferences(value: unknown): DifferencePoint[] {
  let raw = value;

  if (typeof raw === "string") {
    raw = JSON.parse(raw);
  }

  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const objectValue = raw as Record<string, unknown>;
    raw = objectValue.differences ?? objectValue.hotspots ?? objectValue.points;
  }

  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error("differences must contain at least one hotspot");
  }

  if (raw.length > 20) {
    throw new Error("a challenge cannot contain more than 20 differences");
  }

  const ids = new Set<number>();

  return raw.map((entry, index) => {
    if (!entry || typeof entry !== "object") {
      throw new Error(`difference #${index + 1} is invalid`);
    }

    const point = entry as Record<string, unknown>;
    const id = Number(point.id ?? index + 1);

    if (!Number.isSafeInteger(id) || id <= 0 || ids.has(id)) {
      throw new Error(`difference #${index + 1} has an invalid or duplicate id`);
    }

    ids.add(id);

    const label = typeof point.label === "string"
      ? point.label.trim().slice(0, 120)
      : undefined;

    return {
      id,
      x: normalizeCoordinate(point.x_percent ?? point.x ?? point.left, "difference x"),
      y: normalizeCoordinate(point.y_percent ?? point.y ?? point.top, "difference y"),
      radius: normalizeRadius(point.radius_percent ?? point.radius ?? point.r ?? 5),
      ...(label ? { label } : {}),
    };
  });
}

async function downloadImage(url: string): Promise<{
  bytes: Uint8Array;
  contentType: string;
  hash: string;
}> {
  const response = await fetch(url, { redirect: "follow" });

  if (!response.ok) {
    throw new Error(`Failed to download image (${response.status})`);
  }

  const contentType = String(response.headers.get("content-type") ?? "")
    .split(";")[0]
    .trim()
    .toLowerCase();

  if (!contentType.startsWith("image/")) {
    throw new Error("Downloaded resource is not an image");
  }

  const buffer = await response.arrayBuffer();

  if (buffer.byteLength === 0 || buffer.byteLength > MAX_IMAGE_BYTES) {
    throw new Error("Image size must be between 1 byte and 10 MB");
  }

  const bytes = new Uint8Array(buffer);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hash = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return { bytes, contentType, hash };
}

function extensionForContentType(contentType: string): string {
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  if (contentType === "image/gif") return "gif";
  return "jpg";
}

function safePathSegment(value: string): string {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);

  if (!normalized) throw new Error("external_id is invalid");
  return normalized;
}

async function uploadImage(params: {
  bytes: Uint8Array;
  contentType: string;
  path: string;
}): Promise<string> {
  const supabase = supabaseAdmin();

  const { error } = await supabase.storage
    .from("find-difference")
    .upload(params.path, params.bytes, {
      contentType: params.contentType,
      upsert: true,
    });

  if (error) throw error;

  return supabase.storage
    .from("find-difference")
    .getPublicUrl(params.path).data.publicUrl;
}

async function importChallenge(raw: ChallengeInput) {
  const source = safePathSegment(String(raw.source ?? "external-api"));
  const externalId = safePathSegment(String(raw.external_id ?? ""));
  const originalSourceUrl = assertHttpsUrl(raw.image_1_url, "image_1_url");
  const modifiedSourceUrl = assertHttpsUrl(raw.image_2_url, "image_2_url");

  if (originalSourceUrl === modifiedSourceUrl) {
    throw new Error("image_1_url and image_2_url must be different");
  }

  const differences = normalizeDifferences(raw.differences);
  const difficulty = normalizeDifficulty(raw.difficulty);
  const language = normalizeLanguage(raw.language);
  const timeLimit = Number(raw.time_limit ?? 60);

  if (!Number.isSafeInteger(timeLimit) || timeLimit < 10 || timeLimit > 600) {
    throw new Error("time_limit must be an integer between 10 and 600 seconds");
  }

  const [original, modified] = await Promise.all([
    downloadImage(originalSourceUrl),
    downloadImage(modifiedSourceUrl),
  ]);

  if (original.hash === modified.hash) {
    throw new Error("The original and modified image files are identical");
  }

  const basePath = `${source}/${externalId}`;
  const originalPath = `${basePath}/image_1.${extensionForContentType(original.contentType)}`;
  const modifiedPath = `${basePath}/image_2.${extensionForContentType(modified.contentType)}`;

  const [image1Url, image2Url] = await Promise.all([
    uploadImage({
      bytes: original.bytes,
      contentType: original.contentType,
      path: originalPath,
    }),
    uploadImage({
      bytes: modified.bytes,
      contentType: modified.contentType,
      path: modifiedPath,
    }),
  ]);

  const payload = {
    image_1_url: image1Url,
    image_2_url: image2Url,
    differences_count: differences.length,
    differences_data: differences,
    difficulty,
    active: raw.active !== false,
    language,
    source,
    api_id: externalId,
    used_count: 0,
    imported_at: new Date().toISOString(),
    time_limit: timeLimit,
  };

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("find_the_difference")
    .upsert(payload, { onConflict: "source,api_id" })
    .select("id, source, api_id, active, differences_count")
    .single();

  if (error) throw error;

  return data;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      { success: false, error: { code: "METHOD_NOT_ALLOWED", message: "Only POST is allowed" } },
      405,
    );
  }

  try {
    requireImportSecret(req);

    const body = await req.json().catch(() => {
      throw new Error("Request body must be valid JSON");
    });

    const challenges = Array.isArray(body?.challenges)
      ? body.challenges
      : body?.challenge
        ? [body.challenge]
        : [];

    if (challenges.length === 0) {
      throw new Error("Provide challenge or challenges in the request body");
    }

    if (challenges.length > MAX_BATCH_SIZE) {
      throw new Error(`A single request can import at most ${MAX_BATCH_SIZE} challenges`);
    }

    const imported = [];

    for (const challenge of challenges) {
      imported.push(await importChallenge(challenge as ChallengeInput));
    }

    return jsonResponse({
      success: true,
      imported_count: imported.length,
      items: imported,
    });
  } catch (error: unknown) {
    const status = error instanceof Error && error.name === "UNAUTHORIZED" ? 401 : 400;

    console.error("IMPORT_IMAGES_ERROR", {
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });

    return jsonResponse(
      {
        success: false,
        error: {
          code: status === 401 ? "UNAUTHORIZED" : "IMPORT_VALIDATION_FAILED",
          message: error instanceof Error ? error.message : "Image import failed",
        },
      },
      status,
    );
  }
});
