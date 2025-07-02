-- RLS Policies for WrkInSpace Database
-- 
-- This file contains Row Level Security policies for all tables
-- These policies assume a public/open access model where anyone can 
-- read spaces and participate, but maintains data integrity

-- =============================================
-- SPACES TABLE POLICIES
-- =============================================

-- Enable RLS on spaces table
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read spaces (for joining/discovering spaces)
CREATE POLICY "Allow read access to all spaces" ON spaces
    FOR SELECT
    USING (true);

-- Allow anyone to create spaces
CREATE POLICY "Allow anyone to create spaces" ON spaces
    FOR INSERT
    WITH CHECK (true);

-- Allow space creators/participants to update spaces
-- Note: You might want to restrict this further based on your needs
CREATE POLICY "Allow space updates" ON spaces
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Allow space creators to delete spaces
-- Note: You might want to restrict this further
CREATE POLICY "Allow space deletions" ON spaces
    FOR DELETE
    USING (true);

-- =============================================
-- PAGES TABLE POLICIES
-- =============================================

-- Enable RLS on pages table
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

-- Allow reading pages in any space
CREATE POLICY "Allow read access to all pages" ON pages
    FOR SELECT
    USING (true);

-- Allow creating pages in any space
CREATE POLICY "Allow creating pages in any space" ON pages
    FOR INSERT
    WITH CHECK (true);

-- Allow updating pages in any space
CREATE POLICY "Allow updating pages in any space" ON pages
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Allow deleting pages in any space
CREATE POLICY "Allow deleting pages in any space" ON pages
    FOR DELETE
    USING (true);

-- =============================================
-- PARTICIPANTS TABLE POLICIES
-- =============================================

-- Enable RLS on participants table
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Allow reading all participants
CREATE POLICY "Allow read access to all participants" ON participants
    FOR SELECT
    USING (true);

-- Allow anyone to join as a participant
CREATE POLICY "Allow anyone to become a participant" ON participants
    FOR INSERT
    WITH CHECK (true);

-- Allow participants to update their own info
CREATE POLICY "Allow participants to update themselves" ON participants
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Allow participants to leave (delete themselves)
CREATE POLICY "Allow participants to delete themselves" ON participants
    FOR DELETE
    USING (true);

-- =============================================
-- DOCUMENT_BLOCKS TABLE POLICIES
-- =============================================

-- Enable RLS on document_blocks table
ALTER TABLE document_blocks ENABLE ROW LEVEL SECURITY;

-- Allow reading document blocks for any page
CREATE POLICY "Allow read access to all document blocks" ON document_blocks
    FOR SELECT
    USING (true);

-- Allow creating document blocks in any page
CREATE POLICY "Allow creating document blocks in any page" ON document_blocks
    FOR INSERT
    WITH CHECK (true);

-- Allow updating document blocks in any page
CREATE POLICY "Allow updating document blocks in any page" ON document_blocks
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Allow deleting document blocks in any page
CREATE POLICY "Allow deleting document blocks in any page" ON document_blocks
    FOR DELETE
    USING (true);

-- =============================================
-- KANBAN_COLUMNS TABLE POLICIES
-- =============================================

-- Enable RLS on kanban_columns table
ALTER TABLE kanban_columns ENABLE ROW LEVEL SECURITY;

-- Allow reading kanban columns for any page
CREATE POLICY "Allow read access to all kanban columns" ON kanban_columns
    FOR SELECT
    USING (true);

-- Allow creating kanban columns in any page
CREATE POLICY "Allow creating kanban columns in any page" ON kanban_columns
    FOR INSERT
    WITH CHECK (true);

-- Allow updating kanban columns in any page
CREATE POLICY "Allow updating kanban columns in any page" ON kanban_columns
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Allow deleting kanban columns in any page
CREATE POLICY "Allow deleting kanban columns in any page" ON kanban_columns
    FOR DELETE
    USING (true);

-- =============================================
-- KANBAN_CARDS TABLE POLICIES
-- =============================================

-- Enable RLS on kanban_cards table
ALTER TABLE kanban_cards ENABLE ROW LEVEL SECURITY;

-- Allow reading kanban cards for any column
CREATE POLICY "Allow read access to all kanban cards" ON kanban_cards
    FOR SELECT
    USING (true);

-- Allow creating kanban cards in any column
CREATE POLICY "Allow creating kanban cards in any column" ON kanban_cards
    FOR INSERT
    WITH CHECK (true);

-- Allow updating kanban cards in any column
CREATE POLICY "Allow updating kanban cards in any column" ON kanban_cards
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Allow deleting kanban cards in any column
CREATE POLICY "Allow deleting kanban cards in any column" ON kanban_cards
    FOR DELETE
    USING (true);

-- =============================================
-- MOODBOARD_ITEMS TABLE POLICIES
-- =============================================

-- Enable RLS on moodboard_items table
ALTER TABLE moodboard_items ENABLE ROW LEVEL SECURITY;

-- Allow reading moodboard items for any page
CREATE POLICY "Allow read access to all moodboard items" ON moodboard_items
    FOR SELECT
    USING (true);

-- Allow creating moodboard items in any page
CREATE POLICY "Allow creating moodboard items in any page" ON moodboard_items
    FOR INSERT
    WITH CHECK (true);

-- Allow updating moodboard items in any page
CREATE POLICY "Allow updating moodboard items in any page" ON moodboard_items
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Allow deleting moodboard items in any page
CREATE POLICY "Allow deleting moodboard items in any page" ON moodboard_items
    FOR DELETE
    USING (true);

-- =============================================
-- ALTERNATIVE: MORE RESTRICTIVE POLICIES
-- =============================================
-- 
-- If you want more restrictive policies based on participants,
-- you can uncomment and modify these instead:

/*
-- More restrictive pages policy based on space participation
DROP POLICY IF EXISTS "Allow updating pages in any space" ON pages;
CREATE POLICY "Allow updating pages for participants" ON pages
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM participants 
            WHERE participants.space_id = pages.space_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM participants 
            WHERE participants.space_id = pages.space_id
        )
    );

-- More restrictive pages deletion policy
DROP POLICY IF EXISTS "Allow deleting pages in any space" ON pages;
CREATE POLICY "Allow deleting pages for participants" ON pages
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM participants 
            WHERE participants.space_id = pages.space_id
        )
    );
*/

-- =============================================
-- NOTES
-- =============================================
--
-- These policies provide open access to all operations, which matches
-- the collaborative nature of your application where anyone can join
-- spaces and contribute.
--
-- If you need more security:
-- 1. Implement authentication (auth.users table)
-- 2. Use more restrictive policies based on participants table
-- 3. Add role-based access controls
--
-- To apply these policies:
-- 1. Run this SQL in your Supabase SQL editor
-- 2. Or execute via your database management tool
-- 3. Test the page rename functionality
--
-- To debug RLS issues:
-- 1. Check which policies are active: SELECT * FROM pg_policies;
-- 2. Temporarily disable RLS: ALTER TABLE pages DISABLE ROW LEVEL SECURITY;
-- 3. Test operations and re-enable: ALTER TABLE pages ENABLE ROW LEVEL SECURITY; 