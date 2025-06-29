import { useState } from "react";
import { useSpace } from "~/contexts/space-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import { Button } from "./button";
import { Input } from "./input";
import QRCode from "react-qr-code";
import { Copy, Check } from "lucide-react";

interface ShareSpaceModalProps {
  children: React.ReactNode;
}

export function ShareSpaceModal({ children }: ShareSpaceModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedSpaceId, setCopiedSpaceId] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const { space } = useSpace();

  const currentSpaceId = space?.id;
  const spaceUrl =
    space?.qr_code_data ||
    (currentSpaceId && typeof window !== "undefined"
      ? `${window.location.origin}/space/${currentSpaceId}`
      : "");

  const handleCopySpaceId = async () => {
    if (!currentSpaceId || typeof window === "undefined") return;

    try {
      await navigator.clipboard.writeText(currentSpaceId);
      setCopiedSpaceId(true);
      setTimeout(() => setCopiedSpaceId(false), 2000);
    } catch (err) {
      console.error("Failed to copy space ID:", err);
    }
  };

  const handleCopyUrl = async () => {
    if (!spaceUrl || typeof window === "undefined") return;

    try {
      await navigator.clipboard.writeText(spaceUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset copied states when modal closes
      setCopiedSpaceId(false);
      setCopiedUrl(false);
    }
  };

  if (!currentSpaceId) {
    return null; // Don't render if we're not in a space
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Space</DialogTitle>
          <DialogDescription>
            Share this space with others using the QR code or space ID below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* QR Code Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="bg-white p-4 rounded-lg border">
              <QRCode
                value={spaceUrl}
                size={200}
                level="M"
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Scan this QR code to join the space instantly
            </p>
          </div>

          {/* Space ID Section */}
          <div className="space-y-2">
            <label htmlFor="space-id" className="text-sm font-medium">
              Space ID
            </label>
            <div className="flex gap-2">
              <Input
                id="space-id"
                type="text"
                value={currentSpaceId}
                readOnly
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopySpaceId}
                title="Copy Space ID"
              >
                {copiedSpaceId ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Space URL Section */}
          <div className="space-y-2">
            <label htmlFor="space-url" className="text-sm font-medium">
              Space URL
            </label>
            <div className="flex gap-2">
              <Input
                id="space-url"
                type="text"
                value={spaceUrl}
                readOnly
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopyUrl}
                title="Copy Space URL"
              >
                {copiedUrl ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {space?.password && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This space is password-protected. Users
                will need to enter the password when joining.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
