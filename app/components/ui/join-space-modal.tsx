import { useState } from "react";
import { useSpaceActions } from "~/hooks/use-space-actions";
import { checkSpaceRequirements } from "~/lib/space-utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import { Button } from "./button";
import { Input } from "./input";

interface JoinSpaceModalProps {
  children: React.ReactNode;
}

export function JoinSpaceModal({ children }: JoinSpaceModalProps) {
  const [spaceId, setSpaceId] = useState("");
  const [password, setPassword] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [spaceInfo, setSpaceInfo] = useState<{
    requiresPassword: boolean;
    title?: string;
  } | null>(null);
  const { handleJoinSpace } = useSpaceActions();

  const handleCheckSpace = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear any previous errors
    setError("");

    // Validate space ID
    if (!spaceId.trim()) {
      setError("Please enter a space ID");
      return;
    }

    // Basic validation for space ID format
    if (spaceId.trim().length < 3) {
      setError("Space ID must be at least 3 characters long");
      return;
    }

    setIsChecking(true);

    try {
      const result = await checkSpaceRequirements(spaceId.trim());

      if (!result.exists) {
        setError(result.error || "Space not found. Please check the space ID.");
        setIsChecking(false);
        return;
      }

      // If space exists, store its info and show password field if needed
      setSpaceInfo({
        requiresPassword: result.requiresPassword,
        title: result.title,
      });

      // If no password required, join immediately
      if (!result.requiresPassword) {
        try {
          await handleJoinSpace(spaceId.trim());
          setIsOpen(false);
          setSpaceId("");
          setPassword("");
          setError("");
          setSpaceInfo(null);
        } catch (err) {
          setError("Failed to join space. Please try again.");
        }
      }
    } catch (err) {
      setError("Failed to check space. Please try again.");
    } finally {
      setIsChecking(false);
    }
  };

  const handleJoinWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (spaceInfo?.requiresPassword && !password.trim()) {
      setError("Please enter the password for this space");
      return;
    }

    try {
      // Use the existing handleJoinSpace function with password
      await handleJoinSpace(spaceId.trim(), password.trim());

      // Close modal and reset form on success
      setIsOpen(false);
      setSpaceId("");
      setPassword("");
      setError("");
      setSpaceInfo(null);
    } catch (err) {
      setError(
        "Failed to join space. Please check the password and try again."
      );
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset form when modal closes
      setSpaceId("");
      setPassword("");
      setError("");
      setSpaceInfo(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md max-w-[calc(100vw-1rem)] mx-2">
        <DialogHeader>
          <DialogTitle>Join a Space</DialogTitle>
          <DialogDescription>
            {!spaceInfo
              ? "Enter the space ID to join an existing collaborative space."
              : spaceInfo.requiresPassword
              ? `Enter the password for ${
                  spaceInfo.title ? `"${spaceInfo.title}"` : "this space"
                }.`
              : "Joining space..."}
          </DialogDescription>
        </DialogHeader>

        {!spaceInfo ? (
          // Step 1: Enter Space ID
          <form onSubmit={handleCheckSpace}>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="space-id" className="text-sm font-medium">
                  Space ID
                </label>
                <Input
                  id="space-id"
                  type="text"
                  placeholder="Enter space ID..."
                  value={spaceId}
                  onChange={(e) => setSpaceId(e.target.value)}
                  className={error ? "border-red-500 min-h-11" : "min-h-11"}
                  disabled={isChecking}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            <DialogFooter className="mt-6 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isChecking}
                className="min-h-11"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isChecking} className="min-h-11">
                {isChecking ? "Checking..." : "Join Space"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          // Step 2: Enter Password (if required)
          <form onSubmit={handleJoinWithPassword}>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">
                    <strong>Space found:</strong> {spaceInfo.title || spaceId}
                    {spaceInfo.requiresPassword && " (Password protected)"}
                  </p>
                </div>
              </div>

              {spaceInfo.requiresPassword && (
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter space password..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={error ? "border-red-500 min-h-11" : "min-h-11"}
                    autoFocus
                  />
                </div>
              )}

              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            <DialogFooter className="mt-6 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSpaceInfo(null);
                  setPassword("");
                  setError("");
                }}
                className="min-h-11"
              >
                Back
              </Button>
              <Button type="submit" className="min-h-11">
                Join Space
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
