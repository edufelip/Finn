-- Storage buckets and policies for Finn

insert into storage.buckets (id, name, public)
values
  ('profile-images', 'profile-images', false),
  ('community-images', 'community-images', false),
  ('post-images', 'post-images', false)
on conflict (id) do nothing;

create policy "Profile images readable by authenticated"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'profile-images');

create policy "Profile images insert by owner"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'profile-images' and auth.uid() = owner);

create policy "Profile images update by owner"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'profile-images' and auth.uid() = owner);

create policy "Profile images delete by owner"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'profile-images' and auth.uid() = owner);

create policy "Community images readable by authenticated"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'community-images');

create policy "Community images insert by owner"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'community-images' and auth.uid() = owner);

create policy "Community images update by owner"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'community-images' and auth.uid() = owner);

create policy "Community images delete by owner"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'community-images' and auth.uid() = owner);

create policy "Post images readable by authenticated"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'post-images');

create policy "Post images insert by owner"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'post-images' and auth.uid() = owner);

create policy "Post images update by owner"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'post-images' and auth.uid() = owner);

create policy "Post images delete by owner"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'post-images' and auth.uid() = owner);
