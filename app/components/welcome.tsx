import { Button } from "./ui/button";
import { JoinSpaceModal } from "./ui/join-space-modal";
import { CreateSpaceModal } from "./ui/create-space-modal";

export default function Welcome() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-4">
      <h1 className="text-4xl font-bold">Welcome to WrkInSpace</h1>
      <p className="text-lg text-muted-foreground">
        Start collaborating instantly. No login required. Share your workspace
        with a QR code.
      </p>

      <div className="flex items-center justify-center mt-2 gap-4">
        <CreateSpaceModal>
          <Button>Create Space</Button>
        </CreateSpaceModal>
        <JoinSpaceModal>
          <Button variant="outline">Join Space</Button>
        </JoinSpaceModal>
      </div>
    </div>
  );
}
