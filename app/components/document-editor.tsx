import type { Value } from "platejs";

import {
  BlockquotePlugin,
  BoldPlugin,
  H1Plugin,
  H2Plugin,
  H3Plugin,
  ItalicPlugin,
  UnderlinePlugin,
} from "@platejs/basic-nodes/react";

import { Plate, usePlateEditor } from "platejs/react";
import { DndKit } from "~/components/dnd-kit";
import { BlockquoteElement } from "~/components/ui/blockquote-node";
import { Editor, EditorContainer } from "~/components/ui/editor";
import { FixedToolbar } from "~/components/ui/fixed-toolbar";
import { H1Element, H2Element, H3Element } from "~/components/ui/heading-node";
import { MarkToolbarButton } from "~/components/ui/mark-toolbar-button";
import { ToolbarButton } from "~/components/ui/toolbar";
import { BlockMenuKit } from "~/components/block-menu-kit";
import { BlockPlaceholderKit } from "~/components/block-placeholder-kit";
import { MarkdownKit } from "~/components/markdown-kit";
import { Button } from "~/components/ui/button";
import { Save, RefreshCw } from "lucide-react";
import { useDocumentData } from "~/hooks/use-document-data";
import { useEffect } from "react";
import { YjsPlugin } from "@platejs/yjs/react";
import { RemoteCursorOverlay } from "~/components/ui/remote-cursor-overlay";

import { useMounted } from "~/hooks/use-mounted"; // Or your own mounted check

interface DocumentEditorProps {
  pageId: string;
  autoSaveEnabled?: boolean;
}

export default function DocumentEditor({
  pageId,
  autoSaveEnabled = true,
}: DocumentEditorProps) {
  const {
    value,
    isLoading,
    error,
    isSaving,
    lastSaved,
    setValue,
    saveNow,
    refetch,
  } = useDocumentData({
    pageId,
    autoSaveEnabled,
    autoSaveDelayMs: 2000,
  });

  const editor = usePlateEditor({
    plugins: [
      BoldPlugin,
      ItalicPlugin,
      UnderlinePlugin,
      H1Plugin.withComponent(H1Element),
      H2Plugin.withComponent(H2Element),
      H3Plugin.withComponent(H3Element),
      BlockquotePlugin.withComponent(BlockquoteElement),
      ...DndKit,
      ...BlockMenuKit,
      ...BlockPlaceholderKit,
      ...MarkdownKit,
      YjsPlugin.configure({
        render: {
          afterEditable: RemoteCursorOverlay,
        },
        options: {
          // Configure local user cursor appearance
          cursors: {
            data: {
              name: "Anonymous", // Replace with dynamic user name
              color: "#aabbcc", // Replace with dynamic user color
            },
          },
          // Configure providers. All providers share the same Y.Doc and Awareness instance.
          providers: [
            // Example: WebRTC provider (can be used alongside Hocuspocus)
            {
              type: "webrtc",
              options: {
                roomName: pageId, // Must match the document identifier
                signaling: [import.meta.env.VITE_SIGNALING_SERVER_URL], // Optional: Your signaling server URLs
              },
            },
          ],
        },
      }),
    ],
    // Important: Skip Plate's default initialization when using Yjs
    skipInitialization: true,
  });

  const mounted = useMounted();

  useEffect(() => {
    // Ensure component is mounted and editor is ready
    if (!mounted) return;

    // Initialize Yjs connection, sync document, and set initial editor state
    editor.getApi(YjsPlugin).yjs.init({
      id: pageId, // Unique identifier for the Yjs document
      value: value, // Initial content if the Y.Doc is empty
    });

    // Clean up: Destroy connection when component unmounts
    return () => {
      editor.getApi(YjsPlugin).yjs.destroy();
    };
  }, [editor, mounted]);

  // Update editor content when value loads from database
  useEffect(() => {
    if (!isLoading && value && value.length > 0) {
      // Only update if the editor content is different to avoid loops
      const currentValue = editor.children;
      if (JSON.stringify(currentValue) !== JSON.stringify(value)) {
        editor.tf.setValue(value);
      }
    }
  }, [value, isLoading]); // Note: not including editor in deps to avoid loops

  // Handle editor changes
  const handleChange = ({ value: newValue }: { value: Value }) => {
    setValue(newValue);
  };

  // Handle manual save
  const handleSave = async () => {
    const success = await saveNow();
    if (!success && error) {
      // You might want to show a toast notification here
      console.error("Save failed:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full w-full">
        <div className="border-b">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">
                Loading document...
              </span>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your document...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !value) {
    return (
      <div className="flex flex-col h-full w-full">
        <div className="border-b">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-red-600">
                Error loading document
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={refetch}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-xl font-semibold mb-2">
              Failed to load document
            </h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={refetch}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      <Plate editor={editor} onChange={handleChange}>
        <FixedToolbar className="justify-start rounded-t-lg">
          {/* Element Toolbar Buttons */}
          <ToolbarButton onClick={() => editor.tf.h1.toggle()}>
            H1
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.tf.h2.toggle()}>
            H2
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.tf.h3.toggle()}>
            H3
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.tf.blockquote.toggle()}>
            Quote
          </ToolbarButton>
          {/* Mark Toolbar Buttons */}
          <MarkToolbarButton nodeType="bold" tooltip="Bold (⌘+B)">
            B
          </MarkToolbarButton>
          <MarkToolbarButton nodeType="italic" tooltip="Italic (⌘+I)">
            I
          </MarkToolbarButton>
          <MarkToolbarButton nodeType="underline" tooltip="Underline (⌘+U)">
            U
          </MarkToolbarButton>

          {/* Save Controls */}
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isSaving ? "Saving..." : "Save"}
            </Button>
            {/*
            {lastSaved && (
              <span className="text-xs text-muted-foreground">{lastSaved}</span>
            )}
            {error && <span className="text-xs text-red-600">Save error</span>}
            */}
          </div>
        </FixedToolbar>

        <EditorContainer className="flex-1 pt-24">
          <Editor placeholder="Type your amazing content here..." />
        </EditorContainer>
      </Plate>
    </div>
  );
}
