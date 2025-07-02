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
import { Eye, EyeOff } from "lucide-react";

interface SpaceSettingsModalProps {
  children: React.ReactNode;
}

export function SpaceSettingsModal({ children }: SpaceSettingsModalProps) {
  const { space } = useSpace();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  // const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const { updateTitle, /* updatePassword, */ isLoading, error, clearError } =
    useSpaceSettings(space?.id || "");

  // Initialize form values when modal opens or space changes
  useEffect(() => {
    if (space && isOpen) {
      setTitle(space.title || "");
      // setPassword(space.password || "");
      setHasChanges(false);
    }
  }, [space, isOpen]);

  // Track changes
  useEffect(() => {
    if (space) {
      const titleChanged = title !== (space.title || "");
      // const passwordChanged = password !== (space.password || "");
      setHasChanges(titleChanged /* || passwordChanged */);
    }
  }, [title, /* password, */ space]);

  const handleSave = async () => {
    if (!space) return;

    clearError();
    let success = true;

    // Update title if changed
    if (title !== (space.title || "")) {
      const titleSuccess = await updateTitle(title);
      if (!titleSuccess) success = false;
    }

    // Update password if changed
    // if (password !== (space.password || "")) {
    //   const passwordSuccess = await updatePassword(password || undefined);
    //   if (!passwordSuccess) success = false;
    // }

    if (success) {
      setIsOpen(false);
      setHasChanges(false);
      // Refresh the page to reflect changes
      window.location.reload();
    }
  };

  const handleCancel = () => {
    if (space) {
      setTitle(space.title || "");
      // setPassword(space.password || "");
      setHasChanges(false);
    }
    clearError();
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Space Settings</DialogTitle>
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
