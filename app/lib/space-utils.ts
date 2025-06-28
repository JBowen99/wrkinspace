import { supabase } from './supabase'
import type { TablesInsert } from '../../database.types'

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

// Join a space (this could be expanded for password verification)
export async function joinSpace(spaceId: string, password?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: space, error } = await supabase
      .from('spaces')
      .select('*')
      .eq('id', spaceId)
      .single()

    if (error) {
      return { success: false, error: 'Space not found' }
    }

    // Check password if the space has one
    if (space.password && space.password !== password) {
      return { success: false, error: 'Invalid password' }
    }

    return { success: true }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
    return { success: false, error: errorMessage }
  }
} 