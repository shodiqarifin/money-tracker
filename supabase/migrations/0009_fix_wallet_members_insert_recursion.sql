-- Fix infinite recursion on wallet_members INSERT/DELETE policies.
--
-- Root cause: INSERT/DELETE policies queried wallets (via subquery), which triggered
-- wallets SELECT policy, which queried wallet_members again → cycle detected by Postgres.
-- Even though wallet_members SELECT uses a SECURITY DEFINER function, the cycle is
-- detected at the table level during INSERT/DELETE policy evaluation.
--
-- Solution: wrap all cross-table lookups used in wallet_members INSERT/DELETE policies
-- inside SECURITY DEFINER functions so RLS on those tables is bypassed entirely.

-- Helper: check if current user owns a given wallet (bypasses wallets RLS)
create or replace function public.user_owns_wallet(wid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.wallets where id = wid and user_id = auth.uid()
  )
$$;

-- Helper: check if current user has a valid invitation for a given wallet (bypasses wallet_invitations RLS)
create or replace function public.has_valid_invitation(wid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.wallet_invitations
    where wallet_id = wid
      and invited_email = (auth.jwt() ->> 'email')
      and status in ('pending', 'accepted')
      and expires_at > now()
  )
$$;

-- Rewrite INSERT policies to use SECURITY DEFINER helpers
drop policy "wallet_members: owner insert"      on public.wallet_members;
drop policy "wallet_members: accept invitation" on public.wallet_members;

create policy "wallet_members: owner insert"
  on public.wallet_members for insert
  with check (public.user_owns_wallet(wallet_id));

create policy "wallet_members: accept invitation"
  on public.wallet_members for insert
  with check (
    user_id = auth.uid()
    and public.has_valid_invitation(wallet_id)
  );

-- Rewrite DELETE policy for the same reason
drop policy "wallet_members: remove" on public.wallet_members;

create policy "wallet_members: remove"
  on public.wallet_members for delete
  using (
    user_id = auth.uid()
    or public.user_owns_wallet(wallet_id)
  );
