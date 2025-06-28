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
import { ToolbarButton } from "~/components/ui/toolbar"; // Generic toolbar button
import { BlockMenuKit } from "~/components/block-menu-kit";
import { BlockPlaceholderKit } from "~/components/block-placeholder-kit";

const initialValue: Value = [
  {
    children: [{ text: "Title" }],
    type: "h3",
  },
  {
    children: [{ text: "This is a quote." }],
    type: "blockquote",
  },
  {
    children: [
      { text: "With some " },
      { bold: true, text: "bold" },
      { text: " text for emphasis!" },
    ],
    type: "p",
  },
];

export default function DocumentEditor() {
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
    ], // Add the mark plugins
    value: initialValue, // Set initial content
  }); // Initializes the editor instance

  return (
    <Plate editor={editor}>
      <FixedToolbar className="justify-start rounded-t-lg">
        {/* Element Toolbar Buttons */}
        <ToolbarButton onClick={() => editor.tf.h1.toggle()}>H1</ToolbarButton>
        <ToolbarButton onClick={() => editor.tf.h2.toggle()}>H2</ToolbarButton>
        <ToolbarButton onClick={() => editor.tf.h3.toggle()}>H3</ToolbarButton>
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
      </FixedToolbar>
      {/* Provides editor context */}
      <EditorContainer>
        {/* Styles the editor area */}
        <Editor placeholder="Type your amazing content here..." />
      </EditorContainer>
    </Plate>
  );
}
