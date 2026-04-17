# CLI Reference

The command prompt at the bottom of the editor provides full control over graphs. Type `help` to list all commands.

## Navigation

| Key | Action |
|-----|--------|
| `Enter` | Execute command |
| `↑` / `↓` | Navigate command history (when no suggestions open) |
| `↑` / `↓` | Navigate autocomplete suggestions (when suggestions open) |
| `Tab` | Complete selected/first suggestion |
| `Escape` | Clear input and close suggestions |

Autocomplete shows matching commands with descriptions as you type.

---

## Syntax Highlighting

| Color | Meaning |
|-------|---------|
| Green | Valid command keyword |
| Red | Unknown command |
| Cyan | Sub-command (`vertex`, `edge`, `graphs`, etc.) |
| Colored | Color name rendered in its own color |
| Orange | Boolean value (`true` / `false`) |

---

## Commands

### Vertices

```
add vertex [label]
```
Spawn vertex at random position. Label defaults to `V1`, `V2`, etc.

```
remove vertex <label>
delete vertex <label>
```
Delete vertex by label and all its connected edges.

```
set vertex <label> label <new-label>
```
Rename vertex.

```
set vertex <label> color <color>
```
Change vertex color. Accepts color name or `#rrggbb` hex.

---

### Edges

```
add edge <src-label> <dst-label> [label]
```
Create edge between two vertices. Prevents duplicates and self-loops. Label defaults to `E1`, `E2`, etc.

```
remove edge <label>
delete edge <label>
```
Delete edge by label.

```
set edge <label> label <new-label>
```
Rename edge.

```
set edge <label> color <color>
```
Change edge color.

```
set edge <label> directed <true|false>
```
Toggle arrowhead on edge.

---

### Listing

```
list
```
Show all vertices and edges in current graph.

```
list vertices
```
Show vertices with IDs, positions, and colors.

```
list edges
```
Show edges with IDs, endpoints, colors, and direction.

```
list graphs
```
Show all saved graphs with index, name, description, and V/E counts. Use the index with `load`.

---

### Graph Management

```
load <name|index>
```
Load saved graph into editor by name (exact or partial match) or numeric index from `list graphs`.

```
graph name <name>
```
Set current graph name.

```
graph desc <text>
```
Set current graph description.

```
save [name]
```
Save current graph to gallery. If name given, renames before saving.

```
new
```
Create new empty graph.

```
clear
```
Remove all vertices and edges from current graph.

---

### Other

```
help
```
Print all available commands.

---

## Colors

Named colors accepted anywhere a color is required:

`green` `cyan` `yellow` `red` `magenta` `orange` `white` `blue` `gray` `pink`

Or any hex value: `#ff0000`, `#0af`, etc.

---

## Examples

```
> add vertex A
vertex "A" added

> add vertex B
vertex "B" added

> add edge A B road
edge "road" added (A -> B)

> set edge road directed true
edge "road" directed set to true

> set vertex A color cyan
vertex "A" color set to #00ffff

> list
VERTICES (2)
  A (id:abc123) @ 312,198 color:#00ffff
  B (id:def456) @ 489,302 color:#00ff41

EDGES (1)
  road (id:ghi789) abc123 -> def456 color:#888888 directed:true

> save My First Graph
saved as "My First Graph"

> list graphs
SAVED GRAPHS (1)
  [0] My First Graph (V:2 E:1)

> load 0
loaded "My First Graph"
```
