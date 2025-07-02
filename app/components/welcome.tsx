import { Button } from "./ui/button";
import { JoinSpaceModal } from "./ui/join-space-modal";
import { CreateSpaceModal } from "./ui/create-space-modal";
import { RecentSpaces } from "./ui/recent-spaces";

export default function Welcome() {
  return (
    <div className="flex flex-col items-center w-full h-full px-4 pb-24">
      {/* Main welcome section */}
      <div className="flex flex-col items-center justify-center gap-4 mt-auto">
        <img
          src="/wrk-icon-black.svg"
          alt="WrkIn.Space Icon"
          className="w-24 h-24 mb-4 dark:hidden"
        />
        <img
          src="/wrk-icon-white.svg"
          alt="WrkIn.Space Icon"
          className="w-24 h-24 mb-4 hidden dark:block"
        />

        <h1 className="text-4xl font-bold">Welcome to WrkIn.Space</h1>
        <p className="text-lg text-muted-foreground text-center">
          Start collaborating instantly.{" "}
          <span className="underline"> No login required.</span> Share your
          workspace with a QR code.
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

      {/* Recently visited spaces */}
      <div className="w-full max-w-4xl mt-auto">
        <RecentSpaces />
      </div>
    </div>
  );
}
