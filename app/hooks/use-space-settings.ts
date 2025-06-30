import { useState } from 'react';
import { updateSpaceTitle, updateSpacePassword } from '~/lib/space-utils';

export function useSpaceSettings(spaceId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const updateTitle = async (newTitle: string): Promise<boolean> => {
    setIsLoading(true);
    setError('');
    
    try {
      const result = await updateSpaceTitle(spaceId, newTitle);
      
      if (result.error) {
        setError(result.error);
        return false;
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async (newPassword?: string): Promise<boolean> => {
    setIsLoading(true);
    setError('');
    
    try {
      const result = await updateSpacePassword(spaceId, newPassword);
      
      if (result.error) {
        setError(result.error);
        return false;
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError('');

  return {
    updateTitle,
    updatePassword,
    isLoading,
    error,
    clearError,
  };
} 