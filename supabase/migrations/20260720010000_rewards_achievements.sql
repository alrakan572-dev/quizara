-- Quizara production rewards and achievements foundation.
-- Definitions are database-managed; progress and claims are user-specific.

create table if not exists public.achievement_definitions (
  id bigserial primary key,
  code text not null unique,
  category text not null,
  name text not null,
  description text not null,
  emoji text not null,
  rarity text not null check (rarity in ('Common','Rare','Epic','Legendary')),
  reward_points bigint not null check (reward_points >= 0),
  metric text not null,
  target bigint not null check (target > 0),
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_achievements (
  id bigserial primary key,
  user_id bigint not null references public.users(id) on delete cascade,
  achievement_id bigint not null references public.achievement_definitions(id) on delete cascade,
  progress bigint not null default 0 check (progress >= 0),
  unlocked_at timestamptz,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, achievement_id)
);

create table if not exists public.reward_ledger (
  id bigserial primary key,
  user_id bigint not null references public.users(id) on delete cascade,
  source_type text not null,
  source_id text not null,
  points bigint not null check (points >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, source_type, source_id)
);

create index if not exists user_achievements_user_idx on public.user_achievements(user_id);
create index if not exists reward_ledger_user_created_idx on public.reward_ledger(user_id, created_at desc);

alter table public.achievement_definitions enable row level security;
alter table public.user_achievements enable row level security;
alter table public.reward_ledger enable row level security;

-- Edge Functions use service role. No direct frontend table access is required.
revoke all on public.achievement_definitions from anon, authenticated;
revoke all on public.user_achievements from anon, authenticated;
revoke all on public.reward_ledger from anon, authenticated;

insert into public.achievement_definitions
(code,category,name,description,emoji,rarity,reward_points,metric,target,sort_order,active)
values
('first_game','beginner','First Steps','Play your first game','🎮','Common',50,'games_played',1,10,true),
('games_10','beginner','Warming Up','Play 10 games','🎯','Common',150,'games_played',10,20,true),
('games_50','beginner','Getting Serious','Play 50 games','💪','Rare',300,'games_played',50,30,true),
('games_100','beginner','Veteran','Play 100 games','🎖️','Rare',500,'games_played',100,40,true),
('accuracy_90','quizmaster','Sharp Mind','Maintain at least 90% accuracy after 20 answers','🎯','Rare',400,'accuracy_90',1,50,true),
('correct_2000','quizmaster','Scholar','Answer 2,000 questions correctly','📚','Epic',800,'total_correct',2000,60,true),
('correct_10000','quizmaster','Trivia God','Answer 10,000 questions correctly','⚡','Legendary',2000,'total_correct',10000,70,true),
('lucky_1','lucky','Lucky One','Open your first Lucky Box','🎁','Common',50,'lucky_boxes_opened',1,80,true),
('lucky_10','lucky','Fortune Seeker','Open 10 Lucky Boxes','🎰','Common',200,'lucky_boxes_opened',10,90,true),
('daily_5','daily','Daily Grinder','Complete 5 daily challenges','📅','Common',200,'daily_challenges_completed',5,100,true),
('daily_30','daily','Champion','Complete 30 daily challenges','🏅','Epic',700,'daily_challenges_completed',30,110,true),
('top_100','leaderboard','On the Board','Enter the Top 100','📊','Rare',300,'leaderboard_top_100',1,120,true),
('top_10','leaderboard','Elite','Reach the Top 10','💎','Epic',1000,'leaderboard_top_10',1,130,true),
('top_1','leaderboard','Legend','Reach number 1','👑','Legendary',5000,'leaderboard_top_1',1,140,true)
on conflict (code) do update set
category=excluded.category,name=excluded.name,description=excluded.description,emoji=excluded.emoji,
rarity=excluded.rarity,reward_points=excluded.reward_points,metric=excluded.metric,target=excluded.target,
sort_order=excluded.sort_order,active=excluded.active,updated_at=now();

create or replace function public.claim_achievement_reward(
  p_user_id bigint,
  p_achievement_code text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_achievement public.achievement_definitions%rowtype;
  v_user_achievement public.user_achievements%rowtype;
  v_points_after bigint;
begin
  select * into v_achievement
  from public.achievement_definitions
  where code = p_achievement_code and active = true
  for update;

  if not found then raise exception 'ACHIEVEMENT_NOT_FOUND' using errcode='P0001'; end if;

  select * into v_user_achievement
  from public.user_achievements
  where user_id=p_user_id and achievement_id=v_achievement.id
  for update;

  if not found or v_user_achievement.unlocked_at is null then
    raise exception 'ACHIEVEMENT_NOT_UNLOCKED' using errcode='P0001';
  end if;

  if v_user_achievement.claimed_at is not null then
    select points into v_points_after from public.users where id=p_user_id;
    return jsonb_build_object('already_claimed',true,'points_awarded',0,'points_after',coalesce(v_points_after,0));
  end if;

  insert into public.reward_ledger(user_id,source_type,source_id,points,metadata)
  values(p_user_id,'achievement',v_achievement.code,v_achievement.reward_points,jsonb_build_object('achievement_id',v_achievement.id));

  update public.users
  set points=coalesce(points,0)+v_achievement.reward_points, updated_at=now()
  where id=p_user_id
  returning points into v_points_after;

  update public.user_achievements
  set claimed_at=now(), updated_at=now()
  where id=v_user_achievement.id;

  return jsonb_build_object('already_claimed',false,'points_awarded',v_achievement.reward_points,'points_after',v_points_after);
exception
  when unique_violation then
    select points into v_points_after from public.users where id=p_user_id;
    return jsonb_build_object('already_claimed',true,'points_awarded',0,'points_after',coalesce(v_points_after,0));
end;
$$;

revoke all on function public.claim_achievement_reward(bigint,text) from public, anon, authenticated;
grant execute on function public.claim_achievement_reward(bigint,text) to service_role;
