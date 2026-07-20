import { requireTelegramSession } from "../_shared/telegram-auth/index.ts";
import { gameClient, toGameEngineError } from "../_shared/game-engine/index.ts";

const headers={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json"};
const response=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
const n=(value:unknown)=>Number.isFinite(Number(value))?Math.max(0,Math.trunc(Number(value))):0;

Deno.serve(async(req)=>{
  if(req.method==="OPTIONS") return new Response("ok",{headers});
  if(req.method!=="POST") return response({success:false,error:{code:"METHOD_NOT_ALLOWED",message:"POST only"}},405);
  try{
    const session=await requireTelegramSession(req);
    const db=gameClient();
    const [{data:user,error:userError},{data:definitions,error:defError},{count:luckyCount,error:luckyError},{count:dailyCount,error:dailyError},{data:leaderboard,error:leaderboardError}]=await Promise.all([
      db.from("users").select("id,points,games_played,total_correct,total_wrong").eq("id",session.userId).single(),
      db.from("achievement_definitions").select("id,code,category,name,description,emoji,rarity,reward_points,metric,target,sort_order").eq("active",true).order("sort_order"),
      db.from("users_luckybox_history").select("id",{count:"exact",head:true}).eq("user_id",session.userId),
      db.from("users_daily_challenges").select("id",{count:"exact",head:true}).eq("user_id",session.userId).eq("completed",true),
      db.from("leaderboard").select("rank").eq("telegram_id",session.telegramId).maybeSingle(),
    ]);
    if(userError) throw userError;
    if(defError) throw defError;
    // Missing optional history tables must not fabricate progress.
    const games=n(user?.games_played), correct=n(user?.total_correct), wrong=n(user?.total_wrong), answers=correct+wrong;
    const metrics:Record<string,number>={
      games_played:games,
      total_correct:correct,
      accuracy_90:answers>=20 && correct/answers>=0.9?1:0,
      lucky_boxes_opened:luckyError?0:n(luckyCount),
      daily_challenges_completed:dailyError?0:n(dailyCount),
      leaderboard_top_100:!leaderboardError && leaderboard?.rank && n(leaderboard.rank)<=100?1:0,
      leaderboard_top_10:!leaderboardError && leaderboard?.rank && n(leaderboard.rank)<=10?1:0,
      leaderboard_top_1:!leaderboardError && n(leaderboard?.rank)===1?1:0,
    };
    const {data:existingStates,error:existingStateError}=await db.from("user_achievements").select("achievement_id,progress,unlocked_at,claimed_at").eq("user_id",session.userId);
    if(existingStateError) throw existingStateError;
    const existingMap=new Map((existingStates??[]).map((state)=>[String(state.achievement_id),state]));
    const now=new Date().toISOString();
    const rows=(definitions??[]).map((d)=>{
      const previous=existingMap.get(String(d.id));
      const progress=Math.max(n(previous?.progress),Math.min(n(d.target),n(metrics[String(d.metric)])));
      return {user_id:session.userId,achievement_id:d.id,progress,unlocked_at:previous?.unlocked_at??(progress>=n(d.target)?now:null),claimed_at:previous?.claimed_at??null,updated_at:now};
    });
    if(rows.length){
      const {error}=await db.from("user_achievements").upsert(rows,{onConflict:"user_id,achievement_id",ignoreDuplicates:false});
      if(error) throw error;
    }
    const [{data:states,error:stateError},{data:ledger,error:ledgerError},{data:allLedger,error:allLedgerError}]=await Promise.all([
      db.from("user_achievements").select("achievement_id,progress,unlocked_at,claimed_at").eq("user_id",session.userId),
      db.from("reward_ledger").select("id,source_type,source_id,points,metadata,created_at").eq("user_id",session.userId).order("created_at",{ascending:false}).limit(20),
      db.from("reward_ledger").select("points").eq("user_id",session.userId),
    ]);
    if(stateError) throw stateError;
    if(ledgerError) throw ledgerError;
    if(allLedgerError) throw allLedgerError;
    const stateMap=new Map((states??[]).map((s)=>[String(s.achievement_id),s]));
    const achievements=(definitions??[]).map((d)=>{const s=stateMap.get(String(d.id)); return {...d,progress:n(s?.progress),unlocked:Boolean(s?.unlocked_at),claimed:Boolean(s?.claimed_at),unlocked_at:s?.unlocked_at??null,claimed_at:s?.claimed_at??null};});
    const totalAvailable=achievements.filter((a)=>a.unlocked&&!a.claimed).reduce((sum,a)=>sum+n(a.reward_points),0);
    const totalClaimed=(allLedger??[]).reduce((sum,r)=>sum+n(r.points),0);
    return response({success:true,data:{user:{points:n(user?.points)},summary:{total_claimed_points:totalClaimed,available_points:totalAvailable,unlocked_count:achievements.filter(a=>a.unlocked).length,total_count:achievements.length},achievements,recent_rewards:ledger??[]}});
  }catch(err){const e=toGameEngineError(err); const status=["SESSION_TOKEN_MISSING","SESSION_INVALID_OR_EXPIRED","SESSION_USER_NOT_FOUND"].includes(e.code)?401:500; return response({success:false,error:{code:e.code,message:e.message,details:e.details}},status);}
});
