import { useState, useRef, useCallback, useEffect } from "react";
import { Rnd } from "react-rnd";
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
import { cn } from "~/lib/utils";
import { useMoodboardData } from "~/hooks/use-moodboard-data";
import type { MoodboardItem } from "~/lib/space-utils";

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

  // Use the moodboard data hook
  const {
    items,
    selectedItemId,
    isLoading,
    setSelectedItemId,
    createItem,
    updateItem,
    deleteSelectedItem,
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
    setSelectedTool((prev) => (prev === tool ? null : tool));
  }, []);

  // Handle canvas click
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (selectedTool && e.target === e.currentTarget) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        createItem(
          selectedTool as MoodboardItem["type"],
          x,
          y,
          canvasPosition,
          zoom
        );
        setSelectedTool(null);
      } else {
        setSelectedItemId(null);
      }
    },
    [selectedTool, zoom, createItem, canvasPosition, setSelectedItemId]
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
                pressed={selectedTool === "image"}
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
          dragState.isDragging ? "cursor-grabbing" : "cursor-default"
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleEnd}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleEnd}
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
                      "Select a tool from the toolbar above to start creating"
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Render moodboard items */}
            {items.map((item) => (
              <Rnd
                key={item.id}
                size={{ width: item.width, height: item.height }}
                position={{ x: item.x, y: item.y }}
                onDragStop={(_e, d) => {
                  updateItem(item.id, { x: d.x, y: d.y });
                }}
                onResizeStop={(_e, direction, ref, delta, position) => {
                  updateItem(item.id, {
                    width: parseInt(ref.style.width),
                    height: parseInt(ref.style.height),
                    x: position.x,
                    y: position.y,
                  });
                }}
                className={cn(
                  "border-2 transition-colors",
                  selectedItemId === item.id
                    ? "border-blue-500"
                    : "border-transparent hover:border-gray-300"
                )}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  setSelectedItemId(item.id);
                }}
              >
                <div className="w-full h-full" style={item.style}>
                  {item.type === "text" && (
                    <textarea
                      className="w-full h-full resize-none outline-none bg-transparent"
                      value={item.content || ""}
                      onChange={(e) =>
                        updateItem(item.id, { content: e.target.value })
                      }
                      placeholder="Enter text..."
                      style={{
                        fontSize: "inherit",
                        fontFamily: "inherit",
                        color: "inherit",
                      }}
                    />
                  )}
                  {item.type === "image" && (
                    <div className="w-full h-full flex items-center justify-center text-sm">
                      Click to add image
                    </div>
                  )}
                  {item.type === "rectangle" && (
                    <div className="w-full h-full" />
                  )}
                  {item.type === "circle" && <div className="w-full h-full" />}
                </div>
              </Rnd>
            ))}
          </div>
        </div>
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
