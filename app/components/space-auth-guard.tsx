import React, { useState, useEffect } from "react";
import { SpacePasswordModal } from "~/components/ui/space-password-modal";
import { joinSpace } from "~/lib/space-utils";
import type { Tables } from "../../database.types";

type Space = Tables<"spaces">;

interface SpaceAuthGuardProps {
  space: Space;
  children: React.ReactNode;
  onAuthenticationRequired?: () => void;
}

// Helper to manage authenticated spaces in localStorage
const getAuthenticatedSpaces = (): Set<string> => {
  if (typeof window === "undefined") return new Set();
  try {
    const stored = localStorage.getItem("wrkinspace_authenticated");
    return new Set(stored ? JSON.parse(stored) : []);
  } catch {
    return new Set();
  }
};

const saveAuthenticatedSpaces = (spaces: Set<string>) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("wrkinspace_authenticated", JSON.stringify([...spaces]));
};

export function SpaceAuthGuard({
  space,
  children,
  onAuthenticationRequired,
}: SpaceAuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = () => {
      const requiresPassword = !!space.password;

      if (!requiresPassword) {
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      const authenticatedSpaces = getAuthenticatedSpaces();
      const isSpaceAuthenticated = authenticatedSpaces.has(space.id);

      setIsAuthenticated(isSpaceAuthenticated);
      setIsLoading(false);

      if (!isSpaceAuthenticated) {
        setShowPasswordModal(true);
        onAuthenticationRequired?.();
      }
    };

    checkAuth();
  }, [space.id, space.password, onAuthenticationRequired]);

  const handlePasswordSubmit = async (password: string): Promise<boolean> => {
    try {
      const result = await joinSpace(space.id, password);

      if (result.success) {
        // Add to authenticated spaces
        const authenticatedSpaces = getAuthenticatedSpaces();
        authenticatedSpaces.add(space.id);
        saveAuthenticatedSpaces(authenticatedSpaces);

        setIsAuthenticated(true);
        setShowPasswordModal(false);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Authentication failed:", error);
      return false;
    }
  };

  const handlePasswordCancel = () => {
    setShowPasswordModal(false);
    // Navigate back to home when user cancels password entry
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-semibold mb-2">Space Protected</h2>
            <p className="text-muted-foreground">
              This space requires a password to access
            </p>
          </div>
        </div>

        <SpacePasswordModal
          isOpen={showPasswordModal}
          spaceTitle={space.title || undefined}
          spaceId={space.id}
          onPasswordSubmit={handlePasswordSubmit}
          onCancel={handlePasswordCancel}
        />
      </>
    );
  }

  return <>{children}</>;
}
