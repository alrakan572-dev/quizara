begin;

create or replace function public.is_valid_find_difference_data(
  value jsonb,
  expected_count bigint
)
returns boolean
language sql
immutable
strict
as $$
  select
    jsonb_typeof(value) = 'array'
    and expected_count between 1 and 20
    and jsonb_array_length(value) = expected_count
    and not exists (
      select 1
      from jsonb_array_elements(value) as point
      where
        jsonb_typeof(point) <> 'object'
        or not (point ? 'id')
        or not (point ? 'x')
        or not (point ? 'y')
        or not (point ? 'radius')
        or jsonb_typeof(point -> 'id') <> 'number'
        or jsonb_typeof(point -> 'x') <> 'number'
        or jsonb_typeof(point -> 'y') <> 'number'
        or jsonb_typeof(point -> 'radius') <> 'number'
        or (point ->> 'x')::numeric < 0
        or (point ->> 'x')::numeric > 100
        or (point ->> 'y')::numeric < 0
        or (point ->> 'y')::numeric > 100
        or (point ->> 'radius')::numeric < 1.5
        or (point ->> 'radius')::numeric > 20
    )
    and (
      select count(distinct point ->> 'id')
      from jsonb_array_elements(value) as point
    ) = expected_count;
$$;

update public.find_the_difference
set active = false
where active = true
  and (
    image_1_url is null
    or image_2_url is null
    or btrim(image_1_url) = ''
    or btrim(image_2_url) = ''
    or image_1_url = image_2_url
    or differences_data is null
    or not public.is_valid_find_difference_data(
      differences_data::jsonb,
      differences_count
    )
  );

alter table public.find_the_difference
  drop constraint if exists find_difference_active_content_valid;

alter table public.find_the_difference
  add constraint find_difference_active_content_valid
  check (
    active = false
    or (
      image_1_url is not null
      and image_2_url is not null
      and btrim(image_1_url) <> ''
      and btrim(image_2_url) <> ''
      and image_1_url <> image_2_url
      and public.is_valid_find_difference_data(
        differences_data::jsonb,
        differences_count
      )
    )
  );

create unique index if not exists find_difference_source_api_id_uidx
  on public.find_the_difference (source, api_id)
  where source is not null and api_id is not null;

commit;
