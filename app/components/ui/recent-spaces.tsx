import React, { useState, useEffect } from "react";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Clock, X } from "lucide-react";
import { useNavigate } from "react-router";
import { 
  getRecentlyVisitedSpaces, 
  removeRecentlyVisitedSpace, 
  type RecentSpace 
} from "~/lib/space-utils";

interface RecentSpacesProps {
  className?: string;
}

export function RecentSpaces({ className }: RecentSpacesProps) {
  const [recentSpaces, setRecentSpaces] = useState<RecentSpace[]>([]);
  const navigate = useNavigate();

  // Load recent spaces on component mount and when window regains focus
  useEffect(() => {
    const loadRecentSpaces = () => {
      const spaces = getRecentlyVisitedSpaces();
      setRecentSpaces(spaces);
    };

    // Load initially
    loadRecentSpaces();

    // Refresh when window regains focus (user returns to tab)
    const handleFocus = () => {
      loadRecentSpaces();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Handle removing a space from recent list
  const handleRemoveSpace = (spaceId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    removeRecentlyVisitedSpace(spaceId);
    setRecentSpaces(prev => prev.filter(space => space.id !== spaceId));
  };

  // Handle clicking on a space card
  const handleSpaceClick = (spaceId: string) => {
    navigate(`/space/${spaceId}`);
  };

  // Format the last visited date
  const formatLastVisited = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  // Don't render if no recent spaces
  if (recentSpaces.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Recent Spaces:</h2>
      </div>
      
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {recentSpaces.map((space) => (
          <Card 
            key={space.id} 
            className="cursor-pointer hover:shadow-md transition-shadow relative group"
            onClick={() => handleSpaceClick(space.id)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-sm font-medium truncate flex-1 mr-2">
                  {space.title}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 shrink-0"
                  onClick={(e) => handleRemoveSpace(space.id, e)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-mono">
                  ID: {space.id}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatLastVisited(space.lastVisited)}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 