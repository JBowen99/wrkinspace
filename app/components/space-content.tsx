import { useSpace } from "~/contexts/space-context";
import { SpacePasswordScreen } from "./space-password-screen";
import { SpaceLayout } from "./space-layout";

export default function SpaceContent() {
  const {
    space,
    isLoading,
    error,
    requiresPassword,
    isAuthenticated,
    authenticateSpace,
  } = useSpace();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading space...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
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
      <div className="flex items-center justify-center h-screen">
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
  const spaceContent = (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">🚀</div>
        <h1 className="text-4xl font-bold mb-4">
          {space.title || "Untitled Space"}
        </h1>
        <p className="text-muted-foreground mb-4">
          Space ID:{" "}
          <code className="bg-gray-100 px-2 py-1 rounded">{space.id}</code>
        </p>
        {requiresPassword && (
          <div className="flex items-center justify-center gap-2 text-green-600 mb-4">
            <span className="text-xl">✅</span>
            <span className="font-medium">Authenticated</span>
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          Welcome to your collaborative workspace!
        </p>
      </div>
    </div>
  );

  return (
    <SpaceLayout
      space={space}
      pages={[]}
      isPasswordProtected={requiresPassword}
    >
      {spaceContent}
    </SpaceLayout>
  );
}
