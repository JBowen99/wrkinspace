import { Button } from "~/components/ui/button";
import { useSpace } from "~/contexts/space-context";
import { useSpaceActions } from "~/hooks/use-space-actions";

export default function SpacePageHome() {
  const { space, requiresPassword } = useSpace();
  const { handleCreatePage } = useSpaceActions();

  if (!space) {
    return <div>No space found</div>;
  }

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">🚀</div>
        <h1 className="text-4xl font-bold mb-4">
          {space.title || "Untitled Space"}
        </h1>
        <p className="text-muted-foreground mb-4">
          Space ID:{" "}
          <code className="bg-gray-100 px-2 py-1 rounded">{space.id}</code>
        </p>
        {requiresPassword && (
          <div className="flex items-center justify-center gap-2 text-green-600 mb-4">
            <span className="text-xl">✅</span>
            <span className="font-medium">Authenticated</span>
          </div>
        )}
        <p className="text-sm text-muted-foreground mb-8">
          Welcome to your collaborative workspace!
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="flex items-center gap-2"
            onClick={() => handleCreatePage("document")}
          >
            📄 Add Document
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => handleCreatePage("moodboard")}
          >
            🎨 Add Mood Board
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => handleCreatePage("kanban")}
          >
            📝 Add Planning Board
          </Button>
        </div>
      </div>
    </div>
  );
}
