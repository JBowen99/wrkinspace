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
import { User } from "lucide-react";
import { useUserName } from "~/hooks/use-user-name";

interface SpaceSettingsModalProps {
  children: React.ReactNode;
}

export function SpaceSettingsModal({ children }: SpaceSettingsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempUserName, setTempUserName] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  const { userName, saveUserName, getCurrentUserName } = useUserName();

  // Initialize temp name when modal opens
  useEffect(() => {
    if (isOpen) {
      setTempUserName(userName);
      setHasChanges(false);
    }
  }, [isOpen, userName]);

  // Track changes
  useEffect(() => {
    const currentUserName = getCurrentUserName();
    setHasChanges(tempUserName !== currentUserName);
  }, [tempUserName, getCurrentUserName]);

  const handleSave = async () => {
    // Save user name using the hook
    saveUserName(tempUserName);

    setIsOpen(false);
    setHasChanges(false);

    // TODO: In the future, this will sync with the server for collaboration
    console.log("User name saved:", tempUserName);
  };

  const handleCancel = () => {
    setTempUserName(userName);
    setHasChanges(false);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && hasChanges) {
      handleSave();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>User Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="userName"
              className="text-sm font-medium flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              Your Name
            </label>
            <Input
              id="userName"
              value={tempUserName}
              onChange={(e) => setTempUserName(e.target.value)}
              placeholder="Enter your name"
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              This will be used for collaboration features in the future.
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
