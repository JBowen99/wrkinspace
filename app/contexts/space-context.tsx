import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useParams } from "react-router";
import { supabase } from "~/lib/supabase";
import type { Tables } from "../../database.types";

// Types
type Space = Tables<"spaces">;
type Page = Tables<"pages">;
type Participant = Tables<"participants">;

interface SpaceData {
  space: Space | null;
  pages: Page[];
  participants: Participant[];
}

interface SpaceContextType {
  spaceData: SpaceData;
  loading: boolean;
  error: string | null;
  refetchSpace: () => Promise<void>;
  currentSpaceId: string | null;
}

// Context
const SpaceContext = createContext<SpaceContextType | undefined>(undefined);

// Provider Props
interface SpaceProviderProps {
  children: React.ReactNode;
}

// Provider Component
export function SpaceProvider({ children }: SpaceProviderProps) {
  const { id: spaceId } = useParams();
  const [spaceData, setSpaceData] = useState<SpaceData>({
    space: null,
    pages: [],
    participants: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to load space data
  const loadSpaceData = useCallback(async (id: string) => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      // Load space
      const { data: space, error: spaceError } = await supabase
        .from("spaces")
        .select("*")
        .eq("id", id)
        .single();

      if (spaceError) {
        throw new Error(`Failed to load space: ${spaceError.message}`);
      }

      // Load pages for this space
      const { data: pages, error: pagesError } = await supabase
        .from("pages")
        .select("*")
        .eq("space_id", id)
        .order("order", { ascending: true });

      if (pagesError) {
        throw new Error(`Failed to load pages: ${pagesError.message}`);
      }

      // Load participants for this space
      const { data: participants, error: participantsError } = await supabase
        .from("participants")
        .select("*")
        .eq("space_id", id);

      if (participantsError) {
        throw new Error(
          `Failed to load participants: ${participantsError.message}`
        );
      }

      setSpaceData({
        space,
        pages: pages || [],
        participants: participants || [],
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
      console.error("Error loading space data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Function to refetch space data
  const refetchSpace = useCallback(async () => {
    if (spaceId) {
      await loadSpaceData(spaceId);
    }
  }, [spaceId, loadSpaceData]);

  // Effect to load space data when spaceId changes
  useEffect(() => {
    if (spaceId) {
      loadSpaceData(spaceId);
    } else {
      // Reset state when there's no spaceId
      setSpaceData({
        space: null,
        pages: [],
        participants: [],
      });
      setError(null);
      setLoading(false);
    }
  }, [spaceId, loadSpaceData]);

  // Set up real-time subscriptions for space updates
  useEffect(() => {
    if (!spaceId) return;

    // Subscribe to pages changes
    const pagesSubscription = supabase
      .channel(`pages_${spaceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pages",
          filter: `space_id=eq.${spaceId}`,
        },
        () => {
          // Refetch pages when changes occur
          refetchSpace();
        }
      )
      .subscribe();

    // Subscribe to participants changes
    const participantsSubscription = supabase
      .channel(`participants_${spaceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "participants",
          filter: `space_id=eq.${spaceId}`,
        },
        () => {
          // Refetch participants when changes occur
          refetchSpace();
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      pagesSubscription.unsubscribe();
      participantsSubscription.unsubscribe();
    };
  }, [spaceId, refetchSpace]);

  const contextValue: SpaceContextType = {
    spaceData,
    loading,
    error,
    refetchSpace,
    currentSpaceId: spaceId || null,
  };

  return (
    <SpaceContext.Provider value={contextValue}>
      {children}
    </SpaceContext.Provider>
  );
}

// Custom hook to use the space context
export function useSpace() {
  const context = useContext(SpaceContext);
  if (context === undefined) {
    throw new Error("useSpace must be used within a SpaceProvider");
  }
  return context;
}

// Hook for accessing individual parts of space data
export function useSpaceData() {
  const { spaceData } = useSpace();
  return spaceData;
}

export function useSpacePages() {
  const { spaceData } = useSpace();
  return spaceData.pages;
}

export function useSpaceParticipants() {
  const { spaceData } = useSpace();
  return spaceData.participants;
}

export function useCurrentSpace() {
  const { spaceData } = useSpace();
  return spaceData.space;
}
