import { Button } from "./ui/button";
import { ThemeToggle } from "./ui/theme-toggle";
import { JoinSpaceModal } from "./ui/join-space-modal";
import { CreateSpaceModal } from "./ui/create-space-modal";

export default function Header() {
  return (
    <header className="flex items-center justify-between w-full h-16 max-w-5xl mx-auto border-1 rounded-xl p-3 mt-2 bg-foreground text-accent">
      <h1 className="text-2xl font-bold font-outfit">WrkInSpace</h1>
      <div className="flex items-center gap-3">
        <CreateSpaceModal>
          <Button size="sm">Create Space</Button>
        </CreateSpaceModal>
        <JoinSpaceModal>
          <Button size="sm">Join Space</Button>
        </JoinSpaceModal>
        <ThemeToggle />
      </div>
    </header>
  );
}
