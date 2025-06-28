import { useState } from 'react'
import { useNavigate } from 'react-router'
import { createSpace } from '~/lib/space-utils'

export function useSpaceActions() {
  const [isCreating, setIsCreating] = useState(false)
  const navigate = useNavigate()

  console.log('useSpaceActions hook initialized')

  const handleCreateSpace = async (options: { password?: string } = {}) => {
    console.log('handleCreateSpace called with options:', options)
    setIsCreating(true)
    try {
      console.log('Creating space...')
      const { spaceId, error } = await createSpace(options)
      
      if (error) {
        console.error('Failed to create space:', error)
        // In a real app, you'd want to use a proper toast notification
        alert(`Failed to create space: ${error}`)
        return { success: false, error }
      }

      console.log('Space created successfully with ID:', spaceId)
      // Navigate to the new space
      navigate(`/space/${spaceId}`)
      return { success: true, spaceId }
    } catch (err) {
      console.error('Error creating space:', err)
      alert('Failed to create space. Please try again.')
      return { success: false, error: 'Unknown error occurred' }
    } finally {
      setIsCreating(false)
    }
  }

  const handleJoinSpace = (spaceId?: string) => {
    console.log('handleJoinSpace called with spaceId:', spaceId)
    if (!spaceId) {
      // Prompt for space ID if not provided
      const inputSpaceId = prompt('Enter Space ID:')
      if (!inputSpaceId || !inputSpaceId.trim()) {
        return
      }
      spaceId = inputSpaceId.trim()
    }

    console.log('Navigating to space:', spaceId)
    navigate(`/space/${spaceId}`)
  }

  return {
    isCreating,
    handleCreateSpace,
    handleJoinSpace
  }
} 