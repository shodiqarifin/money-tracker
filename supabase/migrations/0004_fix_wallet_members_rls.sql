-- Fix infinite recursion in wallet_members SELECT policy (Postgres error 42P17).
-- The original policy queried wallet_members inside a policy ON wallet_members,
-- creating a recursive loop. We break the cycle with a SECURITY DEFINER function
-- that bypasses RLS when fetching the current user's wallet IDs.

create or replace function public.get_my_wallet_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select wallet_id from public.wallet_members where user_id = auth.uid()
$$;

drop policy "wallet_members: select" on public.wallet_members;

create policy "wallet_members: select"
  on public.wallet_members for select
  using (wallet_id in (select public.get_my_wallet_ids()));
