import { requireTelegramSession } from "../_shared/telegram-auth/index.ts";
import { gameClient, GameEngineError, toGameEngineError } from "../_shared/game-engine/index.ts";
const headers={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json"};
const response=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
Deno.serve(async(req)=>{
  if(req.method==="OPTIONS") return new Response("ok",{headers});
  if(req.method!=="POST") return response({success:false,error:{code:"METHOD_NOT_ALLOWED",message:"POST only"}},405);
  try{
    const session=await requireTelegramSession(req);
    const body=await req.json().catch(()=>({}));
    const code=typeof body?.achievement_code==="string"?body.achievement_code.trim():"";
    if(!code) throw new GameEngineError("achievement_code is required","INVALID_ACHIEVEMENT_CODE");
    const {data,error}=await gameClient().rpc("claim_achievement_reward",{p_user_id:session.userId,p_achievement_code:code});
    if(error) throw error;
    return response({success:true,data});
  }catch(err){const e=toGameEngineError(err); let status=500; if(["SESSION_TOKEN_MISSING","SESSION_INVALID_OR_EXPIRED","SESSION_USER_NOT_FOUND"].includes(e.code)) status=401; if(e.message.includes("NOT_FOUND")) status=404; if(e.message.includes("NOT_UNLOCKED")||e.code==="INVALID_ACHIEVEMENT_CODE") status=409; return response({success:false,error:{code:e.code,message:e.message,details:e.details}},status);}
});
