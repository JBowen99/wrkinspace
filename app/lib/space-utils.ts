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
    const { data: page, error } = await supabase
      .from('pages')
      .update({ title: newTitle })
      .eq('id', pageId)
      .select()
      .single()

    if (error) {
      console.error('Error renaming page:', error)
      return { page: null, error: error.message }
    }

    return { page }
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