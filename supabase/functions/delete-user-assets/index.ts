import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.204.0/http/server.ts';

type DeleteUserAssetsRequest = {
  userId?: string;
};

const BUCKETS = ['user-avatars', 'post-images', 'community-images'] as const;

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const deleteUserFiles = async (bucket: string, userId: string) => {
  const supabase = createClient(supabaseUrl ?? '', supabaseServiceKey ?? '', {
    auth: { persistSession: false },
  });
  const limit = 100;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list(userId, { limit, offset });
    if (error) {
      throw error;
    }
    const items = data ?? [];
    if (!items.length) {
      break;
    }
    const paths = items.map((item) => `${userId}/${item.name}`);
    const { error: removeError } = await supabase.storage.from(bucket).remove(paths);
    if (removeError) {
      throw removeError;
    }
    if (items.length < limit) {
      break;
    }
    offset += items.length;
  }
};

serve(async (req) => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return jsonResponse({ error: 'Server not configured' }, 500);
  }

  let body: DeleteUserAssetsRequest = {};
  try {
    body = (await req.json()) as DeleteUserAssetsRequest;
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const userId = body.userId?.trim();
  if (!userId) {
    return jsonResponse({ error: 'userId is required' }, 400);
  }

  const authHeader = req.headers.get('authorization') ?? '';
  const jwt = authHeader.replace('Bearer ', '');

  if (!jwt) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const authClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
  const { data, error } = await authClient.auth.getUser(jwt);
  if (error || !data?.user?.id || data.user.id !== userId) {
    return jsonResponse({ error: 'Forbidden' }, 403);
  }

  try {
    await Promise.all(BUCKETS.map((bucket) => deleteUserFiles(bucket, userId)));
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Cleanup failed' },
      500
    );
  }

  return jsonResponse({ status: 'ok' });
});
