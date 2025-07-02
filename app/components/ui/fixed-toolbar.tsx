"use client";

import { cn } from "~/lib/utils";

import { Toolbar } from "./toolbar";

export function FixedToolbar(props: React.ComponentProps<typeof Toolbar>) {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
      <div className="rounded-lg shadow-lg border bg-sidebar p-2">
        <Toolbar {...props} className={cn("gap-1", props.className)} />
      </div>
    </div>
  );
}
