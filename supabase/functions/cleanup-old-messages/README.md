# Chat Message Cleanup Edge Function

This Edge Function deletes chat messages older than 14 days as part of the chat retention policy.

## Setup

### 1. Deploy the Edge Function

```bash
supabase functions deploy cleanup-old-messages
```

### 2. Set Environment Variables

In your Supabase Dashboard, set the following secret (optional, for security):

```bash
supabase secrets set CRON_SECRET=your-random-secret-here
```

### 3. Schedule the Function

You have several options to schedule this function:

#### Option A: Using Supabase CLI with pg_cron (Recommended)

If your Supabase project has the pg_cron extension enabled:

```sql
-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the function to run daily at 2 AM UTC
SELECT cron.schedule(
  'cleanup-old-chat-messages',
  '0 2 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://your-project-ref.supabase.co/functions/v1/cleanup-old-messages',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer your-cron-secret-here'
      ),
      body := '{}'::jsonb
    )
  $$
);
```

#### Option B: Using External Cron Service

Use services like:
- GitHub Actions (with scheduled workflows)
- Vercel Cron Jobs
- AWS EventBridge
- Cloudflare Workers Cron Triggers

Example GitHub Actions workflow:

```yaml
name: Cleanup Old Messages
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Call cleanup function
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json" \
            https://your-project-ref.supabase.co/functions/v1/cleanup-old-messages
```

#### Option C: Manual Trigger

You can also manually trigger the cleanup:

```bash
curl -X POST \
  -H "Authorization: Bearer your-cron-secret" \
  -H "Content-Type: application/json" \
  https://your-project-ref.supabase.co/functions/v1/cleanup-old-messages
```

## Response Format

Success:
```json
{
  "status": "ok",
  "deleted_count": 42,
  "timestamp": "2026-01-21T02:00:00.000Z"
}
```

Error:
```json
{
  "error": "Failed to delete old messages",
  "details": "error message"
}
```

## Testing

To test the function locally:

```bash
# Start Supabase locally
supabase start

# Deploy function locally
supabase functions serve cleanup-old-messages

# Test it
curl -X POST http://localhost:54321/functions/v1/cleanup-old-messages
```

## Monitoring

Check the function logs:

```bash
supabase functions logs cleanup-old-messages
```

Or in the Supabase Dashboard:
- Navigate to Edge Functions
- Select "cleanup-old-messages"
- View logs and invocations
