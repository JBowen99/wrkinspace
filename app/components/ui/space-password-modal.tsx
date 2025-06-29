import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { Button } from "./button";
import { Input } from "./input";
import { Lock } from "lucide-react";

interface SpacePasswordModalProps {
  isOpen: boolean;
  spaceTitle?: string;
  spaceId: string;
  onPasswordSubmit: (password: string) => Promise<boolean>;
  onCancel: () => void;
}

export function SpacePasswordModal({
  isOpen,
  spaceTitle,
  spaceId,
  onPasswordSubmit,
  onCancel,
}: SpacePasswordModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      setError("Please enter the password");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const success = await onPasswordSubmit(password);
      if (success) {
        // Reset form on success
        setPassword("");
        setError("");
      } else {
        setError("Incorrect password. Please try again.");
      }
    } catch (err) {
      setError("Failed to verify password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isSubmitting) {
      onCancel();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-600" />
            <DialogTitle>Space Password Required</DialogTitle>
          </div>
          <DialogDescription>
            This space is password protected. Please enter the password to
            access {spaceTitle ? `"${spaceTitle}"` : `space ${spaceId}`}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="space-password" className="text-sm font-medium">
                Password <span className="text-red-500">*</span>
              </label>
              <Input
                id="space-password"
                type="password"
                placeholder="Enter space password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={error ? "border-red-500" : ""}
                disabled={isSubmitting}
                autoFocus
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Verifying..." : "Access Space"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
