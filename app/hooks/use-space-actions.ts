import { useState, useContext } from 'react'
import { useNavigate } from 'react-router'
import { createSpace } from '~/lib/space-utils'
import { SpaceContext } from "~/contexts/space-context";

export function useSpaceActions() {
  const [isCreating, setIsCreating] = useState(false)
  const navigate = useNavigate()
  
  // Conditionally use space context - only if we're inside a SpaceProvider
  const spaceContext = useContext(SpaceContext);

  console.log('useSpaceActions hook initialized')

  const handleCreateSpace = async (options: { title?: string; password?: string } = {}) => {
    console.log('handleCreateSpace called with options:', options)
    setIsCreating(true)
    try {
      console.log('Creating space...')
      const { spaceId, error, rateLimited } = await createSpace(options)
      
      if (error) {
        console.error('Failed to create space:', error)
        
        if (rateLimited) {
          // Special handling for rate limiting
          console.warn('Space creation rate limited')
          return { success: false, error, rateLimited: true }
        }
        
        return { success: false, error }
      }

      console.log('Space created successfully with ID:', spaceId)
      
      // If space was created with a password, automatically authenticate the creator
      if (options.password && typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("wrkinspace_authenticated");
          const authenticatedSpaces = new Set(stored ? JSON.parse(stored) : []);
          authenticatedSpaces.add(spaceId);
          localStorage.setItem("wrkinspace_authenticated", JSON.stringify([...authenticatedSpaces]));
          console.log('Creator automatically authenticated for new password-protected space:', spaceId);
        } catch (err) {
          console.error('Failed to save authentication state for new space:', err);
          // Don't fail the whole operation for localStorage issues
        }
      }
      
      // Navigate to the new space
      navigate(`/space/${spaceId}`)
      return { success: true, spaceId }
    } catch (err) {
      console.error('Error creating space:', err)
      return { success: false, error: 'Failed to create space. Please try again.' }
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
      const { joinSpaceSecure } = await import('~/lib/space-utils')
      const result = await joinSpaceSecure(spaceId, password)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to join space')
      }

      // Save authentication state to localStorage (same as other auth flows)
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("wrkinspace_authenticated");
          const authenticatedSpaces = new Set(stored ? JSON.parse(stored) : []);
          authenticatedSpaces.add(spaceId);
          localStorage.setItem("wrkinspace_authenticated", JSON.stringify([...authenticatedSpaces]));
          console.log('Authentication state saved for space:', spaceId);
        } catch (err) {
          console.error('Failed to save authentication state:', err);
          // Don't fail the whole operation for localStorage issues
        }
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
    // Only allow page creation if we have space context
    if (!spaceContext) {
      console.error('Cannot create page: not within a space context');
      return false;
    }

    const { createPage, pages } = spaceContext;

    const typeNames = {
      document: "Document",
      moodboard: "Mood Board",
      kanban: "Planning Board",
    };

    const title = `${typeNames[type]} ${
      pages.filter((p: any) => p.type === type).length + 1
    }`;

    const success = await createPage(title, type);
    if (success) {
      console.log(`${typeNames[type]} created successfully`);
    }
    
    return success;
  };

  const handleRenamePage = async (pageId: string, newTitle: string) => {
    if (!spaceContext) {
      console.error('Cannot rename page: not within a space context');
      return false;
    }

    const { renamePage } = spaceContext;
    
    if (!newTitle.trim()) {
      console.error('Cannot rename page: title cannot be empty');
      return false;
    }

    const success = await renamePage(pageId, newTitle.trim());
    if (success) {
      console.log('Page renamed successfully');
    }
    
    return success;
  };

  const handleDeletePage = async (pageId: string) => {
    if (!spaceContext) {
      console.error('Cannot delete page: not within a space context');
      return false;
    }

    const { deletePage } = spaceContext;
    
    const success = await deletePage(pageId);
    if (success) {
      console.log('Page deleted successfully');
    }
    
    return success;
  };

  return {
    isCreating,
    handleCreateSpace,
    handleJoinSpace,
    handleCreatePage,
    handleRenamePage,
    handleDeletePage
  }
} 