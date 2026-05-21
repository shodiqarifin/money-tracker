-- Change wallet_invitations unique constraint from (wallet_id, invited_email, status)
-- to (wallet_id, invited_email) — one row per user per wallet, status updated in place.
-- This prevents duplicate key errors when a user accepts an invitation after previously
-- having an 'accepted' row from earlier testing or re-invite scenarios.

-- Remove duplicate rows, keep only the most recent per (wallet_id, invited_email)
delete from public.wallet_invitations a
using public.wallet_invitations b
where a.wallet_id = b.wallet_id
  and a.invited_email = b.invited_email
  and a.created_at < b.created_at;

-- Drop old 3-column constraint
alter table public.wallet_invitations
  drop constraint wallet_invitations_wallet_id_invited_email_status_key;

-- One invitation record per wallet per email
alter table public.wallet_invitations
  add constraint wallet_invitations_wallet_id_invited_email_key
  unique (wallet_id, invited_email);
