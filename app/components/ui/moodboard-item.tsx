import React, { useState, useRef, useEffect, useCallback } from "react";
import { Rnd } from "react-rnd";
import { GripHorizontal, X } from "lucide-react";
import { cn } from "~/lib/utils";
import type { MoodboardItem as MoodboardItemType } from "~/lib/space-utils";

interface MoodboardItemProps {
  item: MoodboardItemType;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<MoodboardItemType>) => void;
  onDelete: () => void;
}

export function MoodboardItem({
  item,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
}: MoodboardItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize text items based on content
  const updateTextHeight = useCallback(() => {
    if (item.type === "text" && textareaRef.current) {
      const textarea = textareaRef.current;

      // Reset height to get accurate scrollHeight
      textarea.style.height = "auto";

      // Calculate new height with padding and minimum height
      const minHeight = 50; // Minimum height for text items
      const maxHeight = 400; // Maximum height to prevent overly tall items
      const padding = 20; // Account for padding (8px top + 8px bottom) + border (2px top + 2px bottom)

      let newHeight = Math.max(
        minHeight,
        Math.min(maxHeight, textarea.scrollHeight + padding)
      );

      // Update item height if it changed significantly (avoid micro-adjustments)
      if (Math.abs(newHeight - item.height) > 5) {
        onUpdate({ height: newHeight });
      }

      // Set the textarea height immediately for smooth user experience
      textarea.style.height = `${newHeight - padding}px`;
    }
  }, [item.type, item.height, onUpdate]);

  // Update height when content changes
  useEffect(() => {
    if (item.type === "text") {
      updateTextHeight();
    }
  }, [item.content, item.type, updateTextHeight]);

  // Update height when item becomes selected (in case font changes)
  useEffect(() => {
    if (item.type === "text" && isSelected) {
      // Small delay to ensure textarea is rendered
      setTimeout(updateTextHeight, 50);
    }
  }, [isSelected, item.type, updateTextHeight]);

  return (
    <Rnd
      size={{ width: item.width, height: item.height }}
      position={{ x: item.x, y: item.y }}
      onDragStop={(_e, d) => {
        onUpdate({ x: d.x, y: d.y });
      }}
      onResizeStop={(_e, direction, ref, delta, position) => {
        const newWidth = parseInt(ref.style.width);
        const newHeight = parseInt(ref.style.height);

        // For image items, maintain aspect ratio
        if (item.type === "image" && item.aspectRatio) {
          let finalWidth = newWidth;
          let finalHeight = newHeight;

          // Determine which dimension changed more to decide how to maintain aspect ratio
          const widthChange = Math.abs(newWidth - item.width);
          const heightChange = Math.abs(newHeight - item.height);

          if (widthChange > heightChange) {
            // Width changed more, adjust height to maintain aspect ratio
            finalHeight = Math.round(newWidth / item.aspectRatio);
          } else {
            // Height changed more, adjust width to maintain aspect ratio
            finalWidth = Math.round(newHeight * item.aspectRatio);
          }

          onUpdate({
            width: finalWidth,
            height: finalHeight,
            x: position.x,
            y: position.y,
          });
        } else {
          // For non-image items, use the original behavior
          onUpdate({
            width: newWidth,
            height: newHeight,
            x: position.x,
            y: position.y,
          });
        }
      }}
      className={cn("group relative", isSelected && "z-10")}
      dragHandleClassName="drag-handle"
      disableDragging={false}
      enableResizing={
        item.type === "text"
          ? {
              // For text items, only allow horizontal resizing since height is auto
              top: false,
              right: true,
              bottom: false,
              left: false,
              topRight: false,
              bottomRight: false,
              bottomLeft: false,
              topLeft: false,
            }
          : item.type === "image"
          ? {
              // For image items, allow corner resizing to maintain aspect ratio better
              top: false,
              right: false,
              bottom: false,
              left: false,
              topRight: true,
              bottomRight: true,
              bottomLeft: true,
              topLeft: true,
            }
          : {
              // For other items, allow normal resizing
              top: false,
              right: true,
              bottom: true,
              left: false,
              topRight: true,
              bottomRight: true,
              bottomLeft: true,
              topLeft: false,
            }
      }
      lockAspectRatio={item.type === "image"}
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect();
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main content container */}
      <div
        className={cn(
          "w-full h-full border-2 rounded-md transition-colors",
          isSelected
            ? "!border-purple-500 border-solid"
            : isHovered
            ? "border-gray-400 dark:border-gray-500"
            : "border-gray-200 dark:border-gray-700"
        )}
        style={item.style}
      >
        {/* Content based on item type */}
        {item.type === "text" && (
          <textarea
            ref={textareaRef}
            className={cn(
              "w-full h-full resize-none outline-none bg-transparent p-2 rounded-md scrollbar-hide overflow-hidden transition-colors",
              isSelected
                ? "!border-2 !border-purple-500 border-solid"
                : isHovered
                ? "border-2 border-gray-400 dark:border-gray-500"
                : "border-2 border-gray-200 dark:border-gray-700"
            )}
            value={item.content || ""}
            onChange={(e) => {
              onUpdate({ content: e.target.value });
              // Trigger height update on next tick
              setTimeout(updateTextHeight, 0);
            }}
            placeholder="Enter text..."
            style={{
              fontSize: "inherit",
              fontFamily: "inherit",
              color: "inherit",
              minHeight: "34px", // Minimum height to show placeholder
              boxSizing: "border-box",
            }}
          />
        )}
        {item.type === "image" && item.content && (
          <img
            src={item.content}
            alt="Moodboard item"
            className="w-full h-full object-cover rounded-md"
            style={{ pointerEvents: "none" }}
          />
        )}
        {item.type === "rectangle" && (
          <div className="w-full h-full rounded-md bg-blue-100 dark:bg-blue-900/20" />
        )}
        {item.type === "circle" && (
          <div className="w-full h-full rounded-full bg-green-100 dark:bg-green-900/20" />
        )}
      </div>

      {/* Hover controls */}
      {(isHovered || isSelected) && (
        <>
          <div className="flex flex-row absolute -top-8 left-0 gap-1 bg-muted-foreground/50 rounded-lg p-1">
            {/* Handle in top center (left of center) */}
            <div className="drag-handle w-6 h-6 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg flex items-center justify-center cursor-move hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <GripHorizontal className="w-3 h-3 text-gray-600 dark:text-gray-400" />
            </div>

            <button
              className=" w-6 h-6 bg-red-500 hover:bg-red-600 border border-red-600 rounded-md shadow-lg flex items-center justify-center text-white transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          {/*

          Connection dots at corners
          <div className="absolute -top-1.5 -left-1.5 w-2 h-2 bg-blue-500 border-2 border-white dark:border-gray-800 rounded-full shadow-sm cursor-crosshair" />
          <div className="absolute -top-1.5 -right-1.5 w-2 h-2 bg-blue-500 border-2 border-white dark:border-gray-800 rounded-full shadow-sm cursor-crosshair" />
          <div className="absolute -bottom-1.5 -left-1.5 w-2 h-2 bg-blue-500 border-2 border-white dark:border-gray-800 rounded-full shadow-sm cursor-crosshair" />
          <div className="absolute -bottom-1.5 -right-1.5 w-2 h-2 bg-blue-500 border-2 border-white dark:border-gray-800 rounded-full shadow-sm cursor-crosshair" />

          Connection dots at edge midpoints
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-500 border-2 border-white dark:border-gray-800 rounded-full shadow-sm cursor-crosshair" />
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-500 border-2 border-white dark:border-gray-800 rounded-full shadow-sm cursor-crosshair" />
          <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 border-2 border-white dark:border-gray-800 rounded-full shadow-sm cursor-crosshair" />
          <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 border-2 border-white dark:border-gray-800 rounded-full shadow-sm cursor-crosshair" />
          */}
        </>
      )}
    </Rnd>
  );
}
