import { useState, useCallback, useEffect } from 'react';
import { 
  loadMoodboardItems, 
  createMoodboardItem,
  updateMoodboardItem, 
  deleteMoodboardItem,
  deleteMoodboardItems 
} from '~/lib/space-utils';
import type { MoodboardItem } from '~/lib/space-utils';

interface CanvasPosition {
  x: number;
  y: number;
}

export function useMoodboardData(pageId: string) {
  const [items, setItems] = useState<MoodboardItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load items from database
  const loadItems = useCallback(async () => {
    if (!pageId) return;
    
    try {
      setIsLoading(true);
      const result = await loadMoodboardItems(pageId);
      
      if (result.error) {
        console.error('Failed to load moodboard items:', result.error);
      } else {
        setItems(result.items);
      }
    } catch (error) {
      console.error('Error loading moodboard items:', error);
    } finally {
      setIsLoading(false);
    }
  }, [pageId]);

  // Create new item
  const createItem = useCallback(async (
    type: MoodboardItem["type"], 
    x: number, 
    y: number,
    canvasPosition: CanvasPosition,
    zoom: number
  ) => {
    const newItemData = {
      type,
      x: (x - canvasPosition.x) / zoom,
      y: (y - canvasPosition.y) / zoom,
      width: type === "text" ? 200 : 150,
      height: type === "text" ? 50 : 150,
      content: type === "text" ? "" : "",
      style: getDefaultStyle(type),
    };

    // Create in database first to get the proper ID
    const result = await createMoodboardItem(newItemData, pageId);
    if (result.error) {
      console.error('Failed to create new item:', result.error);
      return null;
    }

    if (result.item) {
      // Update local state with the item that has the DB-generated ID
      setItems((prev) => [...prev, result.item!]);
      setSelectedItemId(result.item.id);
      return result.item;
    }

    return null;
  }, [pageId]);

  // Update item
  const updateItem = useCallback(async (id: string, updates: Partial<MoodboardItem>) => {
    let updatedItem: MoodboardItem | null = null;
    
    setItems((prev) => {
      const newItems = prev.map((item) => {
        if (item.id === id) {
          updatedItem = { ...item, ...updates };
          return updatedItem;
        }
        return item;
      });
      return newItems;
    });

    // Save to database
    if (updatedItem) {
      const result = await updateMoodboardItem(updatedItem, pageId);
      if (result.error) {
        console.error('Failed to update item:', result.error);
      }
    }
  }, [pageId]);

  // Delete item
  const deleteItem = useCallback(async (itemId: string) => {
    // Update local state immediately
    setItems((prev) => prev.filter((item) => item.id !== itemId));
    
    if (selectedItemId === itemId) {
      setSelectedItemId(null);
    }
    
    // Delete from database
    const result = await deleteMoodboardItem(itemId);
    if (result.error) {
      console.error('Failed to delete item:', result.error);
    }
  }, [selectedItemId]);

  // Delete selected item
  const deleteSelectedItem = useCallback(async () => {
    if (selectedItemId) {
      await deleteItem(selectedItemId);
    }
  }, [selectedItemId, deleteItem]);

  // Clean up empty text items when selection changes
  useEffect(() => {
    setItems((prev) => {
      const itemsToDelete: string[] = [];
      const filteredItems = prev.filter((item) => {
        // Keep non-text items
        if (item.type !== "text") return true;
        
        // Keep selected items (even if empty)
        if (item.id === selectedItemId) return true;
        
        // Remove empty text items that are not selected
        const content = item.content || "";
        const shouldKeep = content.trim().length > 0;
        
        if (!shouldKeep) {
          itemsToDelete.push(item.id);
        }
        
        return shouldKeep;
      });
      
      // Delete empty items from database
      if (itemsToDelete.length > 0) {
        deleteMoodboardItems(itemsToDelete).catch(error => {
          console.error('Failed to delete empty items:', error);
        });
      }
      
      return filteredItems;
    });
  }, [selectedItemId]);

  // Load items on mount
  useEffect(() => {
    loadItems();
  }, [loadItems]);

  return {
    items,
    selectedItemId,
    isLoading,
    setSelectedItemId,
    createItem,
    updateItem,
    deleteItem,
    deleteSelectedItem,
    loadItems,
  };
}

// Get default style for item type
function getDefaultStyle(type: MoodboardItem["type"]): React.CSSProperties {
  switch (type) {
    case "text":
      return {
        fontSize: "16px",
        fontFamily: "Arial, sans-serif",
        color: "#333",
        padding: "8px",
        border: "none",
        background: "transparent",
      };
    case "rectangle":
      return {
        backgroundColor: "#3b82f6",
        borderRadius: "4px",
      };
    case "circle":
      return {
        backgroundColor: "#10b981",
        borderRadius: "50%",
      };
    case "image":
      return {
        backgroundColor: "#f3f4f6",
        border: "2px dashed #d1d5db",
        borderRadius: "4px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#6b7280",
      };
    default:
      return {};
  }
} 