-- Verify the scheduled cleanup job
SELECT 
    jobid, 
    jobname, 
    schedule, 
    command,
    active,
    database
FROM cron.job 
WHERE jobname = 'cleanup-old-chat-messages';
