import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import { Input } from "./input";
import { Button } from "./button";
import { useSpaceSettings } from "~/hooks/use-space-settings";
import { useSpace } from "~/contexts/space-context";

interface SpaceTitleModalProps {
  children: React.ReactNode;
}

export function SpaceTitleModal({ children }: SpaceTitleModalProps) {
  const { space } = useSpace();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  const { updateTitle, isLoading, error, clearError } = useSpaceSettings(
    space?.id || ""
  );

  // Initialize form values when modal opens or space changes
  useEffect(() => {
    if (space && isOpen) {
      setTitle(space.title || "");
      setHasChanges(false);
    }
  }, [space, isOpen]);

  // Track changes
  useEffect(() => {
    if (space) {
      const titleChanged = title !== (space.title || "");
      setHasChanges(titleChanged);
    }
  }, [title, space]);

  const handleSave = async () => {
    if (!space) return;

    clearError();

    // Update title if changed
    if (title !== (space.title || "")) {
      const titleSuccess = await updateTitle(title);
      if (titleSuccess) {
        setIsOpen(false);
        setHasChanges(false);
        // Refresh the page to reflect changes
        window.location.reload();
      }
    }
  };

  const handleCancel = () => {
    if (space) {
      setTitle(space.title || "");
      setHasChanges(false);
    }
    clearError();
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && hasChanges && !isLoading) {
      handleSave();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Space Title</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Space Title
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter space title"
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges || isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
