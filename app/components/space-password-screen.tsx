import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface SpacePasswordScreenProps {
  spaceTitle?: string;
  spaceId: string;
  onPasswordSubmit: (password: string) => Promise<boolean>;
  isLoading?: boolean;
}

export function SpacePasswordScreen({
  spaceTitle,
  spaceId,
  onPasswordSubmit,
  isLoading = false,
}: SpacePasswordScreenProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      setError("Please enter the password");
      return;
    }

    console.log("Attempting to authenticate...");
    setIsSubmitting(true);
    setError("");

    try {
      const success = await onPasswordSubmit(password);
      console.log("Authentication result:", success);

      if (success) {
        // Reset form on success
        setPassword("");
        setError("");
        console.log("Authentication successful!");
      } else {
        setError("Incorrect password. Please try again.");
        console.log("Authentication failed - incorrect password");
      }
    } catch (err) {
      console.error("Authentication error:", err);
      setError("Failed to verify password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading space...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold mb-2">Space Password Required</h1>
          <p className="text-muted-foreground">
            This space is password protected. Please enter the password to
            access {spaceTitle ? `"${spaceTitle}"` : `space ${spaceId}`}.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="space-password"
              className="block text-sm font-medium mb-2"
            >
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

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => window.history.back()}
              disabled={isSubmitting}
            >
              Back
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? "Verifying..." : "Access Space"}
            </Button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            Space ID:{" "}
            <code className="bg-gray-100 px-2 py-1 rounded">{spaceId}</code>
          </p>
        </div>
      </div>
    </div>
  );
}
