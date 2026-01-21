import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.204.0/http/server.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

serve(async (req) => {
  // Only accept POST requests (for scheduled cron jobs)
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return jsonResponse({ error: 'Server not configured' }, 500);
  }

  // Optional: Verify cron secret for security
  const cronSecret = Deno.env.get('CRON_SECRET');
  if (cronSecret) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Call the database function to delete old messages
    const { data, error } = await supabase.rpc('delete_old_chat_messages');

    if (error) {
      console.error('Error deleting old messages:', error);
      return jsonResponse(
        { 
          error: 'Failed to delete old messages', 
          details: error.message 
        },
        500
      );
    }

    const deletedCount = data ?? 0;
    console.log(`Successfully deleted ${deletedCount} old chat messages`);

    return jsonResponse({
      status: 'ok',
      deleted_count: deletedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return jsonResponse(
      {
        error: 'Unexpected error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});
