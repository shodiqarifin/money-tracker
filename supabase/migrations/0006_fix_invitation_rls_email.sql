-- Fix 403 on wallet_invitations queries.
-- `select email from auth.users` is not accessible to the authenticated role.
-- Use auth.jwt() ->> 'email' instead (reads from JWT, no table access needed).

drop policy "wallet_invitations: invited select" on public.wallet_invitations;
drop policy "wallet_invitations: invited update" on public.wallet_invitations;
drop policy "wallet_members: accept invitation"  on public.wallet_members;

create policy "wallet_invitations: invited select"
  on public.wallet_invitations for select
  using (invited_email = (auth.jwt() ->> 'email'));

create policy "wallet_invitations: invited update"
  on public.wallet_invitations for update
  using (invited_email = (auth.jwt() ->> 'email'));

create policy "wallet_members: accept invitation"
  on public.wallet_members for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.wallet_invitations
      where wallet_id = wallet_members.wallet_id
        and invited_email = (auth.jwt() ->> 'email')
        and status in ('pending', 'accepted')
        and expires_at > now()
    )
  );
