-- Allow comments to survive user deletion by nulling user_id.

alter table public.comments
  alter column user_id drop not null;

alter table public.comments
  drop constraint if exists comments_user_id_fkey;

alter table public.comments
  add constraint comments_user_id_fkey
  foreign key (user_id)
  references public.profiles(id)
  on delete set null;
