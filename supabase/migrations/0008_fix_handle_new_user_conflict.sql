-- handle_new_user explicitly inserts into wallet_members, but the on_wallet_created
-- trigger now also does that. Add ON CONFLICT DO NOTHING so signup doesn't fail
-- with a unique violation when both inserts target the same (wallet_id, user_id).

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
  values (new_wallet_id, new.id, 'owner')
  on conflict do nothing;

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
