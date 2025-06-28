import { Button } from "./ui/button";
import { ThemeToggle } from "./ui/theme-toggle";
import { useSpaceActions } from "~/hooks/use-space-actions";

export default function Header() {
  const { isCreating, handleCreateSpace, handleJoinSpace } = useSpaceActions();

  return (
    <header className="flex items-center justify-between w-full h-16 max-w-5xl mx-auto border-1 rounded-xl p-3 mt-2 bg-foreground text-accent">
      <h1 className="text-2xl font-bold">WrkInSpace</h1>
      <div className="flex items-center gap-3">
        <Button
          onClick={() => handleCreateSpace()}
          disabled={isCreating}
          size="sm"
        >
          {isCreating ? "Creating..." : "Create Space"}
        </Button>
        <Button variant="outline" onClick={() => handleJoinSpace()} size="sm">
          Join Space
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}
