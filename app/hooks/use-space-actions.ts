import { useState } from 'react'
import { useNavigate } from 'react-router'
import { createSpace } from '~/lib/space-utils'
import { useSpace } from "~/contexts/space-context";

export function useSpaceActions() {
  const [isCreating, setIsCreating] = useState(false)
  const navigate = useNavigate()
  const { createPage, pages } = useSpace();

  console.log('useSpaceActions hook initialized')

  const handleCreateSpace = async (options: { title?: string; password?: string } = {}) => {
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

  const handleJoinSpace = async (spaceId?: string, password?: string) => {
    console.log('handleJoinSpace called with spaceId:', spaceId, 'password:', password ? '[REDACTED]' : 'none')
    if (!spaceId) {
      // Prompt for space ID if not provided
      const inputSpaceId = prompt('Enter Space ID:')
      if (!inputSpaceId || !inputSpaceId.trim()) {
        return
      }
      spaceId = inputSpaceId.trim()
    }

    try {
      // Validate space access with password if provided
      const { joinSpace } = await import('~/lib/space-utils')
      const result = await joinSpace(spaceId, password)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to join space')
      }

      console.log('Successfully validated space access, navigating to space:', spaceId)
      navigate(`/space/${spaceId}`)
    } catch (error) {
      console.error('Error joining space:', error)
      // Re-throw the error so the modal can handle it
      throw error
    }
  }

  const handleCreatePage = async (
    type: "document" | "moodboard" | "kanban"
  ) => {
    const typeNames = {
      document: "Document",
      moodboard: "Mood Board",
      kanban: "Planning Board",
    };

    const title = `${typeNames[type]} ${
      pages.filter((p) => p.type === type).length + 1
    }`;

    const success = await createPage(title, type);
    if (success) {
      console.log(`${typeNames[type]} created successfully`);
    }
    
    return success;
  };

  return {
    isCreating,
    handleCreateSpace,
    handleJoinSpace,
    handleCreatePage
  }
} 