-- Schedule daily analytics aggregation at midnight UTC
SELECT cron.schedule(
  'aggregate-daily-analytics',
  '0 0 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://tenxnfduxdgybnocikkj.supabase.co/functions/v1/aggregate-analytics',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlbnhuZmR1eGRneWJub2Npa2tqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwOTEwNjgsImV4cCI6MjA4NDY2NzA2OH0.jI07BzJwYiOsucNkGSOzZOvxhw2piuRc4D93O_fl9mY"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);