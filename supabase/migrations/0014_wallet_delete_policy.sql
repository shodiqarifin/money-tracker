-- Allow wallet owners to delete their wallet (cascades to members, categories, transactions)
create policy "wallets: owner delete"
  on public.wallets for delete
  using (auth.uid() = user_id);
