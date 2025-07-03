import { Button } from "./ui/button";
import { ThemeToggle } from "./ui/theme-toggle";
import { JoinSpaceModal } from "./ui/join-space-modal";
import { CreateSpaceModal } from "./ui/create-space-modal";

export default function Header() {
  return (
    <header className="flex items-center justify-between lg:w-full min-h-16 max-w-4xl lg:mx-auto mx-4 border-1 rounded-xl p-3 mt-2 sm:mt-4 bg-foreground text-accent">
      <h1 className="text-lg sm:text-2xl font-bold font-outfit truncate mr-3">
        WrkIn.Space
      </h1>
      <div className="flex items-center gap-2 sm:gap-3">
        <CreateSpaceModal>
          <Button size="sm" className="text-xs sm:text-sm px-2 sm:px-3">
            <span className="hidden sm:inline">Create Space</span>
            <span className="sm:hidden">Create</span>
          </Button>
        </CreateSpaceModal>
        <JoinSpaceModal>
          <Button size="sm" className="text-xs sm:text-sm px-2 sm:px-3">
            <span className="hidden sm:inline">Join Space</span>
            <span className="sm:hidden">Join</span>
          </Button>
        </JoinSpaceModal>
        <ThemeToggle />
      </div>
    </header>
  );
}
