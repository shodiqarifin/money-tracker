-- When a wallet is inserted, automatically add the creator as owner in wallet_members.
-- This is needed because the wallets SELECT policy checks wallet_members, so PostgREST's
-- insert().select() would fail (row not visible) if wallet_members isn't populated first.
-- ON CONFLICT DO NOTHING handles the handle_new_user trigger which also inserts there.

create or replace function public.handle_new_wallet()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.wallet_members (wallet_id, user_id, role)
  values (new.id, new.user_id, 'owner')
  on conflict do nothing;
  return new;
end;
$$;

create trigger on_wallet_created
  after insert on public.wallets
  for each row execute function public.handle_new_wallet();
