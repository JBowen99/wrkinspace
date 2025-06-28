import { useParams } from "react-router";
import { useSpacePages, useCurrentSpace } from "~/contexts/space-context";

export default function SpacePage() {
  const { id: pageId } = useParams();
  const pages = useSpacePages();
  const space = useCurrentSpace();

  const currentPage = pages.find((page) => page.id === pageId);

  if (!currentPage) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Page not found</h2>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist in this space.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{currentPage.title}</h1>
        <p className="text-sm text-muted-foreground capitalize">
          {currentPage.type} • Space: {space?.id}
        </p>
      </div>

      <div className="flex-1 border rounded-lg p-4 bg-muted/20">
        {currentPage.type === "document" && (
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <p className="text-muted-foreground">
              Document editor will be implemented here...
            </p>
          </div>
        )}

        {currentPage.type === "moodboard" && (
          <div className="w-full h-full bg-white dark:bg-gray-900 rounded border-2 border-dashed border-muted-foreground/20">
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">
                Moodboard canvas will be implemented here...
              </p>
            </div>
          </div>
        )}

        {currentPage.type === "kanban" && (
          <div className="w-full h-full">
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">
                Kanban board will be implemented here...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
