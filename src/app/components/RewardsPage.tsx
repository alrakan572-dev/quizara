import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Gift, Trophy, Sparkles, RefreshCw, Lock, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";
import { useRewards } from "../../hooks/useRewards";
import type { AchievementItem } from "../../api/GameAPI";

interface Props { onBack: () => void; userPoints: number; onPointsUpdate?: (points: number) => void; }
const rarityColor: Record<AchievementItem["rarity"], string> = { Common:"#9CA3AF", Rare:"#22D3EE", Epic:"#A78BFA", Legendary:"#FBBF24" };
const categoryLabels: Record<string,string> = { beginner:"Beginner", quizmaster:"Quiz Master", daily:"Daily Champion", lucky:"Lucky Winner", leaderboard:"Leaderboard" };

function percent(progress:number,target:number){ return target > 0 ? Math.min(100,Math.round(progress/target*100)) : 0; }

export function RewardsPage({ onBack, onPointsUpdate }: Props) {
  const { data, loading, error, claimingCode, refresh, claim } = useRewards();
  const [activeCategory,setActiveCategory] = useState("all");
  const categories = useMemo(() => Array.from(new Set(data?.achievements.map((item)=>item.category) ?? [])), [data]);
  const visible = useMemo(() => activeCategory === "all" ? data?.achievements ?? [] : (data?.achievements ?? []).filter((item)=>item.category===activeCategory), [activeCategory,data]);

  const handleClaim = async (item:AchievementItem) => {
    if (!item.unlocked || item.claimed) return;
    const result = await claim(item.code);
    onPointsUpdate?.(result.points_after);
    if (!result.already_claimed) confetti({ particleCount:70, spread:85, origin:{x:0.5,y:0.45} });
  };

  return <div className="flex flex-col gap-4 pb-4">
    <div className="flex items-center justify-between">
      <button onClick={onBack} className="flex items-center gap-1.5 px-3 py-2 rounded-xl" style={{background:"rgba(251,191,36,.1)",border:"1px solid rgba(251,191,36,.3)",color:"#FBBF24"}}><ArrowLeft size={15}/>Back</button>
      <div className="flex items-center gap-2"><Sparkles size={16} color="#FBBF24"/><strong style={{color:"#F0F4FF"}}>REWARDS & ACHIEVEMENTS</strong></div>
      <button aria-label="Refresh rewards" onClick={()=>void refresh()} className="p-2 rounded-xl" style={{background:"rgba(255,255,255,.05)",color:"#9CA3AF"}}><RefreshCw size={16}/></button>
    </div>

    {loading && !data && <div className="rounded-2xl p-6 text-center" style={{background:"rgba(10,15,30,.85)",border:"1px solid rgba(167,139,250,.25)",color:"#CBD5E1"}}>Loading your real rewards…</div>}
    {error && !data && <div className="rounded-2xl p-5 text-center" style={{background:"rgba(127,29,29,.18)",border:"1px solid rgba(248,113,113,.35)",color:"#FCA5A5"}}><p>{error.message}</p><button onClick={()=>void refresh()} className="mt-3 px-4 py-2 rounded-xl" style={{background:"rgba(248,113,113,.15)"}}>Try again</button></div>}

    {data && <>
      <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="rounded-3xl p-5" style={{background:"linear-gradient(145deg,rgba(26,16,64,.97),rgba(10,15,30,.97))",border:"1px solid rgba(251,191,36,.32)"}}>
        <div className="flex items-center justify-between gap-4">
          <div><div className="flex items-center gap-2" style={{color:"#FBBF24"}}><Trophy size={18}/><span>Achievement progress</span></div><div className="mt-2 text-3xl font-black" style={{color:"#F8FAFC"}}>{data.summary.unlocked_count}<span className="text-base" style={{color:"#64748B"}}> / {data.summary.total_count}</span></div></div>
          <div className="text-right"><div style={{color:"#94A3B8"}}>Current points</div><div className="text-2xl font-black" style={{color:"#FBBF24"}}>{data.user.points.toLocaleString()}</div></div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="rounded-xl p-3" style={{background:"rgba(52,211,153,.08)",border:"1px solid rgba(52,211,153,.2)"}}><div style={{color:"#94A3B8"}}>Available to claim</div><strong style={{color:"#34D399"}}>+{data.summary.available_points.toLocaleString()}</strong></div>
          <div className="rounded-xl p-3" style={{background:"rgba(167,139,250,.08)",border:"1px solid rgba(167,139,250,.2)"}}><div style={{color:"#94A3B8"}}>Achievement rewards</div><strong style={{color:"#A78BFA"}}>{data.summary.total_claimed_points.toLocaleString()}</strong></div>
        </div>
      </motion.div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={()=>setActiveCategory("all")} className="px-3 py-2 rounded-xl whitespace-nowrap" style={{background:activeCategory==="all"?"rgba(251,191,36,.18)":"rgba(255,255,255,.04)",color:activeCategory==="all"?"#FBBF24":"#94A3B8"}}>All</button>
        {categories.map((category)=><button key={category} onClick={()=>setActiveCategory(category)} className="px-3 py-2 rounded-xl whitespace-nowrap" style={{background:activeCategory===category?"rgba(167,139,250,.18)":"rgba(255,255,255,.04)",color:activeCategory===category?"#C4B5FD":"#94A3B8"}}>{categoryLabels[category] ?? category}</button>)}
      </div>

      {visible.length===0 ? <div className="rounded-2xl p-6 text-center" style={{background:"rgba(10,15,30,.85)",color:"#94A3B8"}}>No active achievements are configured for this category.</div> : <div className="grid gap-3">
        {visible.map((item)=>{
          const pct=percent(item.progress,item.target); const color=rarityColor[item.rarity];
          return <motion.div key={item.code} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="rounded-2xl p-4" style={{background:"linear-gradient(135deg,rgba(10,15,30,.94),rgba(26,16,64,.72))",border:`1px solid ${color}33`}}>
            <div className="flex gap-3 items-start"><div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{background:`${color}18`,filter:item.unlocked?"none":"grayscale(1)"}}>{item.emoji}</div><div className="flex-1 min-w-0"><div className="flex justify-between gap-2"><div><strong style={{color:"#F8FAFC"}}>{item.name}</strong><div className="text-xs" style={{color}}> {item.rarity.toUpperCase()} · +{item.reward_points} points</div></div>{item.claimed?<CheckCircle2 size={20} color="#34D399"/>:!item.unlocked?<Lock size={18} color="#64748B"/>:null}</div><p className="text-sm my-2" style={{color:"#94A3B8"}}>{item.description}</p><div className="h-2 rounded-full" style={{background:"rgba(255,255,255,.07)"}}><div className="h-full rounded-full" style={{width:`${pct}%`,background:color}}/></div><div className="flex justify-between items-center mt-2"><span className="text-xs" style={{color:"#64748B"}}>{item.progress.toLocaleString()} / {item.target.toLocaleString()}</span>{item.unlocked&&!item.claimed&&<button disabled={claimingCode!==null} onClick={()=>void handleClaim(item)} className="px-3 py-1.5 rounded-lg text-sm font-bold disabled:opacity-50" style={{background:`${color}22`,border:`1px solid ${color}66`,color}}>{claimingCode===item.code?"Claiming…":"Claim"}</button>}{item.claimed&&<span className="text-xs" style={{color:"#34D399"}}>Claimed</span>}</div></div></div>
          </motion.div>;
        })}
      </div>}

      <div><div className="flex items-center gap-2 mb-2" style={{color:"#FBBF24"}}><Gift size={16}/><strong>RECENT REWARDS</strong></div>{data.recent_rewards.length===0?<div className="rounded-2xl p-5 text-center" style={{background:"rgba(10,15,30,.8)",color:"#64748B"}}>Claimed achievement rewards will appear here.</div>:<div className="grid gap-2">{data.recent_rewards.map((reward)=><div key={reward.id} className="flex justify-between rounded-xl p-3" style={{background:"rgba(10,15,30,.8)",border:"1px solid rgba(255,255,255,.06)"}}><div><div style={{color:"#E2E8F0"}}>{reward.source_id.replaceAll("_"," ")}</div><div className="text-xs" style={{color:"#64748B"}}>{new Date(reward.created_at).toLocaleString()}</div></div><strong style={{color:"#34D399"}}>+{reward.points}</strong></div>)}</div>}</div>
    </>}
  </div>;
}
