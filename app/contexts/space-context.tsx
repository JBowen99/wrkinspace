import React, { createContext, useContext, useState, useEffect } from "react";
import type { Tables } from "../../database.types";
import {
  checkSpaceRequirements,
  joinSpace,
  loadPagesForSpace,
  createPage as createPageUtil,
  renamePage as renamePageUtil,
  deletePage as deletePageUtil,
  addRecentlyVisitedSpace,
} from "~/lib/space-utils";

type Space = Tables<"spaces">;
type Page = Tables<"pages">;

interface SpaceContextType {
  space: Space | null;
  pages: Page[];
  isLoading: boolean;
  error: string | null;
  requiresPassword: boolean;
  isAuthenticated: boolean;
  loadSpace: (spaceId: string) => Promise<void>;
  authenticateSpace: (password: string) => Promise<boolean>;
  clearSpace: () => void;
  createPage: (
    title: string,
    type: "document" | "moodboard" | "kanban"
  ) => Promise<boolean>;
  renamePage: (pageId: string, newTitle: string) => Promise<boolean>;
  deletePage: (pageId: string) => Promise<boolean>;
  loadPages: () => Promise<void>;
}

const SpaceContext = createContext<SpaceContextType | undefined>(undefined);

export { SpaceContext };

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

export function useSpace() {
  const context = useContext(SpaceContext);
  if (context === undefined) {
    throw new Error("useSpace must be used within a SpaceProvider");
  }
  return context;
}

interface SpaceProviderProps {
  children: React.ReactNode | ((context: SpaceContextType) => React.ReactNode);
  initialSpaceId?: string;
}

export function SpaceProvider({
  children,
  initialSpaceId,
}: SpaceProviderProps) {
  const [space, setSpace] = useState<Space | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const loadPages = async () => {
    if (!space) return;

    try {
      console.log("Loading pages for space:", space.id);
      const result = await loadPagesForSpace(space.id);

      if (result.error) {
        console.error("Error loading pages:", result.error);
        // Don't set error state for page loading issues - just log them
        // This prevents the UI from breaking due to RLS policy issues
        setPages([]); // Set empty array instead
        return;
      }

      setPages(result.pages);
      console.log("Pages loaded successfully:", result.pages.length);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load pages";
      console.error("Exception loading pages:", err);
      // Don't set error state for page loading issues - just log them
      setPages([]); // Set empty array instead
    }
  };

  const createPage = async (
    title: string,
    type: "document" | "moodboard" | "kanban"
  ): Promise<boolean> => {
    if (!space) {
      console.error("No space available for creating page");
      return false;
    }

    try {
      const result = await createPageUtil(space.id, title, type);
      if (result.error || !result.page) {
        console.error("Error creating page:", result.error);
        setError(result.error || "Failed to create page");
        return false;
      }

      // Add the new page to the pages state
      setPages((prevPages) => [...prevPages, result.page!]);
      console.log("Page created successfully:", result.page);
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create page";
      console.error("Error creating page:", err);
      setError(errorMessage);
      return false;
    }
  };

  const renamePage = async (
    pageId: string,
    newTitle: string
  ): Promise<boolean> => {
    try {
      const result = await renamePageUtil(pageId, newTitle);
      if (result.error || !result.page) {
        console.error("Error renaming page:", result.error);
        setError(result.error || "Failed to rename page");
        return false;
      }

      // Update the page in the pages state
      setPages((prevPages) =>
        prevPages.map((page) =>
          page.id === pageId ? { ...page, title: newTitle } : page
        )
      );
      console.log("Page renamed successfully:", result.page);
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to rename page";
      console.error("Error renaming page:", err);
      setError(errorMessage);
      return false;
    }
  };

  const deletePage = async (pageId: string): Promise<boolean> => {
    try {
      const result = await deletePageUtil(pageId);
      if (!result.success) {
        console.error("Error deleting page:", result.error);
        setError(result.error || "Failed to delete page");
        return false;
      }

      // Remove the page from the pages state
      setPages((prevPages) => prevPages.filter((page) => page.id !== pageId));
      console.log("Page deleted successfully");
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete page";
      console.error("Error deleting page:", err);
      setError(errorMessage);
      return false;
    }
  };

  const loadSpace = async (spaceId: string) => {
    if (!spaceId) return;

    console.log("Loading space:", spaceId);
    setIsLoading(true);
    setError(null);

    try {
      const result = await checkSpaceRequirements(spaceId);
      console.log("Space requirements result:", result);

      if (result.error || !result.exists) {
        console.log("Space not found or error:", result.error);
        setError(result.error || "Space not found");
        setSpace(null);
        setRequiresPassword(false);
        return;
      }

      // Create space object from the result
      const spaceData: Space = {
        id: spaceId,
        title: result.title || null,
        password: null, // We don't expose the actual password
        qr_code_data: "", // This would need to be fetched separately if needed
        created_at: null, // This would need to be fetched separately if needed
      };

      console.log("Space loaded successfully:", spaceData);
      setSpace(spaceData);
      setRequiresPassword(result.requiresPassword);

      // Add to recently visited spaces
      addRecentlyVisitedSpace(spaceId, result.title);

      // Check authentication status
      if (result.requiresPassword) {
        const authenticatedSpaces = getAuthenticatedSpaces();
        setIsAuthenticated(authenticatedSpaces.has(spaceId));
        console.log(
          "Password required, authenticated:",
          authenticatedSpaces.has(spaceId)
        );
      } else {
        setIsAuthenticated(true);
        console.log("No password required, user is authenticated");
      }

      // Load pages for this space - but only after setting space
      // We'll call loadPages after space is set using useEffect
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load space";
      console.error("Error loading space:", err);
      setError(errorMessage);
      setSpace(null);
      setRequiresPassword(false);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const authenticateSpace = async (password: string): Promise<boolean> => {
    if (!space) {
      console.error("No space available for authentication");
      return false;
    }

    console.log("Authenticating space:", space.id);

    try {
      const result = await joinSpace(space.id, password);
      console.log("joinSpace result:", result);

      if (result.success) {
        // Add to authenticated spaces
        const authenticatedSpaces = getAuthenticatedSpaces();
        authenticatedSpaces.add(space.id);
        saveAuthenticatedSpaces(authenticatedSpaces);

        setIsAuthenticated(true);
        console.log("Authentication successful, user authenticated");
        return true;
      }

      console.log("Authentication failed:", result.error);
      return false;
    } catch (error) {
      console.error("Authentication failed with exception:", error);
      return false;
    }
  };

  const clearSpace = () => {
    setSpace(null);
    setPages([]);
    setError(null);
    setRequiresPassword(false);
    setIsAuthenticated(false);
  };

  // Load pages when space is loaded and user is authenticated
  useEffect(() => {
    if (space && isAuthenticated) {
      loadPages();
    }
  }, [space, isAuthenticated]);

  // Load initial space if provided
  useEffect(() => {
    if (initialSpaceId) {
      loadSpace(initialSpaceId);
    }
  }, [initialSpaceId]);

  const value: SpaceContextType = {
    space,
    pages,
    isLoading,
    error,
    requiresPassword,
    isAuthenticated,
    loadSpace,
    authenticateSpace,
    clearSpace,
    createPage,
    renamePage,
    deletePage,
    loadPages,
  };

  return (
    <SpaceContext.Provider value={value}>
      {typeof children === "function" ? children(value) : children}
    </SpaceContext.Provider>
  );
}
