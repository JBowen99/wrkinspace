import { useCurrentSpace, useSpacePages } from "~/contexts/space-context";
import { Button } from "~/components/ui/button";

export default function SpaceIndex() {
  const space = useCurrentSpace();
  const pages = useSpacePages();

  return (
    <div className="flex flex-col items-center justify-center h-full p-6">
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-bold mb-4">Welcome to your workspace</h1>

        {space && (
          <p className="text-muted-foreground mb-6">
            You're now in space{" "}
            <code className="bg-muted px-2 py-1 rounded text-sm">
              {space.id}
            </code>
          </p>
        )}

        {pages.length === 0 ? (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              This space is empty. Create your first page to get started.
            </p>
            <div className="flex flex-col gap-2">
              <Button className="w-full">Create Document</Button>
              <Button variant="outline" className="w-full">
                Create Moodboard
              </Button>
              <Button variant="outline" className="w-full">
                Create Kanban Board
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Select a page from the sidebar to continue working, or create a
              new one.
            </p>
            <Button>Create New Page</Button>
          </div>
        )}
      </div>
    </div>
  );
}
