-- Migration: Add last_accessed column to spaces table
-- This file contains the SQL migration and cleanup job setup for the last_accessed feature

-- 1. Add last_accessed column to spaces table
ALTER TABLE spaces 
ADD COLUMN last_accessed TIMESTAMPTZ DEFAULT NULL;

-- 2. Create an index on last_accessed for efficient cleanup queries
CREATE INDEX idx_spaces_last_accessed ON spaces(last_accessed);

-- 3. Update existing spaces to set last_accessed to created_at (or current time if created_at is null)
UPDATE spaces 
SET last_accessed = COALESCE(created_at, NOW())
WHERE last_accessed IS NULL;

-- 4. Create a function to clean up old spaces
CREATE OR REPLACE FUNCTION cleanup_old_spaces()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete spaces that haven't been accessed in 30 days
    -- Also delete spaces with NULL last_accessed that are older than 30 days
    DELETE FROM spaces 
    WHERE 
        (last_accessed IS NOT NULL AND last_accessed < NOW() - INTERVAL '30 days')
        OR 
        (last_accessed IS NULL AND created_at IS NOT NULL AND created_at < NOW() - INTERVAL '30 days')
        OR
        (last_accessed IS NULL AND created_at IS NULL AND FALSE); -- Don't delete if both are null (shouldn't happen)
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log the cleanup operation
    INSERT INTO public.cleanup_log (operation, deleted_count, executed_at)
    VALUES ('cleanup_old_spaces', deleted_count, NOW())
    ON CONFLICT DO NOTHING; -- In case cleanup_log table doesn't exist
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create a simple cleanup log table (optional, for monitoring)
CREATE TABLE IF NOT EXISTS cleanup_log (
    id SERIAL PRIMARY KEY,
    operation TEXT NOT NULL,
    deleted_count INTEGER NOT NULL DEFAULT 0,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Create the cron job to run cleanup daily at 2 AM UTC
-- Note: This requires the pg_cron extension to be enabled in Supabase
-- You can enable it in the Supabase dashboard under Database > Extensions

-- First, enable the pg_cron extension (run this in the SQL Editor):
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Then create the cron job:
SELECT cron.schedule(
    'cleanup-old-spaces', -- job name
    '0 2 * * *',         -- cron expression: daily at 2 AM UTC
    'SELECT cleanup_old_spaces();' -- SQL command to execute
);

-- 7. Optional: Create a manual cleanup function that returns more details
CREATE OR REPLACE FUNCTION manual_cleanup_old_spaces()
RETURNS TABLE(
    deleted_count INTEGER,
    cleanup_summary TEXT
) AS $$
DECLARE
    count_deleted INTEGER;
    summary_text TEXT;
BEGIN
    -- Get count of spaces that will be deleted
    SELECT COUNT(*) INTO count_deleted
    FROM spaces 
    WHERE 
        (last_accessed IS NOT NULL AND last_accessed < NOW() - INTERVAL '30 days')
        OR 
        (last_accessed IS NULL AND created_at IS NOT NULL AND created_at < NOW() - INTERVAL '30 days');
    
    -- Perform the cleanup
    PERFORM cleanup_old_spaces();
    
    -- Create summary
    summary_text := format('Deleted %s spaces that were inactive for more than 30 days', count_deleted);
    
    RETURN QUERY SELECT count_deleted, summary_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Grant necessary permissions (adjust as needed for your RLS policies)
-- These might need to be adjusted based on your existing RLS setup

-- Example RLS policy to allow updating last_accessed (you may need to modify this)
-- CREATE POLICY "Allow updating last_accessed" ON spaces 
-- FOR UPDATE USING (true) 
-- WITH CHECK (true);

-- To manually run the cleanup function:
-- SELECT * FROM manual_cleanup_old_spaces();

-- To check the cron job status:
-- SELECT * FROM cron.job WHERE jobname = 'cleanup-old-spaces';

-- To remove the cron job if needed:
-- SELECT cron.unschedule('cleanup-old-spaces');
