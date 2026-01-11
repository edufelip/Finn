-- Make post images and user avatars publicly readable.

insert into storage.buckets (id, name, public)
values
  ('user-avatars', 'user-avatars', true),
  ('post-images', 'post-images', true)
on conflict (id) do update set public = excluded.public;

create policy "User avatars readable by anyone"
  on storage.objects for select
  to public
  using (bucket_id = 'user-avatars');

create policy "User avatars insert by owner"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'user-avatars' and auth.uid() = owner);

create policy "User avatars update by owner"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'user-avatars' and auth.uid() = owner);

create policy "User avatars delete by owner"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'user-avatars' and auth.uid() = owner);

create policy "Post images readable by anyone"
  on storage.objects for select
  to public
  using (bucket_id = 'post-images');
