# 🚀 Minimalist Collaborative Workspace App

A collaborative, login-free workspace for documents, moodboards, and kanban boards — with seamless sharing via QR codes.

## ✨ Key Features

- **Spaces**

  - Users create or join a space without an account.
  - Sharing via QR codes and optional password protection.
  - Anonymous or named participation.

- **Pages**

  - Each space supports multiple pages of different types:
    - `document`: Notion-like editor with markdown blocks.
    - `moodboard`: Canvas for freely moving/resizing items.
    - `kanban`: Drag-and-drop kanban boards.

- **Documents**

  - Flexible block-based documents.
  - Markdown support for text blocks.
  - Live collaboration via Supabase Realtime.

- **Moodboards**

  - Freeform canvas with images, text boxes, and other items.
  - Items can be moved and resized.
  - Perfect for visual brainstorming.

- **Kanban Boards**

  - Simple kanban boards as separate pages.
  - Columns and cards editable and synced in real time.

- **Minimalist UI**
  - Monotone visuals with Tailwind CSS.
  - Clean side bar with pages.
  - Simple toolbar for editing.

## 🗂️ Project Structure

- **Routing** with React Router:

  - `/` → Landing (Join or Create Space)
  - `/space/:spaceId` → Space layout (sidebar + outlet)
  - `/space/:spaceId/page/:pageId` → Specific page (document, moodboard, kanban)

\*\* Component Structure
src/
components/
LandingPage.tsx
SpaceLayout.tsx
Sidebar.tsx
PageToolbar.tsx
DocumentPage/
DocumentPage.tsx
DocumentToolbar.tsx
BlockRenderer.tsx
MoodboardPage/
MoodboardPage.tsx
MoodboardToolbar.tsx
MoodboardItem.tsx
KanbanPage/
KanbanPage.tsx
KanbanToolbar.tsx
KanbanColumn.tsx
KanbanCard.tsx
supabase/
client.ts
api.ts
utils/
qrCode.ts

## 🛢️ Database Schema (Supabase)

- `spaces`
- `id`, `created_at`, `qr_code_data`, `password`

- `participants`
- `id`, `space_id`, `name`, `anonymous`

- `pages`
- `id`, `space_id`, `title`, `type` ('document' | 'moodboard' | 'kanban'), `order`

- `document_blocks`
- `id`, `page_id`, `type`, `content`, `order`

- `moodboard_items`
- `id`, `page_id`, `type`, `properties`

- `kanban_columns`
- `id`, `page_id`, `title`, `order`

- `kanban_cards`
- `id`, `column_id`, `content`, `order`

## 🛠️ Tech Stack

- **Frontend:** React + React Router
- **State & Realtime:** Supabase (Database + Realtime)
- **Styling:** Tailwind CSS + Shadcn UI
- **Markdown Rendering:** react-markdown + remark-gfm
- **Drag & Drop:** react-rnd (moodboard), dnd-kit/react-beautiful-dnd (kanban)

## ✅ MVP Goals

- Create/join space with QR code and optional password.
- Anonymous or named participants.
- Sidebar for managing multiple pages.
- Page editors for:
- Documents with markdown.
- Moodboards with draggable/resizable items.
- Kanban boards with live collaboration.

---
