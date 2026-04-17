# UI Guide

## Layout

```
┌─────────────────┬──────────────────────────┬──────────────────┐
│  Left Sidebar   │     Graph Canvas          │  Right Sidebar   │
│  (nav + tools)  │     (SVG editor)          │  (element props) │
├─────────────────┴──────────────────────────┴──────────────────┤
│  CLI / Command Prompt                                          │
└────────────────────────────────────────────────────────────────┘
```

All panels are resizable by dragging their edges.

---

## Left Sidebar

| Control | Action |
|---------|--------|
| `[NEW GRAPH]` | Create empty graph, switch to editor |
| `[GALLERY]` | Open saved graphs gallery |
| `[SELECT]` | Switch to select/move mode |
| `[CONNECT]` | Switch to edge-creation mode |
| `[SAVE]` | Save current graph (opens name/description form) |

---

## Graph Canvas

### SELECT mode

| Interaction | Result |
|-------------|--------|
| Double-click background | Spawn vertex at cursor |
| Click vertex | Select vertex (opens right sidebar) |
| Click edge | Select edge (opens right sidebar) |
| Drag vertex | Move vertex |
| Drag background | Pan canvas |
| Click background | Deselect |

### CONNECT mode

| Interaction | Result |
|-------------|--------|
| Drag from vertex → release on vertex | Create edge between them |
| Drag from vertex → release on background | Cancel (no edge created) |

Dashed line previews the edge during drag.

---

## Right Sidebar (Properties)

Opens automatically when a vertex or edge is selected. Closes with `[X]` or by clicking canvas background.

### Vertex properties
- **Label** — editable text displayed inside and below the circle
- **Position** — X/Y coordinates (also movable by dragging on canvas)
- **Color** — palette of 10 terminal colors + hex input
- **Connections** — lists all edges touching this vertex
- **[DELETE VERTEX]** — removes vertex and all its edges

### Edge properties
- **Label** — editable text displayed at edge midpoint
- **Endpoints** — shows source → target vertex labels
- **Directed** — toggle adds/removes arrowhead
- **Color** — same palette + hex input
- **[DELETE EDGE]** — removes edge

### Color palette

| Name | Hex |
|------|-----|
| green | `#00ff41` |
| cyan | `#00ffff` |
| yellow | `#ffff00` |
| red | `#ff4444` |
| magenta | `#ff00ff` |
| orange | `#ff8c00` |
| white | `#e0e0e0` |
| blue | `#4488ff` |
| gray | `#888888` |
| pink | `#ff88cc` |

---

## Gallery

Shows all saved graphs as cards with mini SVG preview, vertex/edge counts, and last-updated date.

| Button | Action |
|--------|--------|
| `[EDIT]` | Load graph into canvas editor |
| `[DEL]` | Delete graph (with confirmation) |

Access via `[GALLERY]` in the left sidebar or `list graphs` / `load <name>` in the CLI.

---

## Resizing Panels

Drag the thin border between any two panels to resize:

- **Left sidebar** — drag its right edge (↔)
- **Right sidebar** — drag its left edge (↔)
- **CLI** — drag its top edge (↕), drag **up** to grow, **down** to shrink

Minimum/maximum sizes are enforced to prevent panels from disappearing.
