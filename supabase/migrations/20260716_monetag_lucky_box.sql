begin;

create extension if not exists pgcrypto;

drop function if exists public.claim_ad_reward(bigint, text, text, jsonb);
drop function if exists public.open_lucky_box(bigint);

create table if not exists public.monetag_ad_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id bigint not null references public.users(id) on update cascade on delete cascade,
  telegram_id bigint not null,
  ymid text not null unique,
  provider text not null default 'monetag',
  zone_id bigint not null default 11324128,
  sub_zone_id bigint,
  request_var text not null default 'lucky_box',
  status text not null default 'pending',
  event_type text,
  reward_event_type text,
  estimated_price numeric(18,8),
  monetag_telegram_id bigint,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '15 minutes'),
  verified_at timestamptz,
  consumed_at timestamptz,
  raw_postback jsonb not null default '{}'::jsonb,
  constraint monetag_ad_attempts_provider_check check (provider = 'monetag'),
  constraint monetag_ad_attempts_zone_check check (zone_id = 11324128),
  constraint monetag_ad_attempts_request_var_check check (request_var = 'lucky_box'),
  constraint monetag_ad_attempts_status_check check (status in ('pending','valued','non_valued','consumed','expired')),
  constraint monetag_ad_attempts_expiry_check check (expires_at > created_at),
  constraint monetag_ad_attempts_consumed_check check (consumed_at is null or status = 'consumed')
);

create index if not exists idx_monetag_ad_attempts_user_created on public.monetag_ad_attempts(user_id, created_at desc);
create index if not exists idx_monetag_ad_attempts_pending_expiry on public.monetag_ad_attempts(expires_at) where status = 'pending';
create unique index if not exists idx_monetag_ad_attempts_one_verified_ticket on public.monetag_ad_attempts(user_id) where status = 'valued' and consumed_at is null;

alter table public.monetag_ad_attempts enable row level security;
revoke all on table public.monetag_ad_attempts from anon, authenticated;

alter table public.users_luckybox_history add column if not exists ad_attempt_id uuid;
alter table public.users_luckybox_history drop constraint if exists users_luckybox_history_ad_attempt_id_fkey;
alter table public.users_luckybox_history add constraint users_luckybox_history_ad_attempt_id_fkey foreign key (ad_attempt_id) references public.monetag_ad_attempts(id) on update cascade on delete restrict;
create unique index if not exists idx_users_luckybox_history_ad_attempt on public.users_luckybox_history(ad_attempt_id) where ad_attempt_id is not null;

insert into public.settings(key, value)
values ('ads_provider','monetag'), ('monetag_zone_id','11324128'), ('lucky_box_price','0')
on conflict (key) do update set value = excluded.value;

create or replace function public.create_monetag_lucky_box_attempt(p_user_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user public.users%rowtype;
  v_daily_limit bigint;
  v_cooldown_hours bigint;
  v_today_count bigint;
  v_last_opened_at timestamptz;
  v_remaining_seconds bigint := 0;
  v_existing public.monetag_ad_attempts%rowtype;
  v_attempt public.monetag_ad_attempts%rowtype;
  v_now timestamptz := now();
begin
  select * into v_user from public.users where id = p_user_id for update;
  if not found then raise exception 'USER_NOT_FOUND' using errcode='P0001'; end if;

  select nullif(trim(value),'')::bigint into v_daily_limit from public.settings where key='lucky_box_daily_limit';
  select nullif(trim(value),'')::bigint into v_cooldown_hours from public.settings where key='lucky_box_cooldown_hours';
  if v_daily_limit is null or v_daily_limit < 1 then raise exception 'INVALID_LUCKY_BOX_DAILY_LIMIT' using errcode='P0001'; end if;
  if v_cooldown_hours is null or v_cooldown_hours < 0 then raise exception 'INVALID_LUCKY_BOX_COOLDOWN' using errcode='P0001'; end if;

  update public.monetag_ad_attempts set status='expired' where user_id=p_user_id and status='pending' and expires_at<=v_now;

  select * into v_existing
  from public.monetag_ad_attempts
  where user_id=p_user_id and status in ('pending','valued') and consumed_at is null and expires_at>v_now
  order by created_at desc limit 1;

  if found then
    return jsonb_build_object('attempt_id',v_existing.id,'ymid',v_existing.ymid,'provider',v_existing.provider,'zone_id',v_existing.zone_id,'request_var',v_existing.request_var,'status',v_existing.status,'expires_at',v_existing.expires_at);
  end if;

  select count(*) into v_today_count
  from public.users_luckybox_history
  where user_id=p_user_id and opened_at>=date_trunc('day',v_now) and opened_at<date_trunc('day',v_now)+interval '1 day';
  if v_today_count>=v_daily_limit then raise exception 'LUCKY_BOX_DAILY_LIMIT_REACHED' using errcode='P0001'; end if;

  select max(opened_at) into v_last_opened_at from public.users_luckybox_history where user_id=p_user_id;
  if v_last_opened_at is not null and v_cooldown_hours>0 and v_last_opened_at+make_interval(hours=>v_cooldown_hours::integer)>v_now then
    v_remaining_seconds := greatest(ceil(extract(epoch from (v_last_opened_at+make_interval(hours=>v_cooldown_hours::integer)-v_now)))::bigint,0);
    raise exception 'LUCKY_BOX_COOLDOWN_ACTIVE:%',v_remaining_seconds using errcode='P0001';
  end if;

  insert into public.monetag_ad_attempts(user_id,telegram_id,ymid,provider,zone_id,request_var,status,created_at,expires_at)
  values(p_user_id,v_user.telegram_id,gen_random_uuid()::text,'monetag',11324128,'lucky_box','pending',v_now,v_now+interval '15 minutes')
  returning * into v_attempt;

  return jsonb_build_object('attempt_id',v_attempt.id,'ymid',v_attempt.ymid,'provider',v_attempt.provider,'zone_id',v_attempt.zone_id,'request_var',v_attempt.request_var,'status',v_attempt.status,'expires_at',v_attempt.expires_at);
end;
$$;

create or replace function public.open_lucky_box(p_user_id bigint, p_ad_attempt_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user public.users%rowtype;
  v_attempt public.monetag_ad_attempts%rowtype;
  v_daily_limit bigint;
  v_cooldown_hours bigint;
  v_today_count bigint;
  v_last_opened_at timestamptz;
  v_remaining_seconds bigint;
  v_total_probability numeric;
  v_random_value numeric;
  v_reward_id bigint;
  v_reward_type text;
  v_reward_value bigint;
  v_reward_probability numeric;
  v_vip_subscription_id bigint;
  v_new_expire_date timestamptz;
  v_points_after bigint;
  v_hints_after bigint;
  v_extra_spins_after bigint;
  v_vip_after boolean;
  v_now timestamptz := now();
begin
  if p_ad_attempt_id is null then raise exception 'INVALID_AD_ATTEMPT_ID' using errcode='P0001'; end if;
  select * into v_user from public.users where id=p_user_id for update;
  if not found then raise exception 'USER_NOT_FOUND' using errcode='P0001'; end if;

  select * into v_attempt from public.monetag_ad_attempts where id=p_ad_attempt_id for update;
  if not found then raise exception 'AD_ATTEMPT_NOT_FOUND' using errcode='P0001'; end if;
  if v_attempt.user_id<>p_user_id or v_attempt.telegram_id<>v_user.telegram_id then raise exception 'AD_ATTEMPT_USER_MISMATCH' using errcode='P0001'; end if;
  if v_attempt.zone_id<>11324128 or v_attempt.provider<>'monetag' or v_attempt.request_var<>'lucky_box' then raise exception 'AD_ATTEMPT_INVALID_CONTEXT' using errcode='P0001'; end if;
  if v_attempt.status='consumed' or v_attempt.consumed_at is not null then raise exception 'AD_ATTEMPT_ALREADY_CONSUMED' using errcode='P0001'; end if;
  if v_attempt.expires_at<=v_now then update public.monetag_ad_attempts set status='expired' where id=p_ad_attempt_id; raise exception 'AD_ATTEMPT_EXPIRED' using errcode='P0001'; end if;
  if v_attempt.status<>'valued' or v_attempt.reward_event_type<>'valued' or v_attempt.event_type<>'impression' or v_attempt.verified_at is null then raise exception 'AD_NOT_VERIFIED' using errcode='P0001'; end if;

  select nullif(trim(value),'')::bigint into v_daily_limit from public.settings where key='lucky_box_daily_limit';
  select nullif(trim(value),'')::bigint into v_cooldown_hours from public.settings where key='lucky_box_cooldown_hours';
  if v_daily_limit is null or v_daily_limit<1 then raise exception 'INVALID_LUCKY_BOX_DAILY_LIMIT' using errcode='P0001'; end if;
  if v_cooldown_hours is null or v_cooldown_hours<0 then raise exception 'INVALID_LUCKY_BOX_COOLDOWN' using errcode='P0001'; end if;

  select count(*) into v_today_count from public.users_luckybox_history where user_id=p_user_id and opened_at>=date_trunc('day',v_now) and opened_at<date_trunc('day',v_now)+interval '1 day';
  if v_today_count>=v_daily_limit then raise exception 'LUCKY_BOX_DAILY_LIMIT_REACHED' using errcode='P0001'; end if;
  select max(opened_at) into v_last_opened_at from public.users_luckybox_history where user_id=p_user_id;
  if v_last_opened_at is not null and v_cooldown_hours>0 and v_last_opened_at+make_interval(hours=>v_cooldown_hours::integer)>v_now then
    v_remaining_seconds := greatest(ceil(extract(epoch from (v_last_opened_at+make_interval(hours=>v_cooldown_hours::integer)-v_now)))::bigint,0);
    raise exception 'LUCKY_BOX_COOLDOWN_ACTIVE:%',v_remaining_seconds using errcode='P0001';
  end if;

  select coalesce(sum(probability),0) into v_total_probability from public.luck_box where active=true and probability>0;
  if v_total_probability<=0 then raise exception 'NO_ACTIVE_LUCKY_BOX_REWARDS' using errcode='P0001'; end if;
  v_random_value := random()*v_total_probability;

  select reward_id,reward_type,reward_value,probability into v_reward_id,v_reward_type,v_reward_value,v_reward_probability
  from (
    select id reward_id,reward_type,reward_value,probability,sum(probability) over(order by id rows between unbounded preceding and current row) cumulative_probability
    from public.luck_box where active=true and probability>0
  ) weighted where cumulative_probability>v_random_value order by cumulative_probability limit 1;
  if v_reward_id is null then raise exception 'LUCKY_BOX_REWARD_SELECTION_FAILED' using errcode='P0001'; end if;

  case lower(trim(v_reward_type))
    when 'points' then update public.users set points=coalesce(points,0)+v_reward_value where id=p_user_id;
    when 'jackpot' then update public.users set points=coalesce(points,0)+v_reward_value where id=p_user_id;
    when 'hint' then update public.users set hints=coalesce(hints,0)+v_reward_value where id=p_user_id;
    when 'extra_spin' then update public.users set extra_spins=coalesce(extra_spins,0)+v_reward_value where id=p_user_id;
    when 'vip_day' then
      update public.vip_subscriptions set active=false where telegram_id=v_user.telegram_id and active=true and expire_date is not null and expire_date<=v_now;
      select id into v_vip_subscription_id from public.vip_subscriptions where telegram_id=v_user.telegram_id and active=true and (expire_date is null or expire_date>v_now) order by expire_date desc nulls first limit 1 for update;
      if v_vip_subscription_id is not null then
        update public.vip_subscriptions set expire_date=greatest(coalesce(expire_date,v_now),v_now)+make_interval(days=>v_reward_value::integer),source='lucky_box',active=true where id=v_vip_subscription_id returning expire_date into v_new_expire_date;
      else
        insert into public.vip_subscriptions(telegram_id,plan_id,start_date,expire_date,source,active) values(v_user.telegram_id,null,v_now,v_now+make_interval(days=>v_reward_value::integer),'lucky_box',true) returning expire_date into v_new_expire_date;
      end if;
      update public.users set vip=true where id=p_user_id;
    else raise exception 'UNSUPPORTED_LUCKY_BOX_REWARD_TYPE:%',v_reward_type using errcode='P0001';
  end case;

  update public.monetag_ad_attempts set status='consumed',consumed_at=v_now where id=p_ad_attempt_id;
  select points,hints,extra_spins,vip into v_points_after,v_hints_after,v_extra_spins_after,v_vip_after from public.users where id=p_user_id;

  insert into public.leaderboard(telegram_id,username,total_points,rank,level,vip,photo_url,updated_at)
  select telegram_id,username,coalesce(points,0),0,level,vip,photo_url,v_now from public.users where id=p_user_id
  on conflict(telegram_id) do update set username=excluded.username,total_points=excluded.total_points,level=excluded.level,vip=excluded.vip,photo_url=excluded.photo_url,updated_at=excluded.updated_at;

  insert into public.users_luckybox_history(user_id,reward_id,reward_type,reward_value,box_price,coins_before,coins_after,opened_at,ad_attempt_id)
  values(p_user_id,v_reward_id,upper(trim(v_reward_type)),v_reward_value,0,coalesce(v_user.coins,0),coalesce(v_user.coins,0),v_now,p_ad_attempt_id);

  return jsonb_build_object(
    'ad_attempt_id',p_ad_attempt_id,
    'reward',jsonb_build_object('id',v_reward_id,'type',upper(trim(v_reward_type)),'value',v_reward_value,'probability',v_reward_probability),
    'points_after',coalesce(v_points_after,0),
    'hints_after',coalesce(v_hints_after,0),
    'extra_spins_after',coalesce(v_extra_spins_after,0),
    'vip',coalesce(v_vip_after,false),
    'vip_expire_date',v_new_expire_date,
    'daily_limit',v_daily_limit,
    'opened_today',v_today_count+1,
    'opened_at',v_now
  );
end;
$$;

commit;
notify pgrst, 'reload schema';
