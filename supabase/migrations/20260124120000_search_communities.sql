-- Add RPC function for searching communities with pagination and sorting.
create or replace function public.search_communities(
  search_text text default '',
  topic_filter bigint default null,
  sort_order text default 'mostFollowed',
  limit_count int default 20,
  offset_count int default 0
)
returns table (
  id bigint,
  title text,
  description text,
  image_url text,
  owner_id uuid,
  topic_id bigint,
  created_at timestamptz,
  post_permission text,
  subscribers_count bigint
)
language sql
stable
as $$
  select
    c.id,
    c.title,
    c.description,
    c.image_url,
    c.owner_id,
    c.topic_id,
    c.created_at,
    c.post_permission,
    coalesce(count(s.id), 0) as subscribers_count
  from public.communities c
  left join public.subscriptions s on s.community_id = c.id
  where (search_text is null or c.title ilike ('%' || search_text || '%'))
    and (topic_filter is null or c.topic_id = topic_filter)
  group by
    c.id,
    c.title,
    c.description,
    c.image_url,
    c.owner_id,
    c.topic_id,
    c.created_at,
    c.post_permission
  order by
    case when coalesce(sort_order, 'mostFollowed') = 'mostFollowed' then count(s.id) end desc,
    case when coalesce(sort_order, 'mostFollowed') = 'leastFollowed' then count(s.id) end asc,
    case when coalesce(sort_order, 'mostFollowed') = 'newest' then c.created_at end desc,
    case when coalesce(sort_order, 'mostFollowed') = 'oldest' then c.created_at end asc,
    c.id asc
  limit limit_count
  offset offset_count;
$$;
