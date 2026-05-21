-- ============================================================
-- ENUMS
-- ============================================================
create type wallet_type as enum ('personal', 'family');
create type category_type as enum ('income', 'expense');

-- ============================================================
-- TABLES
-- ============================================================

create table public.wallets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null default 'My Wallet',
  type        wallet_type not null default 'personal',
  created_at  timestamptz not null default now()
);

create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  wallet_id   uuid not null references public.wallets(id) on delete cascade,
  name        text not null,
  type        category_type not null,
  is_preset   boolean not null default false,
  is_system   boolean not null default false,
  created_at  timestamptz not null default now()
);

create table public.transactions (
  id          uuid primary key default gen_random_uuid(),
  wallet_id   uuid not null references public.wallets(id) on delete cascade,
  category_id uuid not null references public.categories(id),
  amount      numeric(12, 2) not null,
  description text,
  date        timestamptz not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.wallets     enable row level security;
alter table public.categories  enable row level security;
alter table public.transactions enable row level security;

-- wallets
create policy "wallets: owner select"
  on public.wallets for select
  using (auth.uid() = user_id);

create policy "wallets: owner insert"
  on public.wallets for insert
  with check (auth.uid() = user_id);

create policy "wallets: owner update"
  on public.wallets for update
  using (auth.uid() = user_id);

-- categories
create policy "categories: owner select"
  on public.categories for select
  using (wallet_id in (select id from public.wallets where user_id = auth.uid()));

create policy "categories: owner insert"
  on public.categories for insert
  with check (wallet_id in (select id from public.wallets where user_id = auth.uid()));

create policy "categories: owner update"
  on public.categories for update
  using (wallet_id in (select id from public.wallets where user_id = auth.uid()));

create policy "categories: owner delete"
  on public.categories for delete
  using (wallet_id in (select id from public.wallets where user_id = auth.uid()));

-- transactions
create policy "transactions: owner select"
  on public.transactions for select
  using (wallet_id in (select id from public.wallets where user_id = auth.uid()));

create policy "transactions: owner insert"
  on public.transactions for insert
  with check (wallet_id in (select id from public.wallets where user_id = auth.uid()));

create policy "transactions: owner update"
  on public.transactions for update
  using (wallet_id in (select id from public.wallets where user_id = auth.uid()));

create policy "transactions: owner delete"
  on public.transactions for delete
  using (wallet_id in (select id from public.wallets where user_id = auth.uid()));

-- ============================================================
-- TRIGGER: auto-create wallet + categories on signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_wallet_id uuid := gen_random_uuid();
begin
  insert into public.wallets (id, user_id, name, type)
  values (new_wallet_id, new.id, 'My Wallet', 'personal');

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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
