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
import type { Route } from "./+types/space";
import DocumentEditor from "~/components/document-editor";
import { Button } from "~/components/ui/button";

export default function Space({ loaderData }: Route.ComponentProps) {
  return (
    <div className="flex h-screen">
      <Sidebar className="">
        <SidebarHeader>
          <a href="/">
            <div className="flex items-center gap-2">
              <img
                src="/wrkinspace-logo.svg"
                alt="WrkInSpace Logo"
                className="w-10"
              />
              <h1 className="text-2xl font-bold">Work Space</h1>
            </div>
          </a>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Documents</SidebarGroupLabel>
            <SidebarGroupContent>
              <Button variant="outline">New Document</Button>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter />
      </Sidebar>
      <div className="flex-1">
        <SidebarInset>
          <div className="flex flex-col h-full w-ful justify-center items-center mx-auto min-w-xl">
            <DocumentEditor />
          </div>
        </SidebarInset>
      </div>
    </div>
  );
}
