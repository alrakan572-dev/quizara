import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ZONE_ID = 11324128;
const encoder = new TextEncoder();
const reply = (body: unknown, status=200) => new Response(JSON.stringify(body), { status, headers:{ "Content-Type":"application/json", "Cache-Control":"no-store" } });

function safeEqual(left: string, right: string): boolean {
  const a = encoder.encode(left); const b = encoder.encode(right);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i=0;i<a.length;i+=1) diff |= a[i]^b[i];
  return diff === 0;
}

function client() {
  const url = Deno.env.get("SUPABASE_URL")?.trim();
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  if (!url || !key) throw new Error("Supabase server credentials are missing");
  return createClient(url, key, { auth:{ persistSession:false, autoRefreshToken:false, detectSessionInUrl:false } });
}

Deno.serve(async (req) => {
  if (req.method !== "GET") return reply({ success:false, error:"METHOD_NOT_ALLOWED" }, 405);

  const url = new URL(req.url);
  const expected = Deno.env.get("MONETAG_POSTBACK_SECRET")?.trim() ?? "";
  const received = url.searchParams.get("secret")?.trim() ?? "";
  if (!expected || !received || !safeEqual(expected, received)) return reply({ success:false, error:"INVALID_POSTBACK_SECRET" }, 401);

  const ymid = url.searchParams.get("ymid")?.trim() ?? "";
  const zoneId = Number(url.searchParams.get("zone_id"));
  const eventType = url.searchParams.get("event_type")?.trim().toLowerCase() ?? "";
  const rewardEventType = url.searchParams.get("reward_event_type")?.trim().toLowerCase() ?? "";
  const requestVar = url.searchParams.get("request_var")?.trim() ?? "";
  const telegramRaw = url.searchParams.get("telegram_id");
  const subRaw = url.searchParams.get("sub_zone_id");
  const priceRaw = url.searchParams.get("estimated_price");

  if (!ymid || zoneId !== ZONE_ID || requestVar !== "lucky_box" || !["impression","click"].includes(eventType) || !["valued","non_valued"].includes(rewardEventType)) {
    return reply({ success:false, error:"INVALID_POSTBACK_DATA" }, 400);
  }

  const db = client();
  const { data:attempt, error:lookupError } = await db.from("monetag_ad_attempts").select("id,user_id,telegram_id,status,expires_at,consumed_at").eq("ymid", ymid).maybeSingle();
  if (lookupError) return reply({ success:false, error:"POSTBACK_LOOKUP_FAILED" }, 500);
  if (!attempt) return reply({ success:true, ignored:"ATTEMPT_NOT_FOUND" });

  const monetagTelegramId = telegramRaw && /^\d+$/.test(telegramRaw) ? Number(telegramRaw) : null;
  if (monetagTelegramId !== null && monetagTelegramId !== Number(attempt.telegram_id)) return reply({ success:false, error:"TELEGRAM_ID_MISMATCH" }, 409);
  if (attempt.status === "consumed" || attempt.consumed_at) return reply({ success:true, idempotent:true });

  const rawPostback = Object.fromEntries(url.searchParams);
  if (new Date(attempt.expires_at).getTime() <= Date.now()) {
    await db.from("monetag_ad_attempts").update({ status:"expired", raw_postback:rawPostback }).eq("id", attempt.id);
    return reply({ success:true, ignored:"ATTEMPT_EXPIRED" });
  }

  const valued = eventType === "impression" && rewardEventType === "valued";
  const nextStatus = valued ? "valued" : (eventType === "impression" && rewardEventType === "non_valued" ? "non_valued" : attempt.status);
  const payload: Record<string, unknown> = {
    zone_id:zoneId,
    sub_zone_id:subRaw && /^\d+$/.test(subRaw) ? Number(subRaw) : null,
    event_type:eventType,
    reward_event_type:rewardEventType,
    estimated_price:priceRaw && Number.isFinite(Number(priceRaw)) ? Number(priceRaw) : null,
    monetag_telegram_id:monetagTelegramId,
    raw_postback:rawPostback,
    status:nextStatus,
  };
  if (valued) payload.verified_at = new Date().toISOString();

  const { error:updateError } = await db.from("monetag_ad_attempts").update(payload).eq("id", attempt.id).neq("status", "consumed");
  if (updateError) return reply({ success:false, error:"POSTBACK_UPDATE_FAILED" }, 500);

  console.log("MONETAG_POSTBACK_ACCEPTED", JSON.stringify({ attempt_id:attempt.id, user_id:attempt.user_id, event_type:eventType, reward_event_type:rewardEventType, status:nextStatus, timestamp:new Date().toISOString() }));
  return reply({ success:true, valued });
});
