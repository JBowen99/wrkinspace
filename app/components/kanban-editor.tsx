import { useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
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

interface KanbanEditorProps {
  pageId: string;
}

export default function KanbanEditor({ pageId }: KanbanEditorProps) {
  // Sample data for the prototype - now using state
  const [columns, setColumns] = useState<KanbanColumn[]>([
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
  ]);

  // Dialog states
  const [showAddColumnDialog, setShowAddColumnDialog] = useState(false);
  const [showAddCardDialog, setShowAddCardDialog] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState<string>("");

  // Form states
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [newCardTitle, setNewCardTitle] = useState("");
  const [newCardDescription, setNewCardDescription] = useState("");

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId, type } = result;

    // If dropped outside of any droppable area
    if (!destination) {
      return;
    }

    // If dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Handle column reordering
    if (type === "column") {
      const newColumns = Array.from(columns);
      const [removed] = newColumns.splice(source.index, 1);
      newColumns.splice(destination.index, 0, removed);
      setColumns(newColumns);
      return;
    }

    // Handle card reordering (existing logic)
    const sourceColumn = columns.find((col) => col.id === source.droppableId);
    const destColumn = columns.find(
      (col) => col.id === destination.droppableId
    );

    if (!sourceColumn || !destColumn) {
      return;
    }

    // Moving within the same column
    if (sourceColumn === destColumn) {
      const newCards = Array.from(sourceColumn.cards);
      const [removed] = newCards.splice(source.index, 1);
      newCards.splice(destination.index, 0, removed);

      const newColumns = columns.map((col) =>
        col.id === sourceColumn.id ? { ...col, cards: newCards } : col
      );

      setColumns(newColumns);
    } else {
      // Moving between different columns
      const sourceCards = Array.from(sourceColumn.cards);
      const destCards = Array.from(destColumn.cards);
      const [removed] = sourceCards.splice(source.index, 1);
      destCards.splice(destination.index, 0, removed);

      const newColumns = columns.map((col) => {
        if (col.id === sourceColumn.id) {
          return { ...col, cards: sourceCards };
        } else if (col.id === destColumn.id) {
          return { ...col, cards: destCards };
        }
        return col;
      });

      setColumns(newColumns);
    }
  };

  const handleAddColumn = () => {
    if (!newColumnTitle.trim()) return;

    const newColumn: KanbanColumn = {
      id: `column-${Date.now()}`,
      title: newColumnTitle,
      cards: [],
    };

    setColumns([...columns, newColumn]);
    setNewColumnTitle("");
    setShowAddColumnDialog(false);
  };

  const handleAddCard = () => {
    if (!newCardTitle.trim() || !selectedColumnId) return;

    const newCard: KanbanCard = {
      id: `card-${Date.now()}`,
      title: newCardTitle,
      description: newCardDescription.trim() || undefined,
    };

    setColumns(
      columns.map((col) =>
        col.id === selectedColumnId
          ? { ...col, cards: [...col.cards, newCard] }
          : col
      )
    );

    setNewCardTitle("");
    setNewCardDescription("");
    setSelectedColumnId("");
    setShowAddCardDialog(false);
  };

  const handleAddCardToColumn = (columnId: string) => {
    setSelectedColumnId(columnId);
    setShowAddCardDialog(true);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="w-full h-full flex flex-col bg-background">
        {/* Centered Toolbar */}
        <div className="w-full flex justify-center items-center p-4 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddColumnDialog(true)}
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
              Add Column
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddCardDialog(true)}
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
          <Droppable
            droppableId="all-columns"
            direction="horizontal"
            type="column"
          >
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex gap-6 h-full p-6"
                style={{ minWidth: "max-content" }}
              >
                {columns.map((column, index) => (
                  <Draggable
                    key={column.id}
                    draggableId={column.id}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={cn(
                          "flex flex-col w-80 bg-card rounded-lg border border-border shadow-sm",
                          snapshot.isDragging && "shadow-lg rotate-1"
                        )}
                      >
                        {/* Column Header */}
                        <div
                          {...provided.dragHandleProps}
                          className={cn(
                            "p-4 border-b border-border cursor-grab active:cursor-grabbing",
                            "hover:bg-muted/50 transition-colors rounded-t-lg",
                            snapshot.isDragging && "cursor-grabbing"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <svg
                                className="size-4 text-muted-foreground"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 6h16M4 12h16M4 18h16"
                                />
                              </svg>
                              <h3 className="font-semibold text-card-foreground">
                                {column.title}
                              </h3>
                            </div>
                            <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-1">
                              {column.cards.length}
                            </span>
                          </div>
                        </div>

                        {/* Cards Container */}
                        <Droppable droppableId={column.id} type="card">
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={cn(
                                "flex-1 p-4 space-y-3 overflow-y-auto min-h-[200px]",
                                snapshot.isDraggingOver && "bg-muted/50"
                              )}
                            >
                              {column.cards.map((card, index) => (
                                <Draggable
                                  key={card.id}
                                  draggableId={card.id}
                                  index={index}
                                >
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className={cn(
                                        "p-3 bg-background rounded-md border border-border shadow-xs",
                                        "hover:shadow-sm transition-shadow cursor-grab",
                                        "group hover:border-ring/50",
                                        snapshot.isDragging &&
                                          "shadow-lg rotate-2 cursor-grabbing"
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
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}

                              {/* Add Card Button */}
                              <button
                                onClick={() => handleAddCardToColumn(column.id)}
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
                          )}
                        </Droppable>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>

        {/* Add Column Dialog */}
        <Dialog
          open={showAddColumnDialog}
          onOpenChange={setShowAddColumnDialog}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Column</DialogTitle>
              <DialogDescription>
                Create a new column to organize your tasks.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="column-title" className="text-sm font-medium">
                  Column Title <span className="text-red-500">*</span>
                </label>
                <Input
                  id="column-title"
                  type="text"
                  placeholder="Enter column title..."
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddColumn();
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddColumnDialog(false);
                  setNewColumnTitle("");
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleAddColumn}
                disabled={!newColumnTitle.trim()}
              >
                Add Column
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Card Dialog */}
        <Dialog open={showAddCardDialog} onOpenChange={setShowAddCardDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Card</DialogTitle>
              <DialogDescription>
                Create a new card and assign it to a column.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="card-column" className="text-sm font-medium">
                  Column <span className="text-red-500">*</span>
                </label>
                <select
                  id="card-column"
                  value={selectedColumnId}
                  onChange={(e) => setSelectedColumnId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select a column...</option>
                  {columns.map((column) => (
                    <option key={column.id} value={column.id}>
                      {column.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="card-title" className="text-sm font-medium">
                  Card Title <span className="text-red-500">*</span>
                </label>
                <Input
                  id="card-title"
                  type="text"
                  placeholder="Enter card title..."
                  value={newCardTitle}
                  onChange={(e) => setNewCardTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="card-description"
                  className="text-sm font-medium"
                >
                  Description (Optional)
                </label>
                <textarea
                  id="card-description"
                  placeholder="Enter card description..."
                  value={newCardDescription}
                  onChange={(e) => setNewCardDescription(e.target.value)}
                  rows={3}
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddCardDialog(false);
                  setNewCardTitle("");
                  setNewCardDescription("");
                  setSelectedColumnId("");
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleAddCard}
                disabled={!newCardTitle.trim() || !selectedColumnId}
              >
                Add Card
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DragDropContext>
  );
}
