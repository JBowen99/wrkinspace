import { Button } from "./ui/button";
import { JoinSpaceModal } from "./ui/join-space-modal";
import { CreateSpaceModal } from "./ui/create-space-modal";
import { RecentSpaces } from "./ui/recent-spaces";

export default function Welcome() {
  return (
    <div className="flex flex-col items-center w-full h-full px-4 pb-8 sm:pb-24 flex-1">
      {/* Main welcome section */}
      <div className="flex flex-col items-center justify-center gap-3 sm:gap-4 mt-auto pt-12 md:pt-20">
        <img
          src="/wrk-icon-black.svg"
          alt="WrkIn.Space Icon"
          className="w-16 h-16 sm:w-24 sm:h-24 mb-2 sm:mb-4 dark:hidden"
        />
        <img
          src="/wrk-icon-white.svg"
          alt="WrkIn.Space Icon"
          className="w-16 h-16 sm:w-24 sm:h-24 mb-2 sm:mb-4 hidden dark:block"
        />

        <h1 className="text-2xl sm:text-4xl font-bold text-center">
          Welcome to WrkIn.Space
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground text-center max-w-md px-2">
          Start collaborating instantly.{" "}
          <span className="underline"> No login required.</span> Share your
          workspace with a QR code.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center mt-3 sm:mt-2 gap-3 sm:gap-4 w-full max-w-xs sm:max-w-none">
          <CreateSpaceModal>
            <Button className="w-full sm:w-auto min-h-11 sm:min-h-10">
              Create Space
            </Button>
          </CreateSpaceModal>
          <JoinSpaceModal>
            <Button variant="outline" className="w-full sm:w-auto min-h-11 sm:min-h-10">
              Join Space
            </Button>
          </JoinSpaceModal>
        </div>
      </div>

      {/* Recently visited spaces */}
      <div className="w-full max-w-4xl mt-auto pt-8 sm:pt-12">
        <RecentSpaces />
      </div>
    </div>
  );
}
