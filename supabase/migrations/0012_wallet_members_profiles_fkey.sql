-- Add FK from wallet_members.user_id to profiles.id so PostgREST can discover
-- the relationship and allow join syntax: profile:profiles(name)
alter table public.wallet_members
  add constraint wallet_members_user_id_profiles_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;
