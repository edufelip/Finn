-- Direct message (1:1) chat schema.

create table if not exists public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  participant_a uuid not null references public.profiles(id) on delete cascade,
  participant_b uuid not null references public.profiles(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  last_message_at timestamptz,
  last_message_preview text,
  constraint chat_threads_no_self check (participant_a <> participant_b),
  constraint chat_threads_ordered check (participant_a < participant_b),
  unique (participant_a, participant_b)
);

create table if not exists public.chat_members (
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz,
  primary key (thread_id, user_id)
);

create table if not exists public.chat_messages (
  id bigserial primary key,
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_chat_messages_thread_created
  on public.chat_messages (thread_id, created_at desc);

alter table public.chat_threads enable row level security;
alter table public.chat_members enable row level security;
alter table public.chat_messages enable row level security;

create policy "chat_threads_select_member"
  on public.chat_threads
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.chat_members
      where chat_members.thread_id = chat_threads.id
        and chat_members.user_id = auth.uid()
    )
  );

create policy "chat_threads_insert_creator"
  on public.chat_threads
  for insert
  to authenticated
  with check (
    auth.uid() = created_by
    and auth.uid() in (participant_a, participant_b)
  );

create policy "chat_threads_update_member"
  on public.chat_threads
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.chat_members
      where chat_members.thread_id = chat_threads.id
        and chat_members.user_id = auth.uid()
    )
  );

create policy "chat_members_select_self"
  on public.chat_members
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "chat_members_insert_creator"
  on public.chat_members
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    or exists (
      select 1
      from public.chat_threads
      where chat_threads.id = thread_id
        and chat_threads.created_by = auth.uid()
        and user_id in (chat_threads.participant_a, chat_threads.participant_b)
    )
  );

create policy "chat_members_update_self"
  on public.chat_members
  for update
  to authenticated
  using (auth.uid() = user_id);

create policy "chat_messages_select_member"
  on public.chat_messages
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.chat_members
      where chat_members.thread_id = chat_messages.thread_id
        and chat_members.user_id = auth.uid()
    )
  );

create policy "chat_messages_insert_member"
  on public.chat_messages
  for insert
  to authenticated
  with check (
    auth.uid() = sender_id
    and exists (
      select 1
      from public.chat_members
      where chat_members.thread_id = chat_messages.thread_id
        and chat_members.user_id = auth.uid()
    )
  );
