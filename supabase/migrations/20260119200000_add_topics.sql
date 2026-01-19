-- Create topics table
create table if not exists public.topics (
  id bigserial primary key,
  name text not null unique,
  label text not null,
  icon text not null,
  tone text not null check (tone in ('orange', 'green', 'purple', 'blue')),
  created_at timestamptz not null default now()
);

alter table public.topics enable row level security;

-- Topics are readable by all authenticated users
drop policy if exists "topics_select_authenticated" on public.topics;
create policy "topics_select_authenticated"
  on public.topics
  for select
  to authenticated
  using (true);

-- Add topic_id to communities table
alter table public.communities add column if not exists topic_id bigint references public.topics(id);
create index if not exists idx_communities_topic_id on public.communities(topic_id);

-- Seed topics with a good variety
insert into public.topics (name, label, icon, tone) values
  ('gaming', 'Gaming', 'sports-esports', 'orange'),
  ('music', 'Music', 'music-note', 'green'),
  ('movies', 'Movies & TV', 'movie', 'purple'),
  ('science', 'Science', 'science', 'blue'),
  ('technology', 'Technology', 'computer', 'orange'),
  ('sports', 'Sports', 'sports-soccer', 'green'),
  ('art', 'Art & Design', 'palette', 'purple'),
  ('food', 'Food & Cooking', 'restaurant', 'blue'),
  ('travel', 'Travel', 'flight', 'orange'),
  ('fitness', 'Fitness & Health', 'fitness-center', 'green'),
  ('books', 'Books & Literature', 'menu-book', 'purple'),
  ('photography', 'Photography', 'camera-alt', 'blue'),
  ('fashion', 'Fashion & Style', 'checkroom', 'orange'),
  ('business', 'Business & Finance', 'business-center', 'green'),
  ('education', 'Education & Learning', 'school', 'purple'),
  ('pets', 'Pets & Animals', 'pets', 'blue'),
  ('nature', 'Nature & Environment', 'park', 'orange'),
  ('home', 'Home & Garden', 'home', 'green'),
  ('diy', 'DIY & Crafts', 'build', 'purple'),
  ('comedy', 'Comedy & Memes', 'sentiment-satisfied-alt', 'blue'),
  ('news', 'News & Politics', 'feed', 'orange'),
  ('automotive', 'Automotive', 'directions-car', 'green'),
  ('parenting', 'Parenting & Family', 'family-restroom', 'purple'),
  ('spirituality', 'Spirituality', 'self-improvement', 'blue'),
  ('history', 'History', 'history-edu', 'orange'),
  ('other', 'Other', 'more-horiz', 'green')
on conflict (name) do nothing;
