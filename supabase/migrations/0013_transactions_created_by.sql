-- Track who created and last edited each transaction for collaborative wallets.

alter table public.transactions
  add column created_by uuid references public.profiles(id) on delete set null,
  add column updated_by uuid references public.profiles(id) on delete set null;

-- Backfill existing rows: assume wallet owner created them
update public.transactions t
set created_by = w.user_id
from public.wallets w
where t.wallet_id = w.id
  and t.created_by is null;
