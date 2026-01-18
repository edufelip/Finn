#!/usr/bin/env node
/* eslint-env node */
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const repoRoot = path.resolve(__dirname, '..');

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) continue;
    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const env = {
  ...readEnvFile(path.join(repoRoot, '.env')),
  ...readEnvFile(path.join(repoRoot, '.env.local')),
};

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    'Missing SUPABASE_SERVICE_ROLE_KEY or EXPO_PUBLIC_SUPABASE_URL. Set them in the shell or .env.'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const seedUsers = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'ava@finn.dev',
    password: 'password123',
    name: 'Ava Rivers',
    avatarUrl: 'https://picsum.photos/seed/ava-profile/300/300',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'leo@finn.dev',
    password: 'password123',
    name: 'Leo Park',
    avatarUrl: 'https://picsum.photos/seed/leo-profile/300/300',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'maya@finn.dev',
    password: 'password123',
    name: 'Maya Ortiz',
    avatarUrl: 'https://picsum.photos/seed/maya-profile/300/300',
  },
];

async function findUserByEmail(email) {
  const { data: directUser, error: directError } = await supabase
    .schema('auth')
    .from('users')
    .select('id,email')
    .eq('email', email)
    .maybeSingle();

  if (!directError && directUser?.id) {
    return directUser;
  }

  const perPage = 200;
  for (const startPage of [0, 1]) {
    let page = startPage;
    for (let attempts = 0; attempts < 10; attempts += 1) {
      const { data: listData, error: listError } = await supabase.auth.admin.listUsers({
        page,
        perPage,
      });
      if (listError) {
        throw listError;
      }
      const found = listData?.users?.find((entry) => entry.email === email);
      if (found) {
        return found;
      }
      if (!listData?.users?.length) {
        break;
      }
      if (listData?.nextPage === null || listData?.nextPage === undefined) {
        page += 1;
      } else if (listData.nextPage <= page) {
        break;
      } else {
        page = listData.nextPage;
      }
    }
  }

  return null;
}

async function ensureUser(user) {
  try {
    const existing = await findUserByEmail(user.email);
    if (existing?.id) {
      await supabase.auth.admin.updateUserById(existing.id, {
        user_metadata: {
          name: user.name,
          avatar_url: user.avatarUrl,
        },
      });
      return existing;
    }

    const { data, error } = await supabase.auth.admin.createUser({
      id: user.id,
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: {
        name: user.name,
        avatar_url: user.avatarUrl,
      },
    });

    if (error) {
      throw error;
    }
    return data.user;
  } catch (error) {
    const errorMessage =
      typeof error === 'string' ? error : (error?.message || '').toString();

    if (!errorMessage.toLowerCase().includes('already registered')) {
      throw error;
    }
    const found = await findUserByEmail(user.email);
    if (!found?.id) {
      throw new Error(`User already registered but could not be found: ${user.email}`);
    }
    await supabase.auth.admin.updateUserById(found.id, {
      user_metadata: {
        name: user.name,
        avatar_url: user.avatarUrl,
      },
    });
    return found;
  }
}

async function main() {
  console.log('Seeding users...');
  for (const user of seedUsers) {
    await ensureUser(user);
  }

  console.log('Seeding profiles...');
  const { error: profileError } = await supabase.from('profiles').upsert(
    seedUsers.map((user) => ({
      id: user.id,
      name: user.name,
      photo_url: user.avatarUrl,
      last_seen_at: new Date().toISOString(),
    })),
    { onConflict: 'id' }
  );
  if (profileError) throw profileError;

  console.log('Seeding communities...');
  const communitiesSeed = [
    {
      key: 'trail',
      title: 'Trail & Tide',
      description: 'Hikes, coast runs, and weekend routes.',
      image_url: 'https://picsum.photos/seed/community-1/900/600',
      owner_id: seedUsers[0].id,
    },
    {
      key: 'city',
      title: 'City Suppers',
      description: 'Food spots, home recipes, and pop-up dinners.',
      image_url: 'https://picsum.photos/seed/community-2/900/600',
      owner_id: seedUsers[1].id,
    },
  ];

  const { data: existingCommunities, error: communityFetchError } = await supabase
    .from('communities')
    .select('id,title,owner_id')
    .in(
      'title',
      communitiesSeed.map((community) => community.title)
    );
  if (communityFetchError) throw communityFetchError;

  const communityIdMap = new Map();
  for (const community of communitiesSeed) {
    const existing = (existingCommunities || []).find(
      (row) => row.title === community.title && row.owner_id === community.owner_id
    );
    if (existing) {
      communityIdMap.set(community.key, existing.id);
      continue;
    }
    const { key, ...payload } = community;
    const { data, error } = await supabase
      .from('communities')
      .insert(payload)
      .select('id')
      .single();
    if (error) throw error;
    communityIdMap.set(community.key, data.id);
  }

  console.log('Seeding posts...');
  const postsSeed = [
    {
      content: 'Sunrise loop on the ridge this morning. Worth the early alarm.',
      image_url: 'https://picsum.photos/seed/post-1/1200/900',
      community_id: communityIdMap.get('trail'),
      user_id: seedUsers[0].id,
    },
    {
      content: 'Quick ramen guide for the weeknight crowd.',
      image_url: 'https://picsum.photos/seed/post-2/1200/900',
      community_id: communityIdMap.get('city'),
      user_id: seedUsers[1].id,
    },
    {
      content: 'Trail tip: bring a light shell even if the forecast is clear.',
      image_url: null,
      community_id: communityIdMap.get('trail'),
      user_id: seedUsers[2].id,
    },
  ];

  const { data: existingPosts, error: postsFetchError } = await supabase
    .from('posts')
    .select('id,content,user_id')
    .in(
      'content',
      postsSeed.map((post) => post.content)
    );
  if (postsFetchError) throw postsFetchError;

  const existingPostKeys = new Set(
    (existingPosts || []).map((row) => `${row.content}:${row.user_id}`)
  );

  const postsToInsert = postsSeed.filter(
    (post) => !existingPostKeys.has(`${post.content}:${post.user_id}`)
  );

  if (postsToInsert.length) {
    const { error: insertPostsError } = await supabase.from('posts').insert(postsToInsert);
    if (insertPostsError) throw insertPostsError;
  }

  console.log('Seed complete.');
}

main().catch((error) => {
  console.error('Seed failed:', error?.message || error);
  process.exit(1);
});
