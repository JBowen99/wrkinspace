import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

interface KanbanCard {
  id: string;
  title: string;
  description?: string;
}

interface KanbanColumn {
  id: string;
  title: string;
  cards: KanbanCard[];
}

export default function KanbanEditor() {
  // Sample data for the prototype
  const columns: KanbanColumn[] = [
    {
      id: "todo",
      title: "To Do",
      cards: [
        {
          id: "1",
          title: "Design homepage mockup",
          description: "Create wireframes and visual design",
        },
        {
          id: "2",
          title: "Set up project repository",
          description: "Initialize Git repo and basic structure",
        },
        { id: "3", title: "Research user requirements" },
      ],
    },
    {
      id: "in-progress",
      title: "In Progress",
      cards: [
        {
          id: "4",
          title: "Implement user authentication",
          description: "Add login and signup functionality",
        },
        { id: "5", title: "Create database schema" },
      ],
    },
    {
      id: "done",
      title: "Done",
      cards: [
        {
          id: "6",
          title: "Project planning",
          description: "Define scope and timeline",
        },
        {
          id: "7",
          title: "Team onboarding",
          description: "Set up development environment",
        },
      ],
    },
  ];

  return (
    <div className="w-full h-full flex flex-col bg-background">
      {/* Centered Toolbar */}
      <div className="w-full flex justify-center items-center p-4 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <svg
              className="size-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Add Column
          </Button>
          <Button variant="outline" size="sm">
            <svg
              className="size-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Add Card
          </Button>
          <div className="w-px h-6 bg-border mx-2" />
          <Button variant="ghost" size="sm">
            <svg
              className="size-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Settings
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 w-full overflow-x-auto overflow-y-hidden">
        <div
          className="flex gap-6 h-full p-6"
          style={{ minWidth: "max-content" }}
        >
          {columns.map((column) => (
            <div
              key={column.id}
              className="flex flex-col w-80 bg-card rounded-lg border border-border shadow-sm"
            >
              {/* Column Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-card-foreground">
                    {column.title}
                  </h3>
                  <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-1">
                    {column.cards.length}
                  </span>
                </div>
              </div>

              {/* Cards Container */}
              <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                {column.cards.map((card) => (
                  <div
                    key={card.id}
                    className={cn(
                      "p-3 bg-background rounded-md border border-border shadow-xs",
                      "hover:shadow-sm transition-shadow cursor-pointer",
                      "group hover:border-ring/50"
                    )}
                  >
                    <h4 className="font-medium text-sm text-foreground mb-1 group-hover:text-ring transition-colors">
                      {card.title}
                    </h4>
                    {card.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {card.description}
                      </p>
                    )}
                  </div>
                ))}

                {/* Add Card Button */}
                <button
                  className={cn(
                    "w-full p-3 border-2 border-dashed border-border rounded-md",
                    "text-muted-foreground hover:text-foreground hover:border-ring/50",
                    "transition-colors text-sm font-medium",
                    "flex items-center justify-center gap-2"
                  )}
                >
                  <svg
                    className="size-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Add a card
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
