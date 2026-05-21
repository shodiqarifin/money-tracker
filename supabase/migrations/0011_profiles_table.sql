-- Public profiles table so wallet members can see each other's display names
-- without needing direct access to auth.users.

create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text,
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Anyone authenticated can read profiles (needed to show member names in wallet)
create policy "profiles: authenticated read"
  on public.profiles for select
  using (auth.role() = 'authenticated');

-- Users can only update their own profile
create policy "profiles: self update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Backfill existing users
insert into public.profiles (id, name)
select id, raw_user_meta_data->>'name'
from auth.users
on conflict (id) do nothing;

-- Auto-create profile on new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_wallet_id uuid := gen_random_uuid();
begin
  insert into public.profiles (id, name)
  values (new.id, new.raw_user_meta_data->>'name')
  on conflict (id) do nothing;

  insert into public.wallets (id, user_id, name, type)
  values (new_wallet_id, new.id, 'My Wallet', 'personal');

  insert into public.wallet_members (wallet_id, user_id, role)
  values (new_wallet_id, new.id, 'owner')
  on conflict do nothing;

  insert into public.categories (wallet_id, name, type, is_preset, is_system)
  values
    (new_wallet_id, 'Uncategorized', 'income',  false, true),
    (new_wallet_id, 'Uncategorized', 'expense', false, true),
    (new_wallet_id, 'Gaji / Income',        'income',  true, false),
    (new_wallet_id, 'Bonus / Extra Income', 'income',  true, false),
    (new_wallet_id, 'Transportasi',         'expense', true, false),
    (new_wallet_id, 'Makan & Minum',        'expense', true, false),
    (new_wallet_id, 'Hiburan',              'expense', true, false),
    (new_wallet_id, 'Belanja Kebutuhan',    'expense', true, false),
    (new_wallet_id, 'Kesehatan',            'expense', true, false);

  return new;
end;
$$;
