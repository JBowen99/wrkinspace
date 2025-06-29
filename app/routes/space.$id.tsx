import { Outlet, useParams, Link, useLocation } from "react-router";
import React, { useState } from "react";
import { SpaceProvider } from "~/contexts/space-context";
import { SpacePasswordScreen } from "~/components/space-password-screen";
import { Button } from "~/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
} from "~/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "~/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
  ContextMenuItem,
} from "~/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import {
  QrCode,
  Plus,
  FileText,
  Image,
  Kanban,
  Edit,
  Trash,
} from "lucide-react";
import { ShareSpaceModal } from "~/components/ui/share-space-modal";
import { useSpaceActions } from "~/hooks/use-space-actions";

export default function SpaceRoute() {
  const params = useParams();
  const spaceId = params.id;
  const { handleCreatePage, handleRenamePage, handleDeletePage } =
    useSpaceActions();
  const location = useLocation();

  // State for rename dialog
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [pageToRename, setPageToRename] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [newPageTitle, setNewPageTitle] = useState("");

  const handleRenameStart = (page: { id: string; title: string }) => {
    setPageToRename(page);
    setNewPageTitle(page.title);
    setRenameDialogOpen(true);
  };

  const handleRenameSubmit = async () => {
    if (!pageToRename) return;

    const success = await handleRenamePage(pageToRename.id, newPageTitle);
    if (success) {
      setRenameDialogOpen(false);
      setPageToRename(null);
      setNewPageTitle("");
    }
  };

  const handleDeleteClick = async (pageId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this page? This action cannot be undone."
      )
    ) {
      await handleDeletePage(pageId);
    }
  };

  if (!spaceId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-semibold mb-2">Invalid Space</h2>
          <p className="text-muted-foreground">No space ID provided.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SpaceProvider initialSpaceId={spaceId}>
        {({
          space,
          isLoading,
          error,
          requiresPassword,
          isAuthenticated,
          authenticateSpace,
          pages,
        }) => {
          if (isLoading) {
            return (
              <div className="flex items-center justify-center h-screen w-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading space...</p>
                </div>
              </div>
            );
          }

          if (error) {
            return (
              <div className="flex items-center justify-center h-screen w-full">
                <div className="text-center">
                  <div className="text-6xl mb-4">❌</div>
                  <h2 className="text-2xl font-semibold mb-2">Error</h2>
                  <p className="text-muted-foreground">{error}</p>
                </div>
              </div>
            );
          }

          if (!space) {
            return (
              <div className="flex items-center justify-center h-screen w-full">
                <div className="text-center">
                  <div className="text-6xl mb-4">🔍</div>
                  <h2 className="text-2xl font-semibold mb-2">
                    Space Not Found
                  </h2>
                  <p className="text-muted-foreground">
                    The requested space could not be found.
                  </p>
                </div>
              </div>
            );
          }

          // Show password screen if space requires password and user is not authenticated
          if (requiresPassword && !isAuthenticated) {
            return (
              <div className="flex items-center justify-center h-screen w-full">
                <SpacePasswordScreen
                  spaceTitle={space.title || undefined}
                  spaceId={space.id}
                  onPasswordSubmit={authenticateSpace}
                  isLoading={isLoading}
                />
              </div>
            );
          }

          // Show space content if user is authenticated or no password required
          return (
            <div className="flex h-screen w-full">
              <Sidebar variant="sidebar">
                <SidebarHeader>
                  <div className="flex flex-row items-center justify-start gap-4">
                    <Link to="/">
                      <h1 className="text-2xl font-bold">WrkInSpace</h1>
                    </Link>
                    <ShareSpaceModal>
                      <Button variant="outline" size="icon" className="ml-auto">
                        <QrCode />
                      </Button>
                    </ShareSpaceModal>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Space: {space.title || "Untitled"}
                  </p>
                  {requiresPassword && (
                    <div className="flex items-center gap-1 text-xs text-amber-600">
                      <span>🔒</span>
                      <span>Password Protected</span>
                    </div>
                  )}
                </SidebarHeader>

                <SidebarContent>
                  <SidebarGroup>
                    <SidebarGroupLabel>Pages</SidebarGroupLabel>
                    <SidebarGroupContent className="space-y-2">
                      {pages.length === 0 ? (
                        <p className="text-sm text-muted-foreground p-2">
                          No pages yet
                        </p>
                      ) : (
                        pages.map((page) => {
                          const pagePath = `/space/${space.id}/page/${page.id}`;
                          const isActive = location.pathname === pagePath;

                          return (
                            <ContextMenu key={page.id}>
                              <ContextMenuTrigger>
                                <Button
                                  variant={isActive ? "secondary" : "ghost"}
                                  className="w-full justify-start"
                                  asChild
                                >
                                  <Link to={pagePath}>
                                    <span className="mr-2">
                                      {page.type === "document" && (
                                        <FileText className="h-4 w-4" />
                                      )}
                                      {page.type === "moodboard" && (
                                        <Image className="h-4 w-4" />
                                      )}
                                      {page.type === "kanban" && (
                                        <Kanban className="h-4 w-4" />
                                      )}
                                    </span>
                                    {page.title}
                                  </Link>
                                </Button>
                              </ContextMenuTrigger>
                              <ContextMenuContent>
                                <ContextMenuItem
                                  onClick={() => handleRenameStart(page)}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Rename
                                </ContextMenuItem>
                                <ContextMenuItem
                                  variant="destructive"
                                  onClick={() => handleDeleteClick(page.id)}
                                >
                                  <Trash className="h-4 w-4 mr-2" />
                                  Delete
                                </ContextMenuItem>
                              </ContextMenuContent>
                            </ContextMenu>
                          );
                        })
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full">
                            <Plus className="h-4 w-4 mr-2" />
                            New Page
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                          <DropdownMenuItem
                            onClick={() => handleCreatePage("document")}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Document
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleCreatePage("moodboard")}
                          >
                            <Image className="h-4 w-4 mr-2" />
                            Mood Board
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleCreatePage("kanban")}
                          >
                            <Kanban className="h-4 w-4 mr-2" />
                            Planning Board
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SidebarContent>

                <SidebarFooter>
                  <p className="text-xs text-muted-foreground">
                    Space ID: {space.id}
                  </p>
                </SidebarFooter>
              </Sidebar>

              <SidebarInset>
                <div className="flex flex-col h-screen w-full">
                  <Outlet />
                </div>
              </SidebarInset>
            </div>
          );
        }}
      </SpaceProvider>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Page</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={newPageTitle}
              onChange={(e) => setNewPageTitle(e.target.value)}
              placeholder="Enter new page title"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleRenameSubmit();
                }
              }}
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setRenameDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleRenameSubmit}>Rename</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
