import { useState } from "react";
import { useSpaceActions } from "~/hooks/use-space-actions";
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

interface CreateSpaceModalProps {
  children: React.ReactNode;
}

export function CreateSpaceModal({ children }: CreateSpaceModalProps) {
  const [title, setTitle] = useState("");
  const [password, setPassword] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");
  const { isCreating, handleCreateSpace } = useSpaceActions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear any previous errors
    setError("");

    try {
      const options: { title?: string; password?: string } = {};

      // Only include title if user provided one
      if (title.trim()) {
        options.title = title.trim();
      }

      // Only include password if user provided one
      if (password.trim()) {
        options.password = password.trim();
      }

      // Use the existing handleCreateSpace function
      const result = await handleCreateSpace(options);

      if (result?.success !== false) {
        // Close modal and reset form on success
        setIsOpen(false);
        setTitle("");
        setPassword("");
        setError("");
      } else {
        // Handle rate limiting with more specific error message
        if (result?.rateLimited) {
          setError(
            result.error ||
              "Rate limit exceeded. Please wait before creating another space."
          );
        } else {
          setError(
            result?.error || "Failed to create space. Please try again."
          );
        }
      }
    } catch (err) {
      setError("Failed to create space. Please try again.");
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset form when modal closes
      setTitle("");
      setPassword("");
      setError("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Space</DialogTitle>
          <DialogDescription>
            Create a new collaborative workspace. Title and password are
            optional.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="space-title" className="text-sm font-medium">
                Space Title (Optional)
              </label>
              <Input
                id="space-title"
                type="text"
                placeholder="Enter a title for your space..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isCreating}
              />
              <p className="text-xs text-muted-foreground">
                Give your space a meaningful name to help identify it
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="space-password" className="text-sm font-medium">
                Password (Optional)
              </label>
              <Input
                id="space-password"
                type="password"
                placeholder="Enter a password to protect your space..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isCreating}
              />
              <p className="text-xs text-muted-foreground">
                Set a password to restrict access to your space
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">{error}</p>
                {error.includes("Rate limit") && (
                  <p className="text-xs text-red-600 mt-1">
                    This helps prevent spam and keeps the service running
                    smoothly for everyone.
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Space"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
