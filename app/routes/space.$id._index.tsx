import { Columns3, FileText, Image } from "lucide-react";
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
        <div className="w-full flex justify-center">
          <img
            src="/wrk-icon-black.svg"
            alt="Logo"
            className="w-16 h-16 dark:hidden"
          />
          <img
            src="/wrk-icon-white.svg"
            alt="Logo" className="w-16 h-16 hidden dark:block" />
        </div>
        <h1 className="text-4xl font-bold mb-4">
          {space.title || "Untitled Space"}
        </h1>
        
        <p className="text-sm text-muted-foreground mb-8">
          Welcome to your collaborative workspace!
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col lg:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="flex items-center gap-2"
            onClick={() => handleCreatePage("document")}
          >
            <FileText />
            Add Document
          </Button>
          <Button
            size="lg"
            className="flex items-center gap-2"
            onClick={() => handleCreatePage("moodboard")}
          >
            <Image />
            Add Mood Board
          </Button>
          <Button
            size="lg"
            className="flex items-center gap-2"
            onClick={() => handleCreatePage("kanban")}
          >
            <Columns3 /> Add Planning Board
          </Button>
        </div>
      </div>
    </div>
  );
}
