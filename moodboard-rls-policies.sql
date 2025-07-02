-- Enable RLS on moodboard_items table
ALTER TABLE moodboard_items ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT: Users can view moodboard items for pages in spaces they have access to
CREATE POLICY "Users can view moodboard items in accessible spaces" ON moodboard_items
    FOR SELECT USING (
        page_id IN (
            SELECT p.id FROM pages p
            JOIN spaces s ON p.space_id = s.id
            WHERE s.id IN (
                SELECT space_id FROM participants
                WHERE id = auth.uid()
            )
            OR s.password IS NULL  -- Public spaces
        )
    );

-- Policy for INSERT: Users can create moodboard items in pages of spaces they have access to
CREATE POLICY "Users can create moodboard items in accessible spaces" ON moodboard_items
    FOR INSERT WITH CHECK (
        page_id IN (
            SELECT p.id FROM pages p
            JOIN spaces s ON p.space_id = s.id
            WHERE s.id IN (
                SELECT space_id FROM participants
                WHERE id = auth.uid()
            )
            OR s.password IS NULL  -- Public spaces
        )
    );

-- Policy for UPDATE: Users can modify moodboard items in pages of spaces they have access to
CREATE POLICY "Users can update moodboard items in accessible spaces" ON moodboard_items
    FOR UPDATE USING (
        page_id IN (
            SELECT p.id FROM pages p
            JOIN spaces s ON p.space_id = s.id
            WHERE s.id IN (
                SELECT space_id FROM participants
                WHERE id = auth.uid()
            )
            OR s.password IS NULL  -- Public spaces
        )
    );

-- Policy for DELETE: Users can delete moodboard items in pages of spaces they have access to
CREATE POLICY "Users can delete moodboard items in accessible spaces" ON moodboard_items
    FOR DELETE USING (
        page_id IN (
            SELECT p.id FROM pages p
            JOIN spaces s ON p.space_id = s.id
            WHERE s.id IN (
                SELECT space_id FROM participants
                WHERE id = auth.uid()
            )
            OR s.password IS NULL  -- Public spaces
        )
    ); 