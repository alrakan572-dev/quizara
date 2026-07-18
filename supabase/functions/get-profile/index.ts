import { requireTelegramSession } from "../_shared/telegram-auth/index.ts";
import {
  gameClient,
  GameEngineError,
  toGameEngineError,
} from "../_shared/game-engine/index.ts";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":
    "POST, OPTIONS",
  "Content-Type": "application/json",
};

function response(body: unknown, status = 200) {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers,
    },
  );
}

Deno.serve(async (req) => {

  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers,
    });
  }

  if (req.method !== "POST") {
    return response({
      success:false,
      error:{
        code:"METHOD_NOT_ALLOWED",
        message:"POST only"
      }
    },405);
  }

  try {

    const session =
      await requireTelegramSession(req);

    const db = gameClient();

    const { data,error } =
      await db
      .from("users")
      .select(`
        id,
        telegram_id,
        username,
        first_name,
        photo_url,
        language,
        country,
        bio,
        points,
        coins,
        hints,
        extra_spins,
        level,
        games_played,
        total_correct,
        total_wrong,
        vip,
        created_at,
        updated_at
      `)
      .eq("id",session.userId)
      .single();

    if(error)
      throw error;

    if(!data){
      throw new GameEngineError(
        "User not found",
        "USER_NOT_FOUND",
      );
    }

    return response({
      success:true,
      data,
    });

  } catch(err){

    const e =
      toGameEngineError(err);

    let status=500;

    switch(e.code){

      case "SESSION_TOKEN_MISSING":
      case "SESSION_INVALID_OR_EXPIRED":
      case "SESSION_USER_NOT_FOUND":
        status=401;
      break;

      case "USER_NOT_FOUND":
        status=404;
      break;

    }

    return response({
      success:false,
      error:{
        code:e.code,
        message:e.message,
        details:e.details
      }
    },status);

  }

});