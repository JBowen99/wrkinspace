import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import type { Tables } from "../../database.types";
import { supabase } from "~/lib/supabase";
import {
  checkSpaceRequirements,
  joinSpaceSecure,
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

  // Store the subscription references for cleanup
  const subscriptionRef = useRef<any>(null);
  const deleteSubscriptionRef = useRef<any>(null);

  const loadPages = async () => {
    if (!space) return;

    try {
      const result = await loadPagesForSpace(space.id);

      if (result.error) {
        console.error("Error loading pages:", result.error);
        // Don't set error state for page loading issues - just log them
        // This prevents the UI from breaking due to RLS policy issues
        setPages([]); // Set empty array instead
        return;
      }

      setPages(result.pages);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load pages";
      console.error("Exception loading pages:", err);
      // Don't set error state for page loading issues - just log them
      setPages([]); // Set empty array instead
    }
  };

  // Set up real-time subscription for pages
  useEffect(() => {
    if (!space || !isAuthenticated) {
      // Clean up existing subscriptions if space or auth changes
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      if (deleteSubscriptionRef.current) {
        deleteSubscriptionRef.current.unsubscribe();
        deleteSubscriptionRef.current = null;
      }
      return;
    }

    // Set up real-time subscription with enhanced debugging
    console.log("🔄 Setting up real-time subscription for space:", space.id);

    // FUCK IT - SEPARATE DELETE SUBSCRIPTION
    console.log("🔥 Creating SEPARATE DELETE subscription");
    const deleteSubscription = supabase
      .channel(`DELETE-ONLY-${space.id}`)
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "pages",
        },
        (payload) => {
          console.log("🔥🔥🔥 SEPARATE DELETE EVENT:", payload);

          if (payload.old && payload.old.id) {
            const deletedPageId = payload.old.id;
            console.log("🔥 Deleted page ID:", deletedPageId);

            setPages((prevPages) => {
              console.log(
                "🔥 Before filter - pages:",
                prevPages.map((p) => p.id)
              );

              // Check if this page exists in our current space's pages
              const pageExists = prevPages.some(
                (page) => page.id === deletedPageId
              );
              console.log("🔥 Page exists in our space?", pageExists);

              if (pageExists) {
                const filtered = prevPages.filter(
                  (page) => page.id !== deletedPageId
                );
                console.log(
                  "🔥 After filter - pages:",
                  filtered.map((p) => p.id)
                );
                console.log("🔥 SUCCESSFULLY REMOVED PAGE:", deletedPageId);
                return filtered;
              } else {
                console.log("🔥 Page not in our space, ignoring DELETE");
                return prevPages;
              }
            });
          } else {
            console.error("🔥 DELETE event missing page ID:", payload);
          }
        }
      )
      .subscribe((status) => {
        console.log("🔥 DELETE subscription status:", status);
      });

    deleteSubscriptionRef.current = deleteSubscription;

    const subscription = supabase
      .channel(`pages-realtime-${space.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pages",
          filter: `space_id=eq.${space.id}`,
        },
        (payload: any) => {
          console.log("🔥 RAW EVENT:", payload.eventType, payload);

          switch (payload.eventType) {
            case "INSERT":
              console.log("🆕 Processing INSERT");
              const newPage = payload.new as Page;
              setPages((prevPages) => {
                const exists = prevPages.some((page) => page.id === newPage.id);
                if (!exists) {
                  console.log("➕ Adding:", newPage.id, newPage.title);
                  return [...prevPages, newPage];
                }
                console.log("⚠️ Already exists:", newPage.id);
                return prevPages;
              });
              break;

            case "UPDATE":
              console.log("✏️ Processing UPDATE");
              const updatedPage = payload.new as Page;
              setPages((prevPages) => {
                const updated = prevPages.map((page) =>
                  page.id === updatedPage.id ? updatedPage : page
                );
                console.log(
                  "📝 Updated:",
                  updatedPage.id,
                  "->",
                  updatedPage.title
                );
                return updated;
              });
              break;

            case "DELETE":
              console.log("🗑️ Processing DELETE");
              const deletedPage = payload.old as Page;
              if (deletedPage && deletedPage.id) {
                setPages((prevPages) => {
                  const filtered = prevPages.filter(
                    (page) => page.id !== deletedPage.id
                  );
                  console.log("🗑️ REMOVED:", deletedPage.id);
                  console.log(
                    "📋 Remaining:",
                    filtered.map((p) => p.id)
                  );
                  return filtered;
                });
              } else {
                console.error("🗑️ DELETE event missing page data:", payload);
              }
              break;

            default:
              console.log("❓ Unknown event:", payload.eventType);
          }
        }
      )
      .subscribe((status) => {
        console.log("📡 Real-time subscription status:", status);
        if (status === "SUBSCRIBED") {
          console.log("✅ Real-time subscription active for space:", space.id);
        } else if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          console.error(
            "❌ Real-time subscription failed for space:",
            space.id,
            "Status:",
            status
          );
        }
      });

    subscriptionRef.current = subscription;

    // Cleanup function
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      if (deleteSubscriptionRef.current) {
        deleteSubscriptionRef.current.unsubscribe();
        deleteSubscriptionRef.current = null;
        console.log("🔥 Cleaned up DELETE subscription");
      }
    };
  }, [space, isAuthenticated]);

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

      // Optimistically update the UI immediately for better UX
      // The real-time subscription will handle updates from other users
      setPages((prevPages) => {
        // Check if page already exists to avoid duplicates
        const exists = prevPages.some((page) => page.id === result.page!.id);
        if (!exists) {
          return [...prevPages, result.page!];
        }
        return prevPages;
      });

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

      // Optimistically update the UI immediately for better UX
      // The real-time subscription will handle updates from other users
      setPages((prevPages) =>
        prevPages.map((page) =>
          page.id === pageId ? { ...page, title: newTitle } : page
        )
      );

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
    console.log("🗑️ DELETING PAGE:", pageId);

    try {
      const result = await deletePageUtil(pageId);
      console.log("🗑️ DELETE RESULT:", result);

      if (!result.success) {
        console.error("❌ DELETE FAILED:", result.error);
        setError(result.error || "Failed to delete page");
        return false;
      }

      console.log("✅ DELETE SUCCESS - Database updated");

      // Optimistically update the UI immediately for better UX
      setPages((prevPages) => {
        const filtered = prevPages.filter((page) => page.id !== pageId);
        console.log("🗑️ OPTIMISTIC UPDATE - Local state updated");
        return filtered;
      });

      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete page";
      console.error("❌ DELETE EXCEPTION:", err);
      setError(errorMessage);
      return false;
    }
  };

  const loadSpace = async (spaceId: string) => {
    if (!spaceId) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await checkSpaceRequirements(spaceId);

      if (result.error || !result.exists) {
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
        last_accessed: null, // This would need to be fetched separately if needed
      };

      setSpace(spaceData);
      setRequiresPassword(result.requiresPassword);

      // Add to recently visited spaces
      addRecentlyVisitedSpace(spaceId, result.title);

      // Check authentication status
      if (result.requiresPassword) {
        const authenticatedSpaces = getAuthenticatedSpaces();
        setIsAuthenticated(authenticatedSpaces.has(spaceId));
      } else {
        setIsAuthenticated(true);
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

    try {
      const result = await joinSpaceSecure(space.id, password);

      if (result.success) {
        // Add to authenticated spaces
        const authenticatedSpaces = getAuthenticatedSpaces();
        authenticatedSpaces.add(space.id);
        saveAuthenticatedSpaces(authenticatedSpaces);

        setIsAuthenticated(true);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Authentication failed with exception:", error);
      return false;
    }
  };

  const clearSpace = () => {
    // Clean up real-time subscriptions
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
    if (deleteSubscriptionRef.current) {
      deleteSubscriptionRef.current.unsubscribe();
      deleteSubscriptionRef.current = null;
    }

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
