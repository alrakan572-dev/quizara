begin;

alter table public.users
  add column if not exists notifications_enabled boolean not null default true,
  add column if not exists sound_enabled boolean not null default true,
  add column if not exists music_enabled boolean not null default false,
  add column if not exists theme text not null default 'dark',
  add column if not exists delete_requested_at timestamptz,
  add column if not exists delete_scheduled_for timestamptz;

alter table public.users
  drop constraint if exists users_theme_check;

alter table public.users
  add constraint users_theme_check
  check (theme in ('dark', 'light'));

alter table public.users
  drop constraint if exists users_delete_schedule_check;

alter table public.users
  add constraint users_delete_schedule_check
  check (
    (delete_requested_at is null and delete_scheduled_for is null)
    or
    (
      delete_requested_at is not null
      and delete_scheduled_for is not null
      and delete_scheduled_for > delete_requested_at
    )
  );

create index if not exists users_delete_scheduled_for_idx
  on public.users (delete_scheduled_for)
  where delete_scheduled_for is not null;

commit;

notify pgrst, 'reload schema';
