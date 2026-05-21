-- Allow users to insert themselves into wallet_members when accepting an invitation.
-- The original "owner insert" policy only allowed wallet owners to add members,
-- which blocked the invite-accept flow for non-owner users.

create policy "wallet_members: accept invitation"
  on public.wallet_members for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.wallet_invitations
      where wallet_id = wallet_members.wallet_id
        and invited_email = (select email from auth.users where id = auth.uid())
        and status in ('pending', 'accepted')
        and expires_at > now()
    )
  );
