import { Outlet } from "react-router";
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
  useSpace,
  useSpacePages,
  useCurrentSpace,
} from "~/contexts/space-context";
import type { Route } from "./+types/space.$id";

export default function SpaceLayout({ loaderData }: Route.ComponentProps) {
  const { loading, error, currentSpaceId } = useSpace();
  const pages = useSpacePages();
  const space = useCurrentSpace();

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar>
          <SidebarHeader>
            <h1>WrkInSpace</h1>
          </SidebarHeader>
          <SidebarContent>
            <div className="p-4">Loading space...</div>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </SidebarInset>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen">
        <Sidebar>
          <SidebarHeader>
            <h1>WrkInSpace</h1>
          </SidebarHeader>
          <SidebarContent>
            <div className="p-4 text-red-500">Error: {error}</div>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <div className="flex items-center justify-center h-full">
            <div className="text-red-500">Failed to load space</div>
          </div>
        </SidebarInset>
      </div>
    );
  }

  if (!space) {
    return (
      <div className="flex h-screen">
        <Sidebar>
          <SidebarHeader>
            <h1>WrkInSpace</h1>
          </SidebarHeader>
          <SidebarContent>
            <div className="p-4">Space not found</div>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground">Space not found</div>
          </div>
        </SidebarInset>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar>
        <SidebarHeader>
          <h1>WrkInSpace</h1>
          <p className="text-sm text-muted-foreground">
            Space: {currentSpaceId}
          </p>
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
                    <a href={`/space/${currentSpaceId}/page/${page.id}`}>
                      <span className="capitalize">{page.type}</span>:{" "}
                      {page.title}
                    </a>
                  </Button>
                ))
              )}
              <Button variant="outline" className="w-full">
                + New Page
              </Button>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <p className="text-xs text-muted-foreground">Space ID: {space.id}</p>
        </SidebarFooter>
      </Sidebar>
      <div className="flex-1">
        <SidebarInset>
          <div className="flex flex-col h-full w-full">
            {/* This will render the nested routes like page.$id */}
            <Outlet />
          </div>
        </SidebarInset>
      </div>
    </div>
  );
}
