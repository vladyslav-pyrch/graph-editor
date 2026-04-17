# Architecture

## Stack

- **React 19** + **TypeScript 5.7** — UI and type safety
- **Vite 6** — dev server and build
- **Pure SVG** — graph canvas, no canvas API or graph libraries
- **localStorage** — graph persistence, no backend

---

## Project Structure

```
src/
├── types.ts                  # All TypeScript interfaces
├── main.tsx                  # React entry point
├── App.tsx                   # Root layout, panel size state
├── index.css                 # All styles (terminal theme)
├── store/
│   └── GraphContext.tsx       # Global state (useReducer + localStorage)
├── components/
│   ├── GraphCanvas.tsx        # SVG interactive canvas
│   ├── LeftSidebar.tsx        # Nav, mode switcher, save form
│   ├── RightSidebar.tsx       # Vertex/edge properties panel
│   ├── GalleryView.tsx        # Saved graphs grid with mini previews
│   ├── CLI.tsx                # Command prompt with highlighting + autocomplete
│   └── ResizeHandle.tsx       # Draggable panel resize handle
└── utils/
    ├── cli.ts                 # CLI command parser (pure function)
    ├── cliDefs.ts             # Command definitions for autocomplete
    └── id.ts                  # Random ID generator
```

---

## Data Model (`src/types.ts`)

```typescript
interface Vertex {
  id: string;
  label: string;
  x: number;      // graph-space coordinates
  y: number;
  color: string;  // hex color
}

interface Edge {
  id: string;
  label: string;
  sourceId: string;
  targetId: string;
  color: string;
  directed: boolean;
}

interface Graph {
  id: string;
  name: string;
  description: string;
  vertices: Vertex[];
  edges: Edge[];
  createdAt: number;
  updatedAt: number;
}
```

---

## State Management (`src/store/GraphContext.tsx`)

Single `useReducer` with `localStorage` persistence. The context exposes:

```typescript
{
  state: AppState,
  dispatch: Dispatch<Action>,
  addVertex: (x, y) => void,    // convenience wrapper
  addEdge: (srcId, dstId) => void,
}
```

`AppState` shape:
```typescript
{
  graphs: Graph[],              // saved graphs (persisted)
  currentGraph: Graph | null,   // active editor graph (not persisted)
  selectedElement: SelectedElement,
  editorMode: 'select' | 'connect',
  view: 'editor' | 'gallery',
}
```

Only `graphs[]` is written to `localStorage` — the active editor state is session-only.

### Key dispatch actions

| Action | Effect |
|--------|--------|
| `SET_CURRENT_GRAPH` | Replace active graph without changing view/mode. Used by CLI mutations. |
| `LOAD_GRAPH` | Load into editor, reset view to `editor`, clear selection. |
| `SAVE_CURRENT_GRAPH` | Upsert current graph into `graphs[]` by id. |
| `NEW_GRAPH` | Replace current graph with fresh empty graph, switch to editor. |

---

## Graph Canvas (`src/components/GraphCanvas.tsx`)

Pure SVG with a `<g transform="translate(panX, panY)">` wrapper for panning.

### Drag state machine

```typescript
type DragState =
  | null
  | { type: 'move';    vertexId: string; startMouseX/Y; origX/Y }
  | { type: 'connect'; sourceId: string; currentX/Y }
  | { type: 'pan';     startMouseX/Y; origPanX/Y }
```

- `move` — triggered by mousedown on vertex in SELECT mode. Window `mousemove`/`mouseup` via `useEffect`.
- `connect` — triggered by mousedown on vertex in CONNECT mode. Draws dashed preview line. On mouseup over another vertex, calls `addEdge`.
- `pan` — triggered by mousedown on background. Translates `panOffset` state.

Edge hit detection uses a 12px-wide transparent `<line>` overlaid on the 1.5px visible stroke — no geometry math needed for click targets.

### Coordinate system

Vertex positions are stored in "graph space". The SVG `<g>` is translated by `panOffset`, so screen position = graph position + pan offset. Mouse → graph conversion: `clientX - rect.left - panOffset.x`.

---

## CLI Architecture (`src/utils/cli.ts`)

The parser is a **pure function**:

```typescript
function parseCommand(input: string, graph: Graph | null, graphs: Graph[]): CLIResult
```

Mutations are returned as callbacks, not applied directly:

```typescript
interface CLIResult {
  output: string;
  error?: boolean;
  graphMutation?: (graph: Graph) => Graph;  // pure transform
  metaMutation?: { name?: string; description?: string };
  shouldSave?: boolean;
  shouldLoad?: string;   // graph id
  shouldNew?: boolean;
  shouldClear?: boolean;
}
```

The `CLI` component receives the result and dispatches the appropriate actions. This keeps the parser stateless and independently testable.

---

## Autocomplete (`src/utils/cliDefs.ts`)

`getSuggestions(input, graphs)` returns matching `CommandDef[]`.

Matching algorithm: split input into tokens, check that each token is a prefix of the corresponding token in `def.syntax`.

```
input "ad v" → tokens ["ad", "v"]
syntax "add vertex" → tokens ["add", "vertex"]
"add".startsWith("ad") && "vertex".startsWith("v") → match ✓
```

Special case: when input starts with `load `, dynamic completions are generated from `graphs[]` matching the partial name.

---

## Resizable Panels (`src/components/ResizeHandle.tsx`)

`ResizeHandle` emits **incremental** deltas (change since last `mousemove`), not absolute positions. The parent accumulates:

```typescript
setLeftWidth(w => CLAMP(w + delta, 120, 520))
```

Panel sizes live in `App.tsx` state and drive `grid-template-columns/rows` via inline styles.

```tsx
<div style={{
  gridTemplateColumns: `${leftWidth}px 1fr ${rightOpen ? rightWidth + 'px' : '0px'}`,
  gridTemplateRows: `1fr ${cliHeight}px`,
}}>
```

During drag, `document.body.style.userSelect = 'none'` prevents text selection. Cursor style is forced on `document.body` so it stays consistent when the mouse leaves the handle.
