-- Create RPC function to get popular topics ordered by community count
create or replace function public.get_popular_topics(limit_count int default 8)
returns table (
  id bigint,
  name text,
  label text,
  icon text,
  tone text,
  created_at timestamptz,
  community_count bigint
)
language sql
stable
as $$
  select 
    t.id,
    t.name,
    t.label,
    t.icon,
    t.tone,
    t.created_at,
    count(c.id) as community_count
  from public.topics t
  left join public.communities c on t.id = c.topic_id
  group by t.id, t.name, t.label, t.icon, t.tone, t.created_at
  order by community_count desc, t.label asc
  limit limit_count;
$$;

-- Grant execute permission to authenticated and anon users
grant execute on function public.get_popular_topics(int) to authenticated;
grant execute on function public.get_popular_topics(int) to anon;
