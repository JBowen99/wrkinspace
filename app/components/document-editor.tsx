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
import { useEffect, useRef } from "react";
import { YjsPlugin } from "@platejs/yjs/react";
import { RemoteCursorOverlay } from "~/components/ui/remote-cursor-overlay";

import { useMounted } from "~/hooks/use-mounted"; // Or your own mounted check
import { useUserName } from "~/hooks/use-user-name";

interface DocumentEditorProps {
  pageId: string;
}

export default function DocumentEditor({ pageId }: DocumentEditorProps) {
  console.log("🔄 DocumentEditor render with pageId:", pageId);

  const { value, isLoading, error, isSaving, saveWithValue, refetch } =
    useDocumentData({
      pageId,
    });

  const { userName } = useUserName();
  const yjsInitialized = useRef(false);
  const initialValueRef = useRef<Value | null>(null);

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
              name: userName || "Anonymous", // Replace with dynamic user name
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

  // Store initial value when first loaded
  useEffect(() => {
    if (!isLoading && !initialValueRef.current) {
      initialValueRef.current = value;
      console.log("💾 Stored initial value:", JSON.stringify(value, null, 2));
    }
  }, [isLoading, value]);

  useEffect(() => {
    // Ensure component is mounted and editor is ready
    console.log("mounted", mounted);
    console.log("isLoading", isLoading);
    console.log("value", value);
    console.log("editor", editor.children);
    console.log("yjsInitialized.current", yjsInitialized.current);
    if (!mounted || isLoading || yjsInitialized.current) return;

    const initialValue = initialValueRef.current || value;
    console.log("🚀 Initializing YJS for pageId:", pageId);
    console.log("📝 Database value:", JSON.stringify(initialValue, null, 2));

    // Initialize Yjs connection WITHOUT initial value to let it sync first
    editor.getApi(YjsPlugin).yjs.init({
      id: pageId, // Unique identifier for the Yjs document
    });

    yjsInitialized.current = true;
    console.log("✅ YJS initialized (no initial value) for pageId:", pageId);

    // Wait for YJS to sync, then check if we need to set initial content
    setTimeout(() => {
      const currentContent = editor.children;
      console.log(
        "🔍 Content after YJS sync:",
        JSON.stringify(currentContent, null, 2)
      );

      // Check if editor is empty (just default empty paragraph)
      const isEmpty =
        currentContent.length === 1 &&
        currentContent[0].children &&
        currentContent[0].children.length === 1 &&
        currentContent[0].children[0].text === "";

      console.log("📝 Editor is empty after sync:", isEmpty);

      if (isEmpty && initialValue.length > 0) {
        console.log("🔧 Setting initial value from database");
        editor.tf.setValue(initialValue);
      } else {
        console.log("✅ Using synced content from other users");
      }
    }, 200); // Increased delay to ensure sync completes

    // Clean up: Save current content and destroy connection when component unmounts
    return () => {
      // Save current editor content directly (avoid race condition)
      const currentEditorContent = editor.children;
      saveWithValue(currentEditorContent);

      editor.getApi(YjsPlugin).yjs.destroy();
      yjsInitialized.current = false;
      initialValueRef.current = null;
    };
  }, [editor, mounted, isLoading, pageId, saveWithValue]);

  /*
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
  */

  // Handle manual save
  const handleSave = async () => {
    // Get current editor content and save it directly
    const currentEditorContent = editor.children;
    const success = await saveWithValue(currentEditorContent);
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
      <Plate editor={editor}>
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
