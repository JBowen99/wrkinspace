-- Quick debug script to test if RLS is causing the page rename issue

-- 1. Check current RLS status and policies
SELECT schemaname, tablename, rowsecurity, enablerls 
FROM pg_tables 
WHERE tablename IN ('pages', 'spaces', 'participants');

-- 2. Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'pages';

-- 3. Temporarily disable RLS on pages table (FOR TESTING ONLY)
-- ALTER TABLE pages DISABLE ROW LEVEL SECURITY;

-- 4. Test your page rename operation now
-- If it works, then RLS was the issue

-- 5. Re-enable RLS and apply proper policies (DON'T FORGET THIS STEP)
-- ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

-- 6. Then run the policies from database-policies.sql 