import React from "react";
import { Outlet, Link } from "react-router";
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
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "~/components/ui/dropdown-menu";
import type { Tables } from "../../database.types";
import { QrCode, Plus, FileText, Image, Kanban } from "lucide-react";
import { ShareSpaceModal } from "~/components/ui/share-space-modal";
import { useSpaceActions } from "~/hooks/use-space-actions";

type Space = Tables<"spaces">;
type Page = Tables<"pages">;

interface SpaceLayoutProps {
  space: Space;
  pages: Page[];
  isPasswordProtected?: boolean;
  children?: React.ReactNode;
}

export function SpaceLayout({
  space,
  pages,
  isPasswordProtected = false,
  children,
}: SpaceLayoutProps) {
  const { handleCreatePage } = useSpaceActions();

  return (
    <div className="flex-col flex justify-center items-center h-full w-full ">
      <Sidebar>
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
          <p className="text-sm text-muted-foreground">Space: {space.id}</p>
          {isPasswordProtected && (
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
                pages.map((page) => (
                  <Button
                    key={page.id}
                    variant="ghost"
                    className="w-full justify-start"
                    asChild
                  >
                    <Link to={`/space/${space.id}/page/${page.id}`}>
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
                ))
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
                  <DropdownMenuItem onClick={() => handleCreatePage("kanban")}>
                    <Kanban className="h-4 w-4 mr-2" />
                    Planning Board
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <p className="text-xs text-muted-foreground">Space ID: {space.id}</p>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <div className="flex flex-col h-screen w-full">{children}</div>
      </SidebarInset>
    </div>
  );
}
