import { useParams } from "react-router";
import { useSpace } from "~/contexts/space-context";
import { FileText, Image, Kanban } from "lucide-react";
import DocumentEditor from "~/components/document-editor";
import MoodboardEditor from "~/components/moodboard-editor";
import KanbanEditor from "~/components/kanban-editor";

export default function SpacePage() {
  const params = useParams();
  const { space, pages } = useSpace();
  const pageId = params.pageId;

  // Find the current page from the pages in context
  const currentPage = pages.find((page) => page.id === pageId);

  if (!space) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-semibold mb-2">Space Not Found</h2>
          <p className="text-muted-foreground">Unable to load space.</p>
        </div>
      </div>
    );
  }

  if (!currentPage) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-6xl mb-4">📄</div>
          <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
          <p className="text-muted-foreground">
            The requested page could not be found or is still loading.
          </p>
        </div>
      </div>
    );
  }

  const getPageIcon = (type: string) => {
    switch (type) {
      case "document":
        return <FileText className="h-16 w-16 text-blue-500" />;
      case "moodboard":
        return <Image className="h-16 w-16 text-purple-500" />;
      case "kanban":
        return <Kanban className="h-16 w-16 text-green-500" />;
      default:
        return <FileText className="h-16 w-16 text-gray-500" />;
    }
  };

  const getPageTypeLabel = (type: string) => {
    switch (type) {
      case "document":
        return "Document";
      case "moodboard":
        return "Mood Board";
      case "kanban":
        return "Planning Board";
      default:
        return "Unknown Page Type";
    }
  };

  if (currentPage.type === "kanban") {
    return (
      <div className="flex flex-col items-start justify-center h-full w-full">
        <KanbanEditor />
      </div>
    );
  }

  if (currentPage.type === "moodboard") {
    return (
      <div className="flex flex-col items-start justify-center h-full w-full">
        <MoodboardEditor />
      </div>
    );
  }

  if (currentPage.type === "document") {
    return (
      <div className="flex flex-col items-start justify-center h-full w-full">
        <DocumentEditor />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-md">
        <div className="mb-6">{getPageIcon(currentPage.type)}</div>

        <h1 className="text-3xl font-bold mb-2">{currentPage.title}</h1>

        <div className="inline-block bg-gray-100 px-3 py-1 rounded-full text-sm font-medium text-gray-700 mb-4">
          {getPageTypeLabel(currentPage.type)}
        </div>

        <p className="text-muted-foreground mb-4">
          Page ID:{" "}
          <code className="bg-gray-100 px-2 py-1 rounded text-xs">
            {currentPage.id}
          </code>
        </p>

        <p className="text-sm text-muted-foreground mb-8">
          This page is ready for content! The{" "}
          {getPageTypeLabel(currentPage.type).toLowerCase()} editor will be
          implemented here.
        </p>

        {/* Placeholder for future page-specific content */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-gray-500">
          <p className="text-lg font-medium mb-2">Coming Soon</p>
          <p className="text-sm">
            {currentPage.type === "document" &&
              "Rich text editor with image support"}
            {currentPage.type === "moodboard" &&
              "Drag-and-drop canvas for images and text"}
            {currentPage.type === "kanban" &&
              "Kanban board with columns and cards"}
          </p>
        </div>
      </div>
    </div>
  );
}
