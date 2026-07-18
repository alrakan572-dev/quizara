begin;

insert into public.settings (key, value)
values
  ('game_ads_enabled', 'true'),
  ('game_ad_every_questions', '3'),
  ('game_ad_frequency', '1'),
  ('game_ad_capping_hours', '0.1'),
  ('game_ad_interval_seconds', '30'),
  ('game_ad_timeout_seconds', '0'),
  ('game_ad_every_page', 'false'),
  ('ads_provider', 'monetag'),
  ('monetag_zone_id', '11324128')
on conflict (key)
do update set value = excluded.value;

commit;
notify pgrst, 'reload schema';
