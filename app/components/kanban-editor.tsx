import { useState, useEffect } from "react";
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
import { FixedToolbar } from "~/components/ui/fixed-toolbar";
import { ToolbarButton, ToolbarSeparator } from "~/components/ui/toolbar";
import { Plus, CreditCard, GripVertical } from "lucide-react";
import { cn } from "~/lib/utils";
import {
  loadKanbanData,
  createKanbanColumn,
  createKanbanCard,
  updateKanbanColumnOrder,
  updateKanbanCardsOrder,
  editKanbanCard,
  editKanbanColumn,
  deleteKanbanColumn,
  deleteKanbanCard,
} from "~/lib/space-utils";
import { Separator } from "./ui/separator";

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
  // State for kanban data
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [showAddColumnDialog, setShowAddColumnDialog] = useState(false);
  const [showAddCardDialog, setShowAddCardDialog] = useState(false);
  const [showEditCardDialog, setShowEditCardDialog] = useState(false);
  const [showEditColumnDialog, setShowEditColumnDialog] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState<string>("");

  // Form states
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [newCardTitle, setNewCardTitle] = useState("");
  const [newCardDescription, setNewCardDescription] = useState("");

  // Edit card states
  const [editingCard, setEditingCard] = useState<KanbanCard | null>(null);
  const [editCardTitle, setEditCardTitle] = useState("");
  const [editCardDescription, setEditCardDescription] = useState("");

  // Edit column states
  const [editingColumn, setEditingColumn] = useState<KanbanColumn | null>(null);
  const [editColumnTitle, setEditColumnTitle] = useState("");

  // Load kanban data when component mounts
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await loadKanbanData(pageId);
        if (result.error) {
          setError(result.error);
        } else {
          setColumns(result.columns);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load kanban data";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (pageId) {
      loadData();
    }
  }, [pageId]);

  const handleDragEnd = async (result: DropResult) => {
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

      // Update local state immediately for responsive UI
      setColumns(newColumns);

      // Update database
      try {
        const columnUpdates = newColumns.map((col, index) => ({
          id: col.id,
          order: index + 1,
        }));

        const result = await updateKanbanColumnOrder(columnUpdates);
        if (result.error) {
          console.error("Failed to update column order:", result.error);
          // Optionally revert the local state or show an error message
        }
      } catch (err) {
        console.error("Exception updating column order:", err);
      }

      return;
    }

    // Handle card reordering
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

      // Update local state immediately
      setColumns(newColumns);

      // Update database
      try {
        const cardUpdates = newCards.map((card, index) => ({
          id: card.id,
          columnId: sourceColumn.id,
          order: index + 1,
        }));

        const result = await updateKanbanCardsOrder(cardUpdates);
        if (result.error) {
          console.error("Failed to update card order:", result.error);
        }
      } catch (err) {
        console.error("Exception updating card order:", err);
      }
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

      // Update local state immediately
      setColumns(newColumns);

      // Update database - need to update cards in both columns
      try {
        const allCardUpdates = [
          ...sourceCards.map((card, index) => ({
            id: card.id,
            columnId: sourceColumn.id,
            order: index + 1,
          })),
          ...destCards.map((card, index) => ({
            id: card.id,
            columnId: destColumn.id,
            order: index + 1,
          })),
        ];

        const result = await updateKanbanCardsOrder(allCardUpdates);
        if (result.error) {
          console.error("Failed to update card order:", result.error);
        }
      } catch (err) {
        console.error("Exception updating card order:", err);
      }
    }
  };

  const handleAddColumn = async () => {
    if (!newColumnTitle.trim()) return;

    try {
      const result = await createKanbanColumn(pageId, newColumnTitle.trim());
      if (result.error || !result.column) {
        setError(result.error || "Failed to create column");
        return;
      }

      // Add to local state
      const newColumn: KanbanColumn = {
        id: result.column.id,
        title: result.column.title,
        cards: [],
      };

      setColumns([...columns, newColumn]);
      setNewColumnTitle("");
      setShowAddColumnDialog(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create column";
      setError(errorMessage);
    }
  };

  const handleAddCard = async () => {
    if (!newCardTitle.trim() || !selectedColumnId) return;

    try {
      const result = await createKanbanCard(
        selectedColumnId,
        newCardTitle.trim(),
        newCardDescription.trim() || undefined
      );

      if (result.error || !result.card) {
        setError(result.error || "Failed to create card");
        return;
      }

      // Parse the card content to get title and description
      let cardTitle = newCardTitle.trim();
      let cardDescription: string | undefined =
        newCardDescription.trim() || undefined;

      try {
        if (typeof result.card.content === "string") {
          const parsed = JSON.parse(result.card.content);
          cardTitle = parsed.title || cardTitle;
          cardDescription = parsed.description || cardDescription;
        } else if (
          typeof result.card.content === "object" &&
          result.card.content !== null
        ) {
          const content = result.card.content as any;
          cardTitle = content.title || cardTitle;
          cardDescription = content.description || cardDescription;
        }
      } catch (err) {
        console.warn(
          "Failed to parse created card content:",
          result.card.content
        );
      }

      const newCard: KanbanCard = {
        id: result.card.id,
        title: cardTitle,
        description: cardDescription,
      };

      // Add to local state
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
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create card";
      setError(errorMessage);
    }
  };

  const handleAddCardToColumn = (columnId: string) => {
    setSelectedColumnId(columnId);
    setShowAddCardDialog(true);
  };

  const handleEditCard = (card: KanbanCard) => {
    setEditingCard(card);
    setEditCardTitle(card.title);
    setEditCardDescription(card.description || "");
    setShowEditCardDialog(true);
  };

  const handleSaveEditCard = async () => {
    if (!editingCard || !editCardTitle.trim()) return;

    try {
      const result = await editKanbanCard(
        editingCard.id,
        editCardTitle.trim(),
        editCardDescription.trim() || undefined
      );

      if (result.error || !result.card) {
        setError(result.error || "Failed to update card");
        return;
      }

      // Parse the updated card content
      let updatedTitle = editCardTitle.trim();
      let updatedDescription: string | undefined =
        editCardDescription.trim() || undefined;

      try {
        if (typeof result.card.content === "string") {
          const parsed = JSON.parse(result.card.content);
          updatedTitle = parsed.title || updatedTitle;
          updatedDescription = parsed.description || updatedDescription;
        } else if (
          typeof result.card.content === "object" &&
          result.card.content !== null
        ) {
          const content = result.card.content as any;
          updatedTitle = content.title || updatedTitle;
          updatedDescription = content.description || updatedDescription;
        }
      } catch (err) {
        console.warn(
          "Failed to parse updated card content:",
          result.card.content
        );
      }

      // Update local state
      setColumns(
        columns.map((col) => ({
          ...col,
          cards: col.cards.map((card) =>
            card.id === editingCard.id
              ? {
                  ...card,
                  title: updatedTitle,
                  description: updatedDescription,
                }
              : card
          ),
        }))
      );

      // Reset edit state
      setEditingCard(null);
      setEditCardTitle("");
      setEditCardDescription("");
      setShowEditCardDialog(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update card";
      setError(errorMessage);
    }
  };

  const handleDeleteCard = async () => {
    if (!editingCard) return;

    if (
      !confirm(
        `Are you sure you want to delete "${editingCard.title}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const result = await deleteKanbanCard(editingCard.id);

      if (result.error) {
        setError(result.error);
        return;
      }

      // Remove card from local state
      setColumns(
        columns.map((col) => ({
          ...col,
          cards: col.cards.filter((card) => card.id !== editingCard.id),
        }))
      );

      // Reset edit state
      setEditingCard(null);
      setEditCardTitle("");
      setEditCardDescription("");
      setShowEditCardDialog(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete card";
      setError(errorMessage);
    }
  };

  const handleEditColumn = (column: KanbanColumn) => {
    setEditingColumn(column);
    setEditColumnTitle(column.title);
    setShowEditColumnDialog(true);
  };

  const handleSaveEditColumn = async () => {
    if (!editingColumn || !editColumnTitle.trim()) return;

    try {
      const result = await editKanbanColumn(
        editingColumn.id,
        editColumnTitle.trim()
      );

      if (result.error || !result.column) {
        setError(result.error || "Failed to update column");
        return;
      }

      // Update local state
      setColumns(
        columns.map((col) =>
          col.id === editingColumn.id
            ? { ...col, title: result.column!.title }
            : col
        )
      );

      // Reset edit state
      setEditingColumn(null);
      setEditColumnTitle("");
      setShowEditColumnDialog(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update column";
      setError(errorMessage);
    }
  };

  const handleDeleteColumn = async () => {
    if (!editingColumn) return;

    const confirmMessage =
      editingColumn.cards.length > 0
        ? `Are you sure you want to delete "${editingColumn.title}"? This will also delete all ${editingColumn.cards.length} card(s) in this column. This action cannot be undone.`
        : `Are you sure you want to delete "${editingColumn.title}"? This action cannot be undone.`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const result = await deleteKanbanColumn(editingColumn.id);

      if (result.error) {
        setError(result.error);
        return;
      }

      // Remove column from local state
      setColumns(columns.filter((col) => col.id !== editingColumn.id));

      // Reset edit state
      setEditingColumn(null);
      setEditColumnTitle("");
      setShowEditColumnDialog(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete column";
      setError(errorMessage);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading kanban board...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-semibold mb-2">Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button
            onClick={() => {
              setError(null);
              setIsLoading(true);
              // Reload data
              loadKanbanData(pageId).then((result) => {
                if (result.error) {
                  setError(result.error);
                } else {
                  setColumns(result.columns);
                }
                setIsLoading(false);
              });
            }}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="w-full h-full flex flex-col bg-background ">
        {/* Fixed Toolbar Section */}
        <div className="flex flex-row justify-center py-4 bg-background gap-4">
          <Button onClick={() => setShowAddColumnDialog(true)}>
            <Plus />
            Add Column
          </Button>
          <Button onClick={() => setShowAddCardDialog(true)}>
            <Plus />
            Add Card
          </Button>
        </div>

        {/* Kanban Board - Horizontally Scrollable */}
        <div className="flex flex-row overflow-x-scroll h-full">
          {columns.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">No columns yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first column to get started
                </p>
                <Button onClick={() => setShowAddColumnDialog(true)}>
                  <svg
                    className="size-4 mr-2"
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
              </div>
            </div>
          ) : (
            <Droppable
              droppableId="all-columns"
              direction="horizontal"
              type="column"
            >
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex gap-6 h-full px-6 pb-6"
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
                            className={cn(
                              "p-4 border-b border-border hover:bg-muted/50 transition-colors rounded-t-lg",
                              snapshot.isDragging && "cursor-grabbing"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 w-full">
                                <div
                                  {...provided.dragHandleProps}
                                  className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted/50 transition-colors"
                                  title="Drag to reorder column"
                                >
                                  <GripVertical className="size-4 text-muted-foreground" />
                                </div>
                                <div
                                  className="flex flex-row w-full cursor-pointer text-card-foreground hover:text-ring transition-colors"
                                  onClick={() => handleEditColumn(column)}
                                >
                                  <h3
                                    className="font-semibold "
                                    title="Click to edit column name"
                                  >
                                    {column.title}
                                  </h3>
                                </div>
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
                                          "hover:shadow-sm transition-shadow cursor-pointer",
                                          "group hover:border-ring/50",
                                          snapshot.isDragging &&
                                            "shadow-lg rotate-2 cursor-grabbing"
                                        )}
                                        onClick={(e) => {
                                          // Only handle click if not dragging
                                          if (!snapshot.isDragging) {
                                            e.stopPropagation();
                                            handleEditCard(card);
                                          }
                                        }}
                                        title="Click to edit"
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
                                  onClick={() =>
                                    handleAddCardToColumn(column.id)
                                  }
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
          )}
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

        {/* Edit Card Dialog */}
        <Dialog open={showEditCardDialog} onOpenChange={setShowEditCardDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Card</DialogTitle>
              <DialogDescription>
                Update the card title and description.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="edit-card-title"
                  className="text-sm font-medium"
                >
                  Card Title <span className="text-red-500">*</span>
                </label>
                <Input
                  id="edit-card-title"
                  type="text"
                  placeholder="Enter card title..."
                  value={editCardTitle}
                  onChange={(e) => setEditCardTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.metaKey) {
                      e.preventDefault();
                      handleSaveEditCard();
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="edit-card-description"
                  className="text-sm font-medium"
                >
                  Description (Optional)
                </label>
                <textarea
                  id="edit-card-description"
                  placeholder="Enter card description..."
                  value={editCardDescription}
                  onChange={(e) => setEditCardDescription(e.target.value)}
                  rows={3}
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.metaKey) {
                      e.preventDefault();
                      handleSaveEditCard();
                    }
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Press Cmd+Enter to save quickly
              </p>
            </div>
            <DialogFooter className="flex justify-between">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteCard}
                className="mr-auto"
              >
                Delete Card
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditCardDialog(false);
                    setEditingCard(null);
                    setEditCardTitle("");
                    setEditCardDescription("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveEditCard}
                  disabled={!editCardTitle.trim()}
                >
                  Save Changes
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Column Dialog */}
        <Dialog
          open={showEditColumnDialog}
          onOpenChange={setShowEditColumnDialog}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Column</DialogTitle>
              <DialogDescription>Update the column title.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="edit-column-title"
                  className="text-sm font-medium"
                >
                  Column Title <span className="text-red-500">*</span>
                </label>
                <Input
                  id="edit-column-title"
                  type="text"
                  placeholder="Enter column title..."
                  value={editColumnTitle}
                  onChange={(e) => setEditColumnTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSaveEditColumn();
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter className="flex justify-between">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteColumn}
                className="mr-auto"
              >
                Delete Column
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditColumnDialog(false);
                    setEditingColumn(null);
                    setEditColumnTitle("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveEditColumn}
                  disabled={!editColumnTitle.trim()}
                >
                  Save Changes
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DragDropContext>
  );
}
