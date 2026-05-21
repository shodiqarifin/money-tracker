-- ============================================================
-- BUDGETS: limit bulanan per kategori expense
-- ============================================================

create table public.budgets (
  id          uuid primary key default gen_random_uuid(),
  wallet_id   uuid not null references public.wallets(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  amount      numeric(12, 2) not null check (amount > 0),
  month       date not null,
  created_at  timestamptz not null default now(),
  unique (category_id, month)
);

alter table public.budgets enable row level security;

create policy "budgets: owner select"
  on public.budgets for select
  using (wallet_id in (select id from public.wallets where user_id = auth.uid()));

create policy "budgets: owner insert"
  on public.budgets for insert
  with check (wallet_id in (select id from public.wallets where user_id = auth.uid()));

create policy "budgets: owner update"
  on public.budgets for update
  using (wallet_id in (select id from public.wallets where user_id = auth.uid()));

create policy "budgets: owner delete"
  on public.budgets for delete
  using (wallet_id in (select id from public.wallets where user_id = auth.uid()));
