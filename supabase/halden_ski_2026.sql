-- Battleship Halden mot Ski (2026) – eget datasett, ingen gamle spill slettes.
-- Kjør dette etter at Supabase-prosjektet er aktivt.
create table if not exists public.hvs_editors (
  email text primary key check (email = lower(email) and email ~ '^[^@ ]+@[^@ ]+\\.[^@ ]+$'),
  added_at timestamptz not null default now()
);
create table if not exists public.hvs_shots (
  team text not null check (team in ('halden','ski')),
  coordinate text not null check (coordinate ~ '^[A-L](10|[1-9])$'),
  result text not null check (result in ('hit','miss','sunk')),
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now(),
  primary key (team, coordinate)
);
create table if not exists public.hvs_ships (
  ship_key text primary key check (ship_key in ('carrier','battleship','cruiser','sub1','sub2','destroyer1','destroyer2','patrol1','patrol2')),
  cells text[] not null,
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now(),
  constraint ship_length_matches check (
    cardinality(cells) = case
      when ship_key = 'carrier' then 8
      when ship_key = 'battleship' then 5
      when ship_key = 'cruiser' then 4
      when ship_key like 'sub%' then 3
      when ship_key like 'destroyer%' then 2
      else 1 end
  )
);
-- Server-side membership check, never trust a visible browser toggle.
create or replace function public.is_hvs_editor()
returns boolean language sql stable security definer set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.hvs_editors e
    where e.email = lower(coalesce((select auth.jwt()->>'email'), ''))
  );
$$;
revoke all on function public.is_hvs_editor() from public;
grant execute on function public.is_hvs_editor() to anon, authenticated;

alter table public.hvs_editors enable row level security;
alter table public.hvs_shots enable row level security;
alter table public.hvs_ships enable row level security;

drop policy if exists "Editors can read own permission" on public.hvs_editors;
create policy "Editors can read own permission" on public.hvs_editors
for select to authenticated using (email = lower(coalesce((select auth.jwt()->>'email'),'')));

drop policy if exists "Everyone can view shots" on public.hvs_shots;
create policy "Everyone can view shots" on public.hvs_shots
for select to anon, authenticated using (true);
drop policy if exists "Approved employees insert shots" on public.hvs_shots;
create policy "Approved employees insert shots" on public.hvs_shots
for insert to authenticated with check ((select public.is_hvs_editor()));
drop policy if exists "Approved employees update shots" on public.hvs_shots;
create policy "Approved employees update shots" on public.hvs_shots
for update to authenticated using ((select public.is_hvs_editor())) with check ((select public.is_hvs_editor()));
drop policy if exists "Approved employees delete shots" on public.hvs_shots;
create policy "Approved employees delete shots" on public.hvs_shots
for delete to authenticated using ((select public.is_hvs_editor()));

drop policy if exists "Only approved employees see our ships" on public.hvs_ships;
create policy "Only approved employees see our ships" on public.hvs_ships
for select to authenticated using ((select public.is_hvs_editor()));
drop policy if exists "Approved employees insert placements" on public.hvs_ships;
create policy "Approved employees insert placements" on public.hvs_ships
for insert to authenticated with check ((select public.is_hvs_editor()));
drop policy if exists "Approved employees update placements" on public.hvs_ships;
create policy "Approved employees update placements" on public.hvs_ships
for update to authenticated using ((select public.is_hvs_editor())) with check ((select public.is_hvs_editor()));
drop policy if exists "Approved employees delete placements" on public.hvs_ships;
create policy "Approved employees delete placements" on public.hvs_ships
for delete to authenticated using ((select public.is_hvs_editor()));

grant select on public.hvs_shots to anon, authenticated;
grant insert, update, delete on public.hvs_shots to authenticated;
grant select on public.hvs_editors to authenticated;
grant select, insert, update, delete on public.hvs_ships to authenticated;

-- Optional realtime support. Publication entries must only be added once.
do $$
begin
  if not exists(select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'hvs_shots') then
    alter publication supabase_realtime add table public.hvs_shots;
  end if;
  if not exists(select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'hvs_ships') then
    alter publication supabase_realtime add table public.hvs_ships;
  end if;
end $$;
-- Etter valg av ansatte, godkjenn med:
-- insert into public.hvs_editors(email) values ('ansatt@eksempel.no')
-- on conflict do nothing;  -- BYTT ut med godkjent e-post, ikke bruk eksempeladresse.
