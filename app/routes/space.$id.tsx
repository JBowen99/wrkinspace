import { Outlet, useParams } from "react-router";
import { SpaceProvider } from "~/contexts/space-context";
import { SpacePasswordScreen } from "~/components/space-password-screen";
import { SpaceLayout } from "~/components/space-layout";
import { Button } from "~/components/ui/button";

export default function SpaceRoute() {
  const params = useParams();
  const spaceId = params.id;

  if (!spaceId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-semibold mb-2">Invalid Space</h2>
          <p className="text-muted-foreground">No space ID provided.</p>
        </div>
      </div>
    );
  }

  return (
    <SpaceProvider initialSpaceId={spaceId}>
      {({
        space,
        isLoading,
        error,
        requiresPassword,
        isAuthenticated,
        authenticateSpace,
        pages,
      }) => {
        if (isLoading) {
          return (
            <div className="flex items-center justify-center h-screen w-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading space...</p>
              </div>
            </div>
          );
        }

        if (error) {
          return (
            <div className="flex items-center justify-center h-screen w-full">
              <div className="text-center">
                <div className="text-6xl mb-4">❌</div>
                <h2 className="text-2xl font-semibold mb-2">Error</h2>
                <p className="text-muted-foreground">{error}</p>
              </div>
            </div>
          );
        }

        if (!space) {
          return (
            <div className="flex items-center justify-center h-screen w-full">
              <div className="text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h2 className="text-2xl font-semibold mb-2">Space Not Found</h2>
                <p className="text-muted-foreground">
                  The requested space could not be found.
                </p>
              </div>
            </div>
          );
        }

        // Show password screen if space requires password and user is not authenticated
        if (requiresPassword && !isAuthenticated) {
          return (
            <div className="flex items-center justify-center h-screen w-full">
              <SpacePasswordScreen
                spaceTitle={space.title || undefined}
                spaceId={space.id}
                onPasswordSubmit={authenticateSpace}
                isLoading={isLoading}
              />
            </div>
          );
        }

        // Show space content if user is authenticated or no password required
        return (
          <SpaceLayout
            space={space}
            pages={pages}
            isPasswordProtected={requiresPassword}
          >
            <Outlet />
          </SpaceLayout>
        );
      }}
    </SpaceProvider>
  );
}
