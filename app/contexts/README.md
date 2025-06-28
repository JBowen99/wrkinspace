# Space Context Setup

This directory contains the Supabase context for managing space data in the WrkInSpace application.

## Files

- `space-context.tsx` - Main context for managing space data, pages, and participants

## Environment Variables Required

Add these to your `.env` file:

```
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## Usage

The `SpaceProvider` is already configured in `app/root.tsx` and automatically loads space data based on the URL parameter.

### Available Hooks

```tsx
import {
  useSpace,
  useSpaceData,
  useSpacePages,
  useSpaceParticipants,
  useCurrentSpace,
} from "~/contexts/space-context";

// Get all space context data
const { spaceData, loading, error, refetchSpace, currentSpaceId } = useSpace();

// Get specific parts of space data
const spaceData = useSpaceData();
const pages = useSpacePages();
const participants = useSpaceParticipants();
const space = useCurrentSpace();
```

### Features

- **Automatic URL-based loading**: Context automatically loads space data when the URL changes to `/space/:id`
- **Real-time updates**: Subscribes to Supabase real-time changes for pages and participants
- **Loading and error states**: Provides loading and error states for UI handling
- **Refetch capability**: Manual refetch function for force-updating data

### Real-time Features

The context automatically subscribes to:

- Changes to pages in the current space
- Changes to participants in the current space

This ensures the UI stays in sync with database changes from other users.
