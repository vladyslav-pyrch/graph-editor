# CLAUDE.md

Guidance for Claude Code (claude.ai/code) working in this repo.

## Commands

```bash
npm run dev        # start dev server (localhost:5173)
npm run build      # tsc -b && vite build
npm run preview    # preview production build
npx tsc --noEmit   # type-check only (no test runner configured)
```

No linter config installed yet (`eslint` listed as script but not in devDependencies).

## Architecture

Single-page React 19 + TypeScript app. No routing, no external graph/animation libraries.

**State** lives in `src/store/GraphContext.tsx` — single `useReducer` with `localStorage` persistence (saves `graphs[]` only, not active editor state). Context exposes `state`, `dispatch`, `addVertex`, `addEdge` helpers.

**Data model** (`src/types.ts`):
- `Graph` contains `vertices: Vertex[]` and `edges: Edge[]`
- `Vertex`: id, label, x, y, color
- `Edge`: id, label, sourceId, targetId, color, directed
- `SelectedElement` — union discriminated by `type: 'vertex' | 'edge'`

**Layout** CSS Grid (3 columns × 2 rows): left sidebar | SVG canvas | right sidebar, CLI spans full bottom row.

**Graph canvas** (`src/components/GraphCanvas.tsx`) pure SVG. Drag state machine:
- `move` — mousedown on vertex in SELECT mode → window mousemove/mouseup listeners (via `useEffect`)
- `connect` — mousedown on vertex in CONNECT mode → draws dashed temp line → mouseup on target calls `addEdge`
- `pan` — mousedown on background → translates `<g>` wrapper via `panOffset` state

Edge hit detection uses 12px-wide transparent `<line>` overlaying visible 1.5px stroke.

**CLI** (`src/utils/cli.ts`) pure function `parseCommand(input, graph) → CLIResult`. Mutations returned as `graphMutation: (graph: Graph) => Graph` callbacks; CLI component applies via `SET_CURRENT_GRAPH` dispatch. Parser stateless, testable.

**Key dispatch actions:**
- `SET_CURRENT_GRAPH` — replace current graph, no view/mode change (used by CLI mutations)
- `LOAD_GRAPH` — load into editor, reset view/mode/selection
- `SAVE_CURRENT_GRAPH` — upserts by id into `graphs[]`