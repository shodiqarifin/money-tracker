-- ============================================================
-- COLLABORATION: multi-member wallets + invite system
-- ============================================================

-- Many-to-many: wallet ↔ user membership
create table public.wallet_members (
  wallet_id   uuid not null references public.wallets(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null check (role in ('owner', 'member')) default 'member',
  joined_at   timestamptz not null default now(),
  primary key (wallet_id, user_id)
);

-- Pending invitations sent by owners
create table public.wallet_invitations (
  id             uuid primary key default gen_random_uuid(),
  wallet_id      uuid not null references public.wallets(id) on delete cascade,
  invited_email  text not null,
  invited_by     uuid not null references auth.users(id),
  token          text not null unique default encode(gen_random_bytes(32), 'hex'),
  status         text not null check (status in ('pending', 'accepted', 'rejected')) default 'pending',
  expires_at     timestamptz not null default (now() + interval '7 days'),
  created_at     timestamptz not null default now(),
  unique (wallet_id, invited_email, status)
);

-- ============================================================
-- Migrate existing data: make current wallet owners members
-- ============================================================
insert into public.wallet_members (wallet_id, user_id, role)
select id, user_id, 'owner' from public.wallets;

-- ============================================================
-- RLS for new tables
-- ============================================================
alter table public.wallet_members    enable row level security;
alter table public.wallet_invitations enable row level security;

-- wallet_members: members can see other members of the same wallet
create policy "wallet_members: select"
  on public.wallet_members for select
  using (wallet_id in (
    select wallet_id from public.wallet_members where user_id = auth.uid()
  ));

-- Only the wallet owner can add new members
create policy "wallet_members: owner insert"
  on public.wallet_members for insert
  with check (wallet_id in (
    select id from public.wallets where user_id = auth.uid()
  ));

-- Owner can remove anyone; a member can remove themselves (leave)
create policy "wallet_members: remove"
  on public.wallet_members for delete
  using (
    user_id = auth.uid()
    or wallet_id in (select id from public.wallets where user_id = auth.uid())
  );

-- wallet_invitations: owner can do everything on their wallet's invitations
create policy "wallet_invitations: owner all"
  on public.wallet_invitations for all
  using (wallet_id in (
    select id from public.wallets where user_id = auth.uid()
  ));

-- Invited user can see invitations addressed to their email
create policy "wallet_invitations: invited select"
  on public.wallet_invitations for select
  using (invited_email = (select email from auth.users where id = auth.uid()));

-- Invited user can update status (accept/reject)
create policy "wallet_invitations: invited update"
  on public.wallet_invitations for update
  using (invited_email = (select email from auth.users where id = auth.uid()));

-- ============================================================
-- Update RLS on existing tables to use membership
-- ============================================================

-- wallets: members (not just owner) can select
drop policy "wallets: owner select" on public.wallets;
create policy "wallets: member select"
  on public.wallets for select
  using (id in (
    select wallet_id from public.wallet_members where user_id = auth.uid()
  ));

-- categories: members can select/insert/update/delete
drop policy "categories: owner select"  on public.categories;
drop policy "categories: owner insert"  on public.categories;
drop policy "categories: owner update"  on public.categories;
drop policy "categories: owner delete"  on public.categories;

create policy "categories: member select"
  on public.categories for select
  using (wallet_id in (
    select wallet_id from public.wallet_members where user_id = auth.uid()
  ));

create policy "categories: member insert"
  on public.categories for insert
  with check (wallet_id in (
    select wallet_id from public.wallet_members where user_id = auth.uid()
  ));

create policy "categories: member update"
  on public.categories for update
  using (wallet_id in (
    select wallet_id from public.wallet_members where user_id = auth.uid()
  ));

create policy "categories: member delete"
  on public.categories for delete
  using (wallet_id in (
    select wallet_id from public.wallet_members where user_id = auth.uid()
  ));

-- transactions: members can select/insert/update/delete
drop policy "transactions: owner select"  on public.transactions;
drop policy "transactions: owner insert"  on public.transactions;
drop policy "transactions: owner update"  on public.transactions;
drop policy "transactions: owner delete"  on public.transactions;

create policy "transactions: member select"
  on public.transactions for select
  using (wallet_id in (
    select wallet_id from public.wallet_members where user_id = auth.uid()
  ));

create policy "transactions: member insert"
  on public.transactions for insert
  with check (wallet_id in (
    select wallet_id from public.wallet_members where user_id = auth.uid()
  ));

create policy "transactions: member update"
  on public.transactions for update
  using (wallet_id in (
    select wallet_id from public.wallet_members where user_id = auth.uid()
  ));

create policy "transactions: member delete"
  on public.transactions for delete
  using (wallet_id in (
    select wallet_id from public.wallet_members where user_id = auth.uid()
  ));

-- budgets: members can manage
drop policy "budgets: owner select"  on public.budgets;
drop policy "budgets: owner insert"  on public.budgets;
drop policy "budgets: owner update"  on public.budgets;
drop policy "budgets: owner delete"  on public.budgets;

create policy "budgets: member select"
  on public.budgets for select
  using (wallet_id in (
    select wallet_id from public.wallet_members where user_id = auth.uid()
  ));

create policy "budgets: member insert"
  on public.budgets for insert
  with check (wallet_id in (
    select wallet_id from public.wallet_members where user_id = auth.uid()
  ));

create policy "budgets: member update"
  on public.budgets for update
  using (wallet_id in (
    select wallet_id from public.wallet_members where user_id = auth.uid()
  ));

create policy "budgets: member delete"
  on public.budgets for delete
  using (wallet_id in (
    select wallet_id from public.wallet_members where user_id = auth.uid()
  ));

-- ============================================================
-- Update trigger to also insert into wallet_members
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

  insert into public.wallet_members (wallet_id, user_id, role)
  values (new_wallet_id, new.id, 'owner');

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
