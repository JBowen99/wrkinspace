import { useState, useRef, useCallback, useEffect } from "react";
import {
  Plus,
  Image,
  Type,
  Square,
  Circle,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  ToolbarGroup,
} from "~/components/ui/toolbar";
import { MoodboardItem } from "~/components/ui/moodboard-item";
import { cn } from "~/lib/utils";
import { useMoodboardData } from "~/hooks/use-moodboard-data";
import type { MoodboardItem as MoodboardItemType } from "~/lib/space-utils";
import { handleImageUpload, isValidImageFile } from "~/lib/space-utils";

interface CanvasPosition {
  x: number;
  y: number;
}

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  startCanvasX: number;
  startCanvasY: number;
}

interface MoodboardEditorProps {
  pageId: string;
}

export default function MoodboardEditor({ pageId }: MoodboardEditorProps) {
  const [canvasPosition, setCanvasPosition] = useState<CanvasPosition>({
    x: 0,
    y: 0,
  });
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    startCanvasX: 0,
    startCanvasY: 0,
  });
  const [zoom, setZoom] = useState(1);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  // Use the moodboard data hook
  const {
    items,
    selectedItemId,
    isLoading,
    setSelectedItemId,
    createItem,
    updateItem,
    deleteSelectedItem,
    deleteItem,
  } = useMoodboardData(pageId);

  // Handle mouse down - start dragging
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 1) return; // Only handle middle mouse button

      e.preventDefault(); // Prevent default middle-click behavior
      setDragState({
        isDragging: true,
        startX: e.clientX,
        startY: e.clientY,
        startCanvasX: canvasPosition.x,
        startCanvasY: canvasPosition.y,
      });
    },
    [canvasPosition.x, canvasPosition.y]
  );

  // Handle touch start - start dragging on mobile
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length !== 1) return; // Only handle single touch

      const touch = e.touches[0];
      setDragState({
        isDragging: true,
        startX: touch.clientX,
        startY: touch.clientY,
        startCanvasX: canvasPosition.x,
        startCanvasY: canvasPosition.y,
      });
    },
    [canvasPosition.x, canvasPosition.y]
  );

  // Handle mouse/touch move - update canvas position while dragging
  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!dragState.isDragging) return;

      const deltaX = clientX - dragState.startX;
      const deltaY = clientY - dragState.startY;

      setCanvasPosition({
        x: dragState.startCanvasX + deltaX,
        y: dragState.startCanvasY + deltaY,
      });
    },
    [dragState]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    },
    [handleMove]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length !== 1) return;
      e.preventDefault(); // Prevent scrolling

      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    },
    [handleMove]
  );

  // Handle mouse/touch end - stop dragging
  const handleEnd = useCallback(() => {
    setDragState((prev) => ({ ...prev, isDragging: false }));
  }, []);

  // Global event listeners for mouse events (so dragging works even outside the canvas)
  useEffect(() => {
    if (!dragState.isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const handleGlobalMouseUp = () => {
      handleEnd();
    };

    document.addEventListener("mousemove", handleGlobalMouseMove);
    document.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [dragState.isDragging, handleMove, handleEnd]);

  // Zoom functions
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev * 1.2, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev / 1.2, 0.3));
  }, []);

  // Handle wheel event for scroll-based zooming
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault(); // Prevent page scrolling

    const zoomFactor = 1.1;
    const delta = e.deltaY;

    if (delta < 0) {
      // Scrolling up - zoom in
      setZoom((prev) => Math.min(prev * zoomFactor, 3));
    } else {
      // Scrolling down - zoom out
      setZoom((prev) => Math.max(prev / zoomFactor, 0.3));
    }
  }, []);

  // Reset canvas position and zoom
  const handleReset = useCallback(() => {
    setCanvasPosition({ x: 0, y: 0 });
    setZoom(1);
  }, []);

  // Tool selection
  const handleToolSelect = useCallback((tool: string) => {
    if (tool === "image") {
      // For image tool, trigger file picker instead of selecting tool
      imageFileInputRef.current?.click();
    } else {
      setSelectedTool((prev) => (prev === tool ? null : tool));
    }
  }, []);

  // Handle canvas click
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      // Only handle clicks directly on the canvas content area
      if (e.target === e.currentTarget) {
        if (selectedTool && selectedTool !== "image") {
          // Create new item if tool is selected (but not image, since image is handled by file picker)
          // Get the container's bounding rect for proper coordinate calculation
          const containerRect = containerRef.current?.getBoundingClientRect();
          if (containerRect) {
            const x = e.clientX - containerRect.left;
            const y = e.clientY - containerRect.top;
            createItem(
              selectedTool as MoodboardItemType["type"],
              x,
              y,
              canvasPosition,
              zoom
            );
            setSelectedTool(null);
          }
        } else {
          // Deselect any selected item when clicking on empty space
          setSelectedItemId(null);
        }
      }
    },
    [selectedTool, zoom, createItem, canvasPosition, setSelectedItemId]
  );

  // Handle global paste for images
  const handleGlobalPaste = useCallback(
    async (e: ClipboardEvent) => {
      // Only handle paste if no input is focused
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA")
      ) {
        return;
      }

      const items = Array.from(e.clipboardData?.items || []);
      const imageItem = items.find((item) => item.type.startsWith("image/"));

      if (imageItem) {
        e.preventDefault();
        const file = imageItem.getAsFile();
        if (file && isValidImageFile(file)) {
          try {
            // Upload image and get dimensions
            const result = await handleImageUpload(file, pageId);

            if (result.error || !result.url) {
              console.error("Failed to upload pasted image:", result.error);
              return;
            }

            // Create new image item at center of viewport
            const containerRect = containerRef.current?.getBoundingClientRect();
            if (containerRect) {
              const centerX = containerRect.width / 2;
              const centerY = containerRect.height / 2;

              const newItem = await createItem(
                "image",
                centerX,
                centerY,
                canvasPosition,
                zoom
              );

              // Update the created item with the uploaded image
              if (newItem) {
                updateItem(newItem.id, {
                  content: result.url,
                  width: result.width,
                  height: result.height,
                  aspectRatio: result.aspectRatio,
                });
              }
            }
          } catch (error) {
            console.error("Error handling pasted image:", error);
          }
        }
      }
    },
    [pageId, canvasPosition, zoom, createItem, updateItem]
  );

  // Add global paste event listener
  useEffect(() => {
    document.addEventListener("paste", handleGlobalPaste);
    return () => {
      document.removeEventListener("paste", handleGlobalPaste);
    };
  }, [handleGlobalPaste]);

  // Handle image file selection from toolbar
  const handleImageFileSelect = useCallback(
    async (file: File) => {
      if (!isValidImageFile(file)) {
        console.error("Invalid image file");
        return;
      }

      try {
        // Upload image and get dimensions
        const result = await handleImageUpload(file, pageId);

        if (result.error || !result.url) {
          console.error("Failed to upload selected image:", result.error);
          return;
        }

        // Create new image item at center of viewport
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (containerRect) {
          const centerX = containerRect.width / 2;
          const centerY = containerRect.height / 2;

          const newItem = await createItem(
            "image",
            centerX,
            centerY,
            canvasPosition,
            zoom
          );

          // Update the created item with the uploaded image
          if (newItem) {
            updateItem(newItem.id, {
              content: result.url,
              width: result.width,
              height: result.height,
              aspectRatio: result.aspectRatio,
            });
          }
        }
      } catch (error) {
        console.error("Error handling selected image:", error);
      }
    },
    [pageId, canvasPosition, zoom, createItem, updateItem]
  );

  // Handle file input change for toolbar image button
  const handleImageInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleImageFileSelect(file);
      }
      // Reset input
      if (imageFileInputRef.current) {
        imageFileInputRef.current.value = "";
      }
    },
    [handleImageFileSelect]
  );

  // Handle canvas drag and drop
  const [canvasDragOver, setCanvasDragOver] = useState(false);

  const handleCanvasDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if any of the dragged items are images
    const hasImages = Array.from(e.dataTransfer.types).some((type) =>
      type.startsWith("Files")
    );
    if (hasImages) {
      setCanvasDragOver(true);
    }
  }, []);

  const handleCanvasDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCanvasDragOver(false);
  }, []);

  const handleCanvasDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setCanvasDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter((file) => isValidImageFile(file));

      if (imageFiles.length > 0) {
        // Get drop position relative to canvas
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (containerRect) {
          const dropX = e.clientX - containerRect.left;
          const dropY = e.clientY - containerRect.top;

          // Process each image file
          for (const file of imageFiles) {
            try {
              // Upload image and get dimensions
              const result = await handleImageUpload(file, pageId);

              if (result.error || !result.url) {
                console.error("Failed to upload dropped image:", result.error);
                continue;
              }

              // Create new image item at drop position
              const newItem = await createItem(
                "image",
                dropX,
                dropY,
                canvasPosition,
                zoom
              );

              // Update the created item with the uploaded image
              if (newItem) {
                updateItem(newItem.id, {
                  content: result.url,
                  width: result.width,
                  height: result.height,
                  aspectRatio: result.aspectRatio,
                });
              }
            } catch (error) {
              console.error("Error handling dropped image:", error);
            }
          }
        }
      }
    },
    [pageId, canvasPosition, zoom, createItem, updateItem]
  );

  if (isLoading) {
    return (
      <div className="relative h-screen w-full overflow-hidden bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <div className="text-lg font-medium mb-2">Loading Moodboard...</div>
          <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-background">
      {/* Hidden file input for image upload */}
      <input
        ref={imageFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageInputChange}
        className="hidden"
      />

      {/* Fixed Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <div className=" rounded-lg shadow-lg border bg-sidebar p-2">
          <Toolbar className="gap-1">
            <ToolbarGroup>
              <ToolbarButton
                pressed={selectedTool === "select"}
                onClick={() => handleToolSelect("select")}
                tooltip="Select Tool"
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </ToolbarButton>

              <ToolbarButton
                pressed={false}
                onClick={() => handleToolSelect("image")}
                tooltip="Add Image"
                size="sm"
              >
                <Image className="h-4 w-4" />
              </ToolbarButton>

              <ToolbarButton
                pressed={selectedTool === "text"}
                onClick={() => handleToolSelect("text")}
                tooltip="Add Text"
                size="sm"
              >
                <Type className="h-4 w-4" />
              </ToolbarButton>
            </ToolbarGroup>

            <ToolbarGroup>
              <ToolbarButton onClick={handleZoomIn} tooltip="Zoom In" size="sm">
                <ZoomIn className="h-4 w-4" />
              </ToolbarButton>

              <ToolbarButton
                onClick={handleZoomOut}
                tooltip="Zoom Out"
                size="sm"
              >
                <ZoomOut className="h-4 w-4" />
              </ToolbarButton>

              <ToolbarButton
                onClick={handleReset}
                tooltip="Reset View"
                size="sm"
              >
                <RotateCcw className="h-4 w-4" />
              </ToolbarButton>
            </ToolbarGroup>

            <ToolbarGroup>
              <ToolbarButton
                onClick={deleteSelectedItem}
                tooltip="Delete Selected"
                size="sm"
                disabled={!selectedItemId}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </ToolbarButton>
            </ToolbarGroup>
          </Toolbar>
        </div>
      </div>

      {/* Canvas Container */}
      <div
        ref={containerRef}
        className={cn(
          "h-full w-full overflow-hidden",
          dragState.isDragging ? "cursor-grabbing" : "cursor-default",
          canvasDragOver && "bg-blue-50/50 dark:bg-blue-950/20"
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleEnd}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleEnd}
        onDragOver={handleCanvasDragOver}
        onDragLeave={handleCanvasDragLeave}
        onDrop={handleCanvasDrop}
      >
        {/* Pannable Canvas */}
        <div
          ref={canvasRef}
          className="relative h-full w-full transition-transform duration-75 ease-out"
          style={{
            transform: `translate(${canvasPosition.x}px, ${canvasPosition.y}px) scale(${zoom})`,
            transformOrigin: "center center",
          }}
        >
          {/* Grid Background */}
          <div
            className="absolute inset-0 opacity-20 dark:opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: "20px 20px",
              backgroundPosition: `${canvasPosition.x % 20}px ${
                canvasPosition.y % 20
              }px`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (selectedTool && selectedTool !== "image") {
                // Handle tool usage on grid click (but not image, since image is handled by file picker)
                // Get the container's bounding rect for proper coordinate calculation
                const containerRect =
                  containerRef.current?.getBoundingClientRect();
                if (containerRect) {
                  const x = e.clientX - containerRect.left;
                  const y = e.clientY - containerRect.top;
                  createItem(
                    selectedTool as MoodboardItemType["type"],
                    x,
                    y,
                    canvasPosition,
                    zoom
                  );
                  setSelectedTool(null);
                }
              } else {
                // Deselect when clicking on grid
                setSelectedItemId(null);
              }
            }}
          />

          {/* Canvas Content Area */}
          <div className="absolute inset-0" onClick={handleCanvasClick}>
            {/* Welcome message for empty state */}
            {items.length === 0 && (
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <div className="text-lg font-medium mb-2">Your Moodboard</div>
                  <div className="text-sm">
                    {selectedTool ? (
                      <>
                        Selected tool:{" "}
                        <span className="capitalize font-medium">
                          {selectedTool}
                        </span>
                        <div className="mt-2 text-xs">
                          Click anywhere to add an item
                        </div>
                      </>
                    ) : (
                      <>
                        Select a tool from the toolbar above to start creating
                        <div className="mt-2 text-xs">
                          Or drag & drop images directly onto the canvas
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Render moodboard items */}
            {items.map((item) => (
              <MoodboardItem
                key={item.id}
                item={item}
                isSelected={selectedItemId === item.id}
                onSelect={() => setSelectedItemId(item.id)}
                onUpdate={(updates) => updateItem(item.id, updates)}
                onDelete={() => deleteItem(item.id)}
              />
            ))}
          </div>
        </div>

        {/* Drag overlay for visual feedback */}
        {canvasDragOver && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-blue-50/80 dark:bg-blue-950/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 border-dashed border-blue-500 p-8 text-center">
              <div className="text-blue-600 dark:text-blue-400 text-lg font-medium mb-2">
                Drop images here
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Images will be automatically uploaded and added to your
                moodboard
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-md shadow-sm border border-gray-200 dark:border-gray-700 px-3 py-1">
        <div className="text-xs text-gray-600 dark:text-gray-400">
          Zoom: {Math.round(zoom * 100)}% | Position: (
          {Math.round(canvasPosition.x)}, {Math.round(canvasPosition.y)})
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 rounded-md shadow-sm border border-gray-200 dark:border-gray-700 px-3 py-2 max-w-xs">
        <div className="text-xs text-gray-600 dark:text-gray-400">
          <div className="font-medium mb-1">How to use:</div>
          <div>• Middle-click and drag to pan around the canvas</div>
          <div>• Scroll wheel to zoom in/out</div>
          <div>• Use toolbar to select tools</div>
        </div>
      </div>
    </div>
  );
}
