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
import { cn } from "~/lib/utils";

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

export default function MoodboardEditor() {
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

  // Handle mouse down - start dragging
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return; // Only handle left mouse button

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

  // Reset canvas position and zoom
  const handleReset = useCallback(() => {
    setCanvasPosition({ x: 0, y: 0 });
    setZoom(1);
  }, []);

  // Tool selection
  const handleToolSelect = useCallback((tool: string) => {
    setSelectedTool((prev) => (prev === tool ? null : tool));
  }, []);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Fixed Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2">
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

              <ToolbarButton
                pressed={selectedTool === "rectangle"}
                onClick={() => handleToolSelect("rectangle")}
                tooltip="Add Rectangle"
                size="sm"
              >
                <Square className="h-4 w-4" />
              </ToolbarButton>

              <ToolbarButton
                pressed={selectedTool === "circle"}
                onClick={() => handleToolSelect("circle")}
                tooltip="Add Circle"
                size="sm"
              >
                <Circle className="h-4 w-4" />
              </ToolbarButton>
            </ToolbarGroup>

            <ToolbarSeparator />

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

            <ToolbarSeparator />

            <ToolbarGroup>
              <ToolbarButton
                onClick={() => {}}
                tooltip="Delete Selected"
                size="sm"
                variant="outline"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
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
          dragState.isDragging ? "cursor-grabbing" : "cursor-grab"
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleEnd}
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
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-8 min-w-[400px] min-h-[300px]">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <div className="text-lg font-medium mb-2">Your Moodboard</div>
                <div className="text-sm">
                  {selectedTool ? (
                    <>
                      Selected tool:{" "}
                      <span className="capitalize font-medium">
                        {selectedTool}
                      </span>
                    </>
                  ) : (
                    "Select a tool from the toolbar above to start creating"
                  )}
                </div>
              </div>
            </div>
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
          <div>• Drag to pan around the canvas</div>
          <div>• Use toolbar to select tools</div>
          <div>• Zoom in/out with toolbar buttons</div>
        </div>
      </div>
    </div>
  );
}
