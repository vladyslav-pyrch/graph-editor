# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # start dev server (localhost:5173)
npm run build      # tsc -b && vite build
npm run preview    # preview production build
npx tsc --noEmit   # type-check only (no test runner configured)
```

No linter config is installed yet (`eslint` is listed as a script but not in devDependencies).

## Architecture

Single-page React 19 + TypeScript app. No routing, no external graph/animation libraries.

**State** lives entirely in `src/store/GraphContext.tsx` — a single `useReducer` with `localStorage` persistence (saves `graphs[]` only, not active editor state). The context exposes `state`, `dispatch`, `addVertex`, and `addEdge` helpers.

**Data model** (`src/types.ts`):
- `Graph` contains `vertices: Vertex[]` and `edges: Edge[]`
- `Vertex`: id, label, x, y, color
- `Edge`: id, label, sourceId, targetId, color, directed
- `SelectedElement` — union discriminated by `type: 'vertex' | 'edge'`

**Layout** is CSS Grid (3 columns × 2 rows): left sidebar | SVG canvas | right sidebar, with CLI spanning the full bottom row.

**Graph canvas** (`src/components/GraphCanvas.tsx`) is pure SVG. Drag state machine:
- `move` — mousedown on vertex in SELECT mode → window mousemove/mouseup listeners (via `useEffect`)
- `connect` — mousedown on vertex in CONNECT mode → draws dashed temp line → mouseup on target vertex calls `addEdge`
- `pan` — mousedown on background → translates a `<g>` wrapper via `panOffset` state

Edge hit detection uses a 12px-wide transparent `<line>` overlaying the visible 1.5px stroke.

**CLI** (`src/utils/cli.ts`) is a pure function `parseCommand(input, graph) → CLIResult`. Mutations are returned as `graphMutation: (graph: Graph) => Graph` callbacks; the CLI component applies them via `SET_CURRENT_GRAPH` dispatch. This keeps the parser stateless and testable.

**Key dispatch actions:**
- `SET_CURRENT_GRAPH` — replace current graph without changing view/mode (used by CLI mutations)
- `LOAD_GRAPH` — load into editor and reset view/mode/selection
- `SAVE_CURRENT_GRAPH` — upserts by id into `graphs[]`
