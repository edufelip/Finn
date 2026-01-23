insert into storage.buckets (id, name, public)
values ('user-avatars', 'user-avatars', true)
on conflict (id) do update
set public = true;

drop policy if exists "storage_read_user_avatars_public" on storage.objects;
create policy "storage_read_user_avatars_public"
  on storage.objects
  for select
  to public
  using (bucket_id = 'user-avatars');

drop policy if exists "storage_insert_user_avatars_authenticated" on storage.objects;
create policy "storage_insert_user_avatars_authenticated"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'user-avatars' and auth.uid() = owner);

drop policy if exists "storage_update_user_avatars_authenticated" on storage.objects;
create policy "storage_update_user_avatars_authenticated"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'user-avatars' and auth.uid() = owner)
  with check (bucket_id = 'user-avatars' and auth.uid() = owner);

drop policy if exists "storage_delete_user_avatars_owner" on storage.objects;
create policy "storage_delete_user_avatars_owner"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'user-avatars' and owner = auth.uid());
