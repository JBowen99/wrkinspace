import { supabase } from './supabase'
import type { TablesInsert, Tables } from '../../database.types'

// Generate a random space ID
export function generateSpaceId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Generate QR code data for a space
export function generateQRCodeData(spaceId: string, password?: string): string {
  const baseUrl = window.location.origin
  const spaceUrl = `${baseUrl}/space/${spaceId}`
  
  if (password) {
    return `${spaceUrl}?password=${encodeURIComponent(password)}`
  }
  
  return spaceUrl
}

// Create a new space in Supabase
export async function createSpace(options: {
  title?: string
  password?: string
} = {}): Promise<{ spaceId: string; error?: string }> {
  console.log('createSpace function called with options:', options)
  
  try {
    const spaceId = generateSpaceId()
    console.log('Generated space ID:', spaceId)
    
    const qrCodeData = generateQRCodeData(spaceId, options.password)
    console.log('Generated QR code data:', qrCodeData)
    
    const spaceData: TablesInsert<'spaces'> = {
      id: spaceId,
      qr_code_data: qrCodeData,
      title: options.title || null,
      password: options.password || null,
      created_at: new Date().toISOString()
    }

    console.log('Space data to insert:', spaceData)
    console.log('Supabase client:', supabase)

    const { data, error } = await supabase
      .from('spaces')
      .insert(spaceData)
      .select()
      .single()

    console.log('Supabase response - data:', data, 'error:', error)

    if (error) {
      console.error('Error creating space:', error)
      return { spaceId, error: error.message }
    }

    return { spaceId }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
    console.error('Error creating space:', err)
    return { spaceId: '', error: errorMessage }
  }
}

// Check space requirements (existence and password protection)
export async function checkSpaceRequirements(spaceId: string): Promise<{ 
  exists: boolean; 
  requiresPassword: boolean; 
  title?: string;
  error?: string 
}> {
  try {
    const { data: space, error } = await supabase
      .from('spaces')
      .select('id, title, password')
      .eq('id', spaceId)
      .single()

    if (error) {
      return { exists: false, requiresPassword: false, error: 'Space not found' }
    }

    return { 
      exists: true, 
      requiresPassword: !!space.password,
      title: space.title || undefined
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
    return { exists: false, requiresPassword: false, error: errorMessage }
  }
}

// Join a space (this could be expanded for password verification)
export async function joinSpace(spaceId: string, password?: string): Promise<{ success: boolean; error?: string }> {
  console.log('joinSpace called for space:', spaceId)
  
  try {
    const { data: space, error } = await supabase
      .from('spaces')
      .select('id, password')  // Only select what we need
      .eq('id', spaceId)
      .single()

    console.log('Supabase query result:', { space, error })

    if (error) {
      console.log('Space not found in database')
      return { success: false, error: 'Space not found' }
    }

    console.log('Space found:', { id: space.id })
    // Password details hidden for security
    console.log('Password comparison result:', space.password === password)

    // Check password if the space has one
    if (space.password && space.password !== password) {
      console.log('Password mismatch detected')
      return { success: false, error: 'Invalid password' }
    }

    console.log('Authentication successful')
    return { success: true }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
    console.error('joinSpace exception:', err)
    return { success: false, error: errorMessage }
  }
}

// Load all pages for a space
export async function loadPagesForSpace(spaceId: string): Promise<{ 
  pages: Tables<'pages'>[]; 
  error?: string 
}> {
  try {
    console.log('Loading pages for space:', spaceId);
    
    const { data: pages, error } = await supabase
      .from('pages')
      .select('id, title, type, space_id, order')
      .eq('space_id', spaceId)
      .order('order', { ascending: true, nullsFirst: false })
      .order('title', { ascending: true })

    console.log('Pages query result:', { pages, error });

    if (error) {
      console.error('Error loading pages:', error)
      // Return empty array instead of error to prevent UI breaking
      return { pages: [], error: `Failed to load pages: ${error.message}` }
    }

    console.log('Successfully loaded pages:', pages?.length || 0);
    return { pages: pages || [] }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
    console.error('Exception while loading pages:', err)
    // Return empty array instead of error to prevent UI breaking
    return { pages: [], error: `Exception loading pages: ${errorMessage}` }
  }
}

// Create a new page in a space
export async function createPage(
  spaceId: string, 
  title: string, 
  type: 'document' | 'moodboard' | 'kanban'
): Promise<{ 
  page: Tables<'pages'> | null; 
  error?: string 
}> {
  try {
    // Get the current max order for this space
    const { data: existingPages } = await supabase
      .from('pages')
      .select('order')
      .eq('space_id', spaceId)
      .order('order', { ascending: false, nullsFirst: false })
      .limit(1)

    const nextOrder = existingPages && existingPages.length > 0 
      ? (existingPages[0].order || 0) + 1 
      : 1

    const pageData: TablesInsert<'pages'> = {
      space_id: spaceId,
      title,
      type,
      order: nextOrder
    }

    const { data: page, error } = await supabase
      .from('pages')
      .insert(pageData)
      .select()
      .single()

    if (error) {
      console.error('Error creating page:', error)
      return { page: null, error: error.message }
    }

    return { page }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
    console.error('Error creating page:', err)
    return { page: null, error: errorMessage }
  }
}

// Rename a page
export async function renamePage(
  pageId: string,
  newTitle: string
): Promise<{
  page: Tables<'pages'> | null;
  error?: string;
}> {
  try {
    const { data: pages, error } = await supabase
      .from('pages')
      .update({ title: newTitle })
      .eq('id', pageId)
      .select()

    if (error) {
      console.error('Error renaming page:', error)
      return { page: null, error: error.message }
    }

    if (!pages || pages.length === 0) {
      console.error('Page not found or no rows affected:', pageId)
      return { page: null, error: 'Page not found or could not be updated' }
    }

    if (pages.length > 1) {
      console.error('Multiple pages affected by update (unexpected):', pages.length)
      return { page: null, error: 'Multiple pages affected by update' }
    }

    return { page: pages[0] }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
    console.error('Error renaming page:', err)
    return { page: null, error: errorMessage }
  }
}

// Delete a page
export async function deletePage(
  pageId: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { error } = await supabase
      .from('pages')
      .delete()
      .eq('id', pageId)

    if (error) {
      console.error('Error deleting page:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
    console.error('Error deleting page:', err)
    return { success: false, error: errorMessage }
  }
}

// Load document blocks for a page
export async function loadDocumentBlocks(pageId: string): Promise<{
  blocks: Tables<'document_blocks'>[];
  error?: string;
}> {
  try {
    console.log('Loading document blocks for page:', pageId);
    
    const { data: blocks, error } = await supabase
      .from('document_blocks')
      .select('id, content, type, order, page_id')
      .eq('page_id', pageId)
      .order('order', { ascending: true, nullsFirst: false })
      .order('id', { ascending: true }) // Secondary sort for consistency

    console.log('Document blocks query result:', { blocks, error });

    if (error) {
      console.error('Error loading document blocks:', error)
      return { blocks: [], error: `Failed to load document blocks: ${error.message}` }
    }

    console.log('Successfully loaded document blocks:', blocks?.length || 0);
    return { blocks: blocks || [] }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
    console.error('Exception while loading document blocks:', err)
    return { blocks: [], error: `Exception loading document blocks: ${errorMessage}` }
  }
}

// Save document blocks for a page (replaces all existing blocks)
export async function saveDocumentBlocks(
  pageId: string, 
  blocks: any // Plate editor value format
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    console.log('Saving document blocks for page:', pageId, 'blocks data:', blocks);
    console.log('Blocks type:', typeof blocks, 'Is array:', Array.isArray(blocks));
    
    // Ensure blocks is an array
    let blocksArray: any[];
    if (Array.isArray(blocks)) {
      blocksArray = blocks;
    } else if (blocks && typeof blocks === 'object') {
      // If it's an object, maybe it has a property with the blocks
      console.log('Blocks object keys:', Object.keys(blocks));
      // For now, assume the blocks are the object itself wrapped in an array
      blocksArray = [blocks];
    } else {
      console.log('Unexpected blocks format, using empty array');
      blocksArray = [];
    }
    
    console.log('Processed blocks array length:', blocksArray.length);
    
    // Start a transaction by deleting existing blocks first
    const { error: deleteError } = await supabase
      .from('document_blocks')
      .delete()
      .eq('page_id', pageId)

    if (deleteError) {
      console.error('Error deleting existing document blocks:', deleteError)
      return { success: false, error: `Failed to delete existing blocks: ${deleteError.message}` }
    }

    // If there are no blocks to save, we're done
    if (blocksArray.length === 0) {
      console.log('No blocks to save, deletion completed successfully');
      return { success: true }
    }

    // Convert blocks to database format
    const documentBlocks: TablesInsert<'document_blocks'>[] = blocksArray.map((block, index) => {
      const plateType = block?.type || 'p';
      const dbType = mapPlateTypeToDbType(plateType);
      console.log(`Block ${index}: plateType="${plateType}" -> dbType="${dbType}", full block:`, block);
      
      return {
        page_id: pageId,
        content: block,
        type: dbType,
        order: index + 1
      };
    });

    console.log('Prepared document blocks for insertion:', documentBlocks.length);
    console.log('Document blocks to insert:', documentBlocks);

    // Insert new blocks
    const { error: insertError } = await supabase
      .from('document_blocks')
      .insert(documentBlocks)

    if (insertError) {
      console.error('Error inserting document blocks:', insertError)
      return { success: false, error: `Failed to insert blocks: ${insertError.message}` }
    }

    console.log('Document blocks saved successfully');
    return { success: true }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
    console.error('Exception while saving document blocks:', err)
    return { success: false, error: `Exception saving document blocks: ${errorMessage}` }
  }
}

// Map Plate editor block types to database types
function mapPlateTypeToDbType(plateType: string): string {
  const typeMap: Record<string, string> = {
    'p': 'paragraph',
    'h1': 'heading',
    'h2': 'heading', 
    'h3': 'heading',
    'h4': 'heading',
    'h5': 'heading',
    'h6': 'heading',
    'blockquote': 'quote',
    'hr': 'divider',
    'ul': 'list',
    'ol': 'list',
    'li': 'list_item',
    'code': 'code',
    'pre': 'code_block',
    'img': 'image',
    'table': 'table',
    'tr': 'table_row',
    'td': 'table_cell',
    'th': 'table_header'
  };
  
  return typeMap[plateType] || 'paragraph';
}

// Convert database blocks to Plate editor format
export function convertBlocksToPlateValue(blocks: Tables<'document_blocks'>[]): any[] {
  console.log('Converting blocks to Plate value:', blocks);
  
  if (!blocks || blocks.length === 0) {
    console.log('No blocks found, returning default structure');
    // Return default empty document structure
    return [
      {
        children: [{ text: "" }],
        type: "p",
      }
    ];
  }

  const sortedBlocks = blocks.sort((a, b) => (a.order || 0) - (b.order || 0));
  console.log('Sorted blocks:', sortedBlocks);
  
  const plateValue = sortedBlocks.map((block, index) => {
    console.log(`Converting block ${index}:`, {
      id: block.id,
      type: block.type,
      order: block.order,
      content: block.content
    });
    
    const content = block.content as any; // Cast to any for Plate structure
    
    // Validate that the content has the expected Plate structure
    if (typeof content === 'object' && content !== null && !Array.isArray(content)) {
      if (!content.children || !content.type) {
        console.warn(`Block ${index} missing required Plate structure:`, content);
        // Fallback to a basic paragraph if structure is invalid
        return {
          children: [{ text: content.text || '' }],
          type: 'p'
        };
      }
    } else {
      console.warn(`Block ${index} content is not an object:`, content);
      return {
        children: [{ text: '' }],
        type: 'p'
      };
    }
    
    return content;
  });
  
  console.log('Final Plate value:', plateValue);
  console.log('Final Plate value (stringified):', JSON.stringify(plateValue, null, 2));
  return plateValue;
}

// Auto-save document blocks with debouncing
export async function autoSaveDocumentBlocks(
  pageId: string,
  blocks: any,
  debounceMs: number = 2000
): Promise<void> {
  // Simple debouncing using setTimeout
  const key = `autosave_${pageId}`;
  
  // Clear existing timeout
  if ((globalThis as any)[key]) {
    clearTimeout((globalThis as any)[key]);
  }
  
  // Set new timeout
  (globalThis as any)[key] = setTimeout(async () => {
    console.log('Auto-saving document blocks for page:', pageId);
    const result = await saveDocumentBlocks(pageId, blocks);
    if (result.error) {
      console.error('Auto-save failed:', result.error);
    } else {
      console.log('Auto-save completed successfully');
    }
    delete (globalThis as any)[key];
  }, debounceMs);
}

// Kanban utility functions

// Load kanban data (columns and cards) for a page
export async function loadKanbanData(pageId: string): Promise<{
  columns: Array<{
    id: string;
    title: string;
    cards: Array<{
      id: string;
      title: string;
      description?: string;
    }>;
  }>;
  error?: string;
}> {
  try {
    console.log('Loading kanban data for page:', pageId);
    
    // Load columns
    const { data: columns, error: columnsError } = await supabase
      .from('kanban_columns')
      .select('id, title, order')
      .eq('page_id', pageId)
      .order('order', { ascending: true, nullsFirst: false })
      .order('title', { ascending: true });

    if (columnsError) {
      console.error('Error loading kanban columns:', columnsError);
      return { columns: [], error: `Failed to load columns: ${columnsError.message}` };
    }

    // Load cards for all columns
    const { data: cards, error: cardsError } = await supabase
      .from('kanban_cards')
      .select('id, content, column_id, order')
      .in('column_id', columns?.map(col => col.id) || [])
      .order('order', { ascending: true, nullsFirst: false })
      .order('id', { ascending: true });

    if (cardsError) {
      console.error('Error loading kanban cards:', cardsError);
      return { columns: [], error: `Failed to load cards: ${cardsError.message}` };
    }

    // Group cards by column and format the response
    const columnsWithCards = (columns || []).map(column => {
      const columnCards = (cards || []).filter(card => card.column_id === column.id);
      return {
        id: column.id,
        title: column.title,
        cards: columnCards.map(card => {
          // Parse the content JSON to extract title and description
          let title = 'Untitled';
          let description: string | undefined;
          
          try {
            if (typeof card.content === 'string') {
              const parsed = JSON.parse(card.content);
              title = parsed.title || 'Untitled';
              description = parsed.description || undefined;
            } else if (typeof card.content === 'object' && card.content !== null) {
              title = (card.content as any).title || 'Untitled';
              description = (card.content as any).description || undefined;
            }
          } catch (err) {
            console.warn('Failed to parse card content:', card.content);
            title = String(card.content) || 'Untitled';
          }
          
          return {
            id: card.id,
            title,
            description
          };
        })
      };
    });

    console.log('Successfully loaded kanban data:', columnsWithCards.length, 'columns');
    return { columns: columnsWithCards };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error('Exception while loading kanban data:', err);
    return { columns: [], error: `Exception loading kanban data: ${errorMessage}` };
  }
}

// Create a new kanban column
export async function createKanbanColumn(
  pageId: string,
  title: string
): Promise<{
  column: Tables<'kanban_columns'> | null;
  error?: string;
}> {
  try {
    // Get the current max order for this page
    const { data: existingColumns } = await supabase
      .from('kanban_columns')
      .select('order')
      .eq('page_id', pageId)
      .order('order', { ascending: false, nullsFirst: false })
      .limit(1);

    const nextOrder = existingColumns && existingColumns.length > 0 
      ? (existingColumns[0].order || 0) + 1 
      : 1;

    const columnData: TablesInsert<'kanban_columns'> = {
      page_id: pageId,
      title,
      order: nextOrder
    };

    const { data: column, error } = await supabase
      .from('kanban_columns')
      .insert(columnData)
      .select()
      .single();

    if (error) {
      console.error('Error creating kanban column:', error);
      return { column: null, error: error.message };
    }

    return { column };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error('Error creating kanban column:', err);
    return { column: null, error: errorMessage };
  }
}

// Create a new kanban card
export async function createKanbanCard(
  columnId: string,
  title: string,
  description?: string
): Promise<{
  card: Tables<'kanban_cards'> | null;
  error?: string;
}> {
  try {
    // Get the current max order for this column
    const { data: existingCards } = await supabase
      .from('kanban_cards')
      .select('order')
      .eq('column_id', columnId)
      .order('order', { ascending: false, nullsFirst: false })
      .limit(1);

    const nextOrder = existingCards && existingCards.length > 0 
      ? (existingCards[0].order || 0) + 1 
      : 1;

    const cardContent = {
      title,
      description: description || undefined
    };

    const cardData: TablesInsert<'kanban_cards'> = {
      column_id: columnId,
      content: JSON.stringify(cardContent),
      order: nextOrder
    };

    const { data: card, error } = await supabase
      .from('kanban_cards')
      .insert(cardData)
      .select()
      .single();

    if (error) {
      console.error('Error creating kanban card:', error);
      return { card: null, error: error.message };
    }

    return { card };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error('Error creating kanban card:', err);
    return { card: null, error: errorMessage };
  }
}

// Update kanban column order after drag and drop
export async function updateKanbanColumnOrder(
  columns: Array<{ id: string; order: number }>
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Update all columns in a batch
    for (const column of columns) {
      const { error } = await supabase
        .from('kanban_columns')
        .update({ order: column.order })
        .eq('id', column.id);

      if (error) {
        console.error('Error updating column order:', error);
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error('Error updating kanban column order:', err);
    return { success: false, error: errorMessage };
  }
}

// Update kanban card (including moving between columns)
export async function updateKanbanCard(
  cardId: string,
  updates: {
    columnId?: string;
    order?: number;
    title?: string;
    description?: string;
  }
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const updateData: any = {};
    
    if (updates.columnId !== undefined) {
      updateData.column_id = updates.columnId;
    }
    
    if (updates.order !== undefined) {
      updateData.order = updates.order;
    }
    
    if (updates.title !== undefined || updates.description !== undefined) {
      // Get current content first if we're only updating title or description
      const { data: currentCard, error: fetchError } = await supabase
        .from('kanban_cards')
        .select('content')
        .eq('id', cardId)
        .single();
      
      if (fetchError) {
        console.error('Error fetching current card content:', fetchError);
        return { success: false, error: fetchError.message };
      }
      
      let currentContent = { title: '', description: undefined };
      try {
        if (typeof currentCard.content === 'string') {
          currentContent = JSON.parse(currentCard.content);
        } else if (typeof currentCard.content === 'object' && currentCard.content !== null) {
          currentContent = currentCard.content as any;
        }
      } catch (err) {
        console.warn('Failed to parse current card content:', currentCard.content);
      }
      
      const newContent = {
        title: updates.title !== undefined ? updates.title : currentContent.title,
        description: updates.description !== undefined ? updates.description : currentContent.description
      };
      
      updateData.content = JSON.stringify(newContent);
    }

    const { error } = await supabase
      .from('kanban_cards')
      .update(updateData)
      .eq('id', cardId);

    if (error) {
      console.error('Error updating kanban card:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error('Error updating kanban card:', err);
    return { success: false, error: errorMessage };
  }
}

// Update multiple cards' order (for reordering within column or moving between columns)
export async function updateKanbanCardsOrder(
  cards: Array<{ id: string; columnId: string; order: number }>
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Update all cards in a batch
    for (const card of cards) {
      const { error } = await supabase
        .from('kanban_cards')
        .update({ 
          column_id: card.columnId,
          order: card.order 
        })
        .eq('id', card.id);

      if (error) {
        console.error('Error updating card order:', error);
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error('Error updating kanban cards order:', err);
    return { success: false, error: errorMessage };
  }
}

// Edit an existing kanban card
export async function editKanbanCard(
  cardId: string,
  title: string,
  description?: string
): Promise<{
  card: Tables<'kanban_cards'> | null;
  error?: string;
}> {
  try {
    const cardContent = {
      title,
      description: description || undefined
    };

    const { data: card, error } = await supabase
      .from('kanban_cards')
      .update({ content: JSON.stringify(cardContent) })
      .eq('id', cardId)
      .select()
      .single();

    if (error) {
      console.error('Error editing kanban card:', error);
      return { card: null, error: error.message };
    }

    return { card };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error('Error editing kanban card:', err);
    return { card: null, error: errorMessage };
  }
}

// Delete a kanban card
export async function deleteKanbanCard(
  cardId: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { error } = await supabase
      .from('kanban_cards')
      .delete()
      .eq('id', cardId);

    if (error) {
      console.error('Error deleting kanban card:', error);
      return { success: false, error: error.message };
    }

    console.log('Successfully deleted kanban card');
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error('Error deleting kanban card:', err);
    return { success: false, error: errorMessage };
  }
}

// Edit an existing kanban column
export async function editKanbanColumn(
  columnId: string,
  title: string
): Promise<{
  column: Tables<'kanban_columns'> | null;
  error?: string;
}> {
  try {
    const { data: column, error } = await supabase
      .from('kanban_columns')
      .update({ title })
      .eq('id', columnId)
      .select()
      .single();

    if (error) {
      console.error('Error editing kanban column:', error);
      return { column: null, error: error.message };
    }

    return { column };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error('Error editing kanban column:', err);
    return { column: null, error: errorMessage };
  }
}

// Delete a kanban column and all its cards
export async function deleteKanbanColumn(
  columnId: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // First, delete all cards in the column
    const { error: cardsError } = await supabase
      .from('kanban_cards')
      .delete()
      .eq('column_id', columnId);

    if (cardsError) {
      console.error('Error deleting cards from column:', cardsError);
      return { success: false, error: `Failed to delete cards: ${cardsError.message}` };
    }

    // Then, delete the column itself
    const { error: columnError } = await supabase
      .from('kanban_columns')
      .delete()
      .eq('id', columnId);

    if (columnError) {
      console.error('Error deleting kanban column:', columnError);
      return { success: false, error: `Failed to delete column: ${columnError.message}` };
    }

    console.log('Successfully deleted column and its cards');
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error('Error deleting kanban column:', err);
    return { success: false, error: errorMessage };
  }
}

// Moodboard utility functions

export interface MoodboardItem {
  id: string;
  type: "text" | "image" | "rectangle" | "circle";
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  style?: React.CSSProperties;
}

// Helper functions to convert between local and database formats
const itemToDbItem = (item: MoodboardItem, pageId: string, isUpdate: boolean = true): TablesInsert<'moodboard_items'> => ({
  ...(isUpdate ? { id: item.id } : {}), // Only include ID for updates, let DB generate for new items
  page_id: pageId,
  type: item.type,
  properties: {
    x: item.x,
    y: item.y,
    width: item.width,
    height: item.height,
    content: item.content,
    style: item.style as any,
  },
});

const dbItemToItem = (dbItem: Tables<'moodboard_items'>): MoodboardItem => {
  const props = dbItem.properties as any;
  return {
    id: dbItem.id,
    type: dbItem.type as MoodboardItem['type'],
    x: props.x || 0,
    y: props.y || 0,
    width: props.width || 150,
    height: props.height || 150,
    content: props.content,
    style: props.style,
  };
};

// Load moodboard items for a page
export async function loadMoodboardItems(pageId: string): Promise<{
  items: MoodboardItem[];
  error?: string;
}> {
  try {
    console.log('Loading moodboard items for page:', pageId);
    
    const { data, error } = await supabase
      .from('moodboard_items')
      .select('*')
      .eq('page_id', pageId);

    if (error) {
      console.error('Error loading moodboard items:', error);
      return { items: [], error: `Failed to load moodboard items: ${error.message}` };
    }

    const items = data.map(dbItemToItem);
    console.log('Successfully loaded moodboard items:', items.length);
    return { items };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error('Exception while loading moodboard items:', err);
    return { items: [], error: `Exception loading moodboard items: ${errorMessage}` };
  }
}

// Create a new moodboard item (returns the created item with DB-generated ID)
export async function createMoodboardItem(item: Omit<MoodboardItem, 'id'>, pageId: string): Promise<{
  item: MoodboardItem | null;
  error?: string;
}> {
  try {
    const dbItem = itemToDbItem(item as MoodboardItem, pageId, false); // false = don't include ID
    const { data, error } = await supabase
      .from('moodboard_items')
      .insert(dbItem)
      .select()
      .single();

    if (error) {
      console.error('Error creating moodboard item:', error);
      return { item: null, error: error.message };
    }

    const createdItem = dbItemToItem(data);
    return { item: createdItem };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error('Error creating moodboard item:', err);
    return { item: null, error: errorMessage };
  }
}

// Update an existing moodboard item
export async function updateMoodboardItem(item: MoodboardItem, pageId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const dbItem = itemToDbItem(item, pageId, true); // true = include ID for update
    const { error } = await supabase
      .from('moodboard_items')
      .update(dbItem)
      .eq('id', item.id);

    if (error) {
      console.error('Error updating moodboard item:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error('Error updating moodboard item:', err);
    return { success: false, error: errorMessage };
  }
}

// Delete a moodboard item
export async function deleteMoodboardItem(itemId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { error } = await supabase
      .from('moodboard_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error deleting moodboard item:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error('Error deleting moodboard item:', err);
    return { success: false, error: errorMessage };
  }
}

// Delete multiple moodboard items (for batch cleanup)
export async function deleteMoodboardItems(itemIds: string[]): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (itemIds.length === 0) return { success: true };

    const { error } = await supabase
      .from('moodboard_items')
      .delete()
      .in('id', itemIds);

    if (error) {
      console.error('Error deleting moodboard items:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error('Error deleting moodboard items:', err);
    return { success: false, error: errorMessage };
  }
}

// Update space title
export async function updateSpaceTitle(
  spaceId: string,
  newTitle: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { error } = await supabase
      .from('spaces')
      .update({ title: newTitle || null })
      .eq('id', spaceId);

    if (error) {
      console.error('Error updating space title:', error);
      return { success: false, error: error.message };
    }

    console.log('Successfully updated space title');
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error('Error updating space title:', err);
    return { success: false, error: errorMessage };
  }
}

// Update space password
export async function updateSpacePassword(
  spaceId: string,
  newPassword?: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Update both password and QR code data
    const qrCodeData = generateQRCodeData(spaceId, newPassword);
    
    const { error } = await supabase
      .from('spaces')
      .update({ 
        password: newPassword || null,
        qr_code_data: qrCodeData
      })
      .eq('id', spaceId);

    if (error) {
      console.error('Error updating space password:', error);
      return { success: false, error: error.message };
    }

    console.log('Successfully updated space password');
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error('Error updating space password:', err);
    return { success: false, error: errorMessage };
  }
}

// Get space details for settings
export async function getSpaceDetails(spaceId: string): Promise<{
  space: Tables<'spaces'> | null;
  error?: string;
}> {
  try {
    const { data: space, error } = await supabase
      .from('spaces')
      .select('*')
      .eq('id', spaceId)
      .single();

    if (error) {
      console.error('Error getting space details:', error);
      return { space: null, error: error.message };
    }

    return { space };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error('Error getting space details:', err);
    return { space: null, error: errorMessage };
  }
} 