import { useState, useEffect, useCallback, useRef } from 'react';
import type { Value } from 'platejs';
import { 
  loadDocumentBlocks, 
  saveDocumentBlocks, 
  convertBlocksToPlateValue,
} from '~/lib/space-utils';

// Helper function to check if we should log (not in production)
const shouldLog = () => true

interface UseDocumentDataOptions {
  pageId: string;
}

interface UseDocumentDataReturn {
  value: Value;
  isLoading: boolean;
  error: string | null;
  isSaving: boolean;
  lastSaved: string | null;
  setValue: (newValue: Value) => void;
  saveNow: () => Promise<boolean>;
  saveWithValue: (valueToSave: Value) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useDocumentData({
  pageId,
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
  const hasLoadedData = useRef(false);

  // Load document blocks from database
  const loadData = useCallback(async () => {
    if (!pageId) return;

    // Prevent duplicate loading
    if (hasLoadedData.current) {
      if (shouldLog()) console.log('🚫 Data already loaded for page:', pageId, '- skipping duplicate load');
      return;
    }

    if (shouldLog()) console.log('Loading document data for page:', pageId);
    hasLoadedData.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const result = await loadDocumentBlocks(pageId);
      
      if (result.error) {
        console.error('Error loading document blocks:', result.error);
        setError(result.error);
        hasLoadedData.current = false; // Reset flag on error so retry can work
        // Keep default value on error
        return;
      }

      const plateValue = convertBlocksToPlateValue(result.blocks);
      if (shouldLog()) console.log('Converted blocks to Plate value:', plateValue);
      if (shouldLog()) console.log('Converted blocks to Plate value (detailed):', JSON.stringify(plateValue, null, 2));
      if (shouldLog()) console.log('Setting editor value to:', plateValue);
      setValue(plateValue);
      
      if (result.blocks.length > 0) {
        setLastSaved('Loaded from database');
        if (shouldLog()) console.log('Successfully loaded', result.blocks.length, 'blocks from database');
      } else {
        if (shouldLog()) console.log('No blocks found in database, using default content');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load document';
      console.error('Exception loading document data:', err);
      setError(errorMessage);
      hasLoadedData.current = false; // Reset flag on error so retry can work
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

    if (shouldLog()) console.log('Saving document data for page:', pageId);
    setIsSaving(true);
    setError(null);

    try {
      const result = await saveDocumentBlocks(pageId, value);
      
      if (result.error) {
        console.error('Error saving document blocks:', result.error);
        setError(result.error);
        return false;
      }

      if (shouldLog()) console.log('Document saved successfully');
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

  // Save document blocks with specific value
  const saveWithValue = useCallback(async (valueToSave: Value): Promise<boolean> => {
    if (!pageId) {
      console.warn('Cannot save: no pageId provided');
      return false;
    }

    if (shouldLog()) console.log('Saving document data with provided value for page:', pageId);
    setIsSaving(true);
    setError(null);

    try {
      const result = await saveDocumentBlocks(pageId, valueToSave);
      
      if (result.error) {
        console.error('Error saving document blocks:', result.error);
        setError(result.error);
        return false;
      }

      if (shouldLog()) console.log('Document saved successfully');
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
  }, [pageId]);

  // Handle value changes without auto-save
  const handleValueChange = useCallback((newValue: Value) => {
    setValue(newValue);
    // Note: No auto-save here - only save manually or on unmount
  }, []);

  // Reset loading flag when pageId changes
  useEffect(() => {
    if (shouldLog()) console.log('🔄 Resetting load flag for new pageId:', pageId);
    hasLoadedData.current = false;
  }, [pageId]);

  // Load initial data
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refetch function that resets the loading flag
  const refetch = useCallback(async () => {
    hasLoadedData.current = false;
    await loadData();
  }, [loadData]);

  return {
    value,
    isLoading,
    error,
    isSaving,
    lastSaved,
    setValue: handleValueChange,
    saveNow,
    saveWithValue,
    refetch
  };
} 