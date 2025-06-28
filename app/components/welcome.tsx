import { Button } from "./ui/button";
import { useSpaceActions } from "~/hooks/use-space-actions";

export default function Welcome() {
  const { isCreating, handleCreateSpace, handleJoinSpace } = useSpaceActions();

  const onCreateClick = () => {
    console.log("Create Space button clicked!");
    handleCreateSpace();
  };

  const onJoinClick = () => {
    console.log("Join Space button clicked!");
    handleJoinSpace();
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-4">
      <h1 className="text-4xl font-bold">Welcome to WrkInSpace</h1>
      <p className="text-lg text-muted-foreground">
        Start collaborating instantly. No login required. Share your workspace
        with a QR code.
      </p>

      <div className="flex items-center justify-center mt-2 gap-4">
        <Button onClick={onCreateClick} disabled={isCreating}>
          {isCreating ? "Creating..." : "Create Space"}
        </Button>
        <Button variant="outline" onClick={onJoinClick}>
          Join Space
        </Button>
      </div>
    </div>
  );
}
