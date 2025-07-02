# Last Accessed Column Implementation

This document outlines the implementation of the `last_accessed` column for the spaces table, which tracks when spaces were last accessed and automatically deletes spaces that haven't been accessed in 30 days.

## Overview

The implementation includes:
1. Adding a `last_accessed` column to the spaces table
2. Updating the timestamp whenever a space is accessed
3. Automatic cleanup of spaces older than 30 days via SQL cron job

## Files Modified

### 1. `database.types.ts`
- Added `last_accessed: string | null` to the `spaces` table Row, Insert, and Update types

### 2. `app/lib/space-utils.ts`
- Added `updateLastAccessed()` function to update the timestamp
- Modified `checkSpaceRequirements()` to update `last_accessed` when spaces are loaded
- Modified `joinSpace()` to update `last_accessed` when users authenticate
- Modified `createSpace()` to set initial `last_accessed` timestamp

### 3. `sql-migration-last-accessed.sql` (new file)
- Contains the complete SQL migration and cron job setup

## Implementation Steps

### Step 1: Database Migration

Run the SQL migration in your Supabase dashboard:

```bash
# Navigate to your Supabase project dashboard
# Go to Database > SQL Editor
# Copy and paste the contents of sql-migration-last-accessed.sql
# Run the migration
```

The migration will:
- Add the `last_accessed` column to the spaces table
- Create an index for efficient queries
- Set up the cleanup function and cron job
- Initialize existing spaces with appropriate timestamps

### Step 2: Enable pg_cron Extension

In your Supabase dashboard:
1. Go to Database > Extensions
2. Enable the `pg_cron` extension
3. This is required for the automatic cleanup job

### Step 3: Verify Implementation

After running the migration, you can verify everything is working:

```sql
-- Check that the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'spaces' AND column_name = 'last_accessed';

-- Check that the cron job was created
SELECT * FROM cron.job WHERE jobname = 'cleanup-old-spaces';

-- Manually test the cleanup function
SELECT * FROM manual_cleanup_old_spaces();
```

## How It Works

### Last Accessed Updates

The `last_accessed` timestamp is updated in these scenarios:

1. **Space Loading**: When `checkSpaceRequirements()` is called (every time someone accesses a space)
2. **Authentication**: When `joinSpace()` succeeds (when someone enters a correct password)
3. **Space Creation**: When `createSpace()` is called (initial timestamp)

### Automatic Cleanup

- A cron job runs daily at 2 AM UTC
- It deletes spaces where `last_accessed` is older than 30 days
- It also handles edge cases where `last_accessed` might be null
- Cleanup operations are logged in the `cleanup_log` table

### Monitoring

You can monitor the cleanup process:

```sql
-- View cleanup history
SELECT * FROM cleanup_log ORDER BY executed_at DESC;

-- Check spaces that will be deleted in the next cleanup
SELECT id, title, last_accessed, created_at
FROM spaces 
WHERE 
    (last_accessed IS NOT NULL AND last_accessed < NOW() - INTERVAL '30 days')
    OR 
    (last_accessed IS NULL AND created_at IS NOT NULL AND created_at < NOW() - INTERVAL '30 days');

-- Count spaces by age
SELECT 
    CASE 
        WHEN last_accessed > NOW() - INTERVAL '7 days' THEN 'Last 7 days'
        WHEN last_accessed > NOW() - INTERVAL '30 days' THEN 'Last 30 days'
        ELSE 'Older than 30 days'
    END as age_group,
    COUNT(*) as space_count
FROM spaces 
WHERE last_accessed IS NOT NULL
GROUP BY age_group;
```

## Manual Operations

### Manual Cleanup

To manually run the cleanup:

```sql
SELECT * FROM manual_cleanup_old_spaces();
```

### Disable/Enable Cleanup

To temporarily disable the cron job:

```sql
SELECT cron.unschedule('cleanup-old-spaces');
```

To re-enable it:

```sql
SELECT cron.schedule(
    'cleanup-old-spaces',
    '0 2 * * *',
    'SELECT cleanup_old_spaces();'
);
```

### Update Cleanup Interval

To change the 30-day interval, modify the cleanup function:

```sql
CREATE OR REPLACE FUNCTION cleanup_old_spaces()
RETURNS INTEGER AS $$
-- Change '30 days' to your desired interval (e.g., '60 days', '7 days')
-- in the function body
$$;
```

## Testing

After implementation, you can test the feature:

1. **Access Tracking**: Visit a space and check that `last_accessed` is updated
2. **Authentication Tracking**: Enter a password for a protected space
3. **Cleanup Function**: Use the manual cleanup function to verify it works

```sql
-- Test that last_accessed is being updated
SELECT id, title, last_accessed FROM spaces WHERE id = 'your-space-id';
```

## Notes

- The `last_accessed` timestamp uses UTC timezone
- The cleanup is conservative - it won't delete spaces with null timestamps unless they're very old
- All related data (pages, blocks, etc.) will be deleted via cascade when a space is deleted
- Consider backing up important data before enabling automatic cleanup in production
- You may need to adjust RLS (Row Level Security) policies to allow updating `last_accessed`

## Troubleshooting

### Common Issues

1. **Cron job not running**: Ensure pg_cron extension is enabled
2. **Permissions issues**: Check RLS policies allow updating `last_accessed`
3. **Timestamps not updating**: Check browser console for JavaScript errors

### Debugging

```sql
-- Check if cron extension is enabled
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- View cron job logs (if available)
SELECT * FROM cron.job_run_details WHERE jobid = (
    SELECT jobid FROM cron.job WHERE jobname = 'cleanup-old-spaces'
) ORDER BY start_time DESC;
``` 