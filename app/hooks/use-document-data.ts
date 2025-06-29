import { useState, useEffect, useCallback } from 'react';
import type { Value } from 'platejs';
import { 
  loadDocumentBlocks, 
  saveDocumentBlocks, 
  convertBlocksToPlateValue,
  autoSaveDocumentBlocks
} from '~/lib/space-utils';

interface UseDocumentDataOptions {
  pageId: string;
  autoSaveEnabled?: boolean;
  autoSaveDelayMs?: number;
}

interface UseDocumentDataReturn {
  value: Value;
  isLoading: boolean;
  error: string | null;
  isSaving: boolean;
  lastSaved: string | null;
  setValue: (newValue: Value) => void;
  saveNow: () => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useDocumentData({
  pageId,
  autoSaveEnabled = true,
  autoSaveDelayMs = 2000
}: UseDocumentDataOptions): UseDocumentDataReturn {
  const [value, setValue] = useState<Value>([
    {
      children: [{ text: "" }],
      type: "p",
    }
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Load document blocks from database
  const loadData = useCallback(async () => {
    if (!pageId) return;

    console.log('Loading document data for page:', pageId);
    setIsLoading(true);
    setError(null);

    try {
      const result = await loadDocumentBlocks(pageId);
      
      if (result.error) {
        console.error('Error loading document blocks:', result.error);
        setError(result.error);
        // Keep default value on error
        return;
      }

      const plateValue = convertBlocksToPlateValue(result.blocks);
      console.log('Converted blocks to Plate value:', plateValue);
      console.log('Converted blocks to Plate value (detailed):', JSON.stringify(plateValue, null, 2));
      console.log('Setting editor value to:', plateValue);
      setValue(plateValue);
      
      if (result.blocks.length > 0) {
        setLastSaved('Loaded from database');
        console.log('Successfully loaded', result.blocks.length, 'blocks from database');
      } else {
        console.log('No blocks found in database, using default content');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load document';
      console.error('Exception loading document data:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [pageId]);

  // Save document blocks to database
  const saveNow = useCallback(async (): Promise<boolean> => {
    if (!pageId) {
      console.warn('Cannot save: no pageId provided');
      return false;
    }

    console.log('Saving document data for page:', pageId);
    setIsSaving(true);
    setError(null);

    try {
      const result = await saveDocumentBlocks(pageId, value);
      
      if (result.error) {
        console.error('Error saving document blocks:', result.error);
        setError(result.error);
        return false;
      }

      console.log('Document saved successfully');
      setLastSaved(new Date().toLocaleTimeString());
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save document';
      console.error('Exception saving document data:', err);
      setError(errorMessage);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [pageId, value]);

  // Handle value changes with auto-save
  const handleValueChange = useCallback((newValue: Value) => {
    setValue(newValue);
    
    if (autoSaveEnabled && pageId) {
      // Trigger auto-save
      autoSaveDocumentBlocks(pageId, newValue, autoSaveDelayMs);
      setLastSaved('Auto-saving...');
    }
  }, [pageId, autoSaveEnabled, autoSaveDelayMs]);

  // Load initial data
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    value,
    isLoading,
    error,
    isSaving,
    lastSaved,
    setValue: handleValueChange,
    saveNow,
    refetch: loadData
  };
} 