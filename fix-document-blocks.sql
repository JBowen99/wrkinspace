-- Fix document_blocks table constraint and policies
-- Run this in your Supabase SQL editor

-- First, drop the existing constraint that's causing issues
ALTER TABLE document_blocks DROP CONSTRAINT IF EXISTS document_blocks_type_check;

-- Create a new constraint with all the types we need
ALTER TABLE document_blocks 
ADD CONSTRAINT document_blocks_type_check 
CHECK (type IN (
    'paragraph',
    'heading', 
    'quote',
    'divider',
    'list',
    'list_item',
    'code',
    'code_block',
    'image',
    'text',
    'table',
    'table_row',
    'table_cell',
    'table_header',
    'unknown'
));

-- Enable RLS on document_blocks table
ALTER TABLE document_blocks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow read access to all document blocks" ON document_blocks;
DROP POLICY IF EXISTS "Allow creating document blocks in any page" ON document_blocks;
DROP POLICY IF EXISTS "Allow updating document blocks in any page" ON document_blocks;
DROP POLICY IF EXISTS "Allow deleting document blocks in any page" ON document_blocks;

-- Create permissive policies for document_blocks
CREATE POLICY "Allow read access to all document blocks" ON document_blocks
    FOR SELECT
    USING (true);

CREATE POLICY "Allow creating document blocks in any page" ON document_blocks
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow updating document blocks in any page" ON document_blocks
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow deleting document blocks in any page" ON document_blocks
    FOR DELETE
    USING (true);

-- Verify the constraint is working
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'document_blocks_type_check';

-- Test insert with valid type
-- INSERT INTO document_blocks (page_id, content, type, "order") 
-- VALUES ('test-page-id', '{"test": true}', 'paragraph', 1);

-- Clean up test data (uncomment if you ran the test)
-- DELETE FROM document_blocks WHERE page_id = 'test-page-id'; 