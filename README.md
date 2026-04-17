# GRAPH//EDITOR

Terminal-style mathematical graph editor built with React + TypeScript. Create, edit, and save graphs with vertices and edges via interactive SVG canvas or CLI commands.

![Graph Editor](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue) ![Vite](https://img.shields.io/badge/Vite-6-purple)

## Quick Start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build
```

## Features

- **Interactive SVG canvas** — double-click to spawn vertices, drag to move, drag vertex→vertex to connect
- **Two editor modes** — SELECT (move vertices) and CONNECT (draw edges)
- **Element properties** — click any vertex or edge to open right sidebar with label, color, and attributes
- **CLI interface** — full command line at the bottom with syntax highlighting and autocomplete
- **Graph gallery** — save, browse, load, and delete graphs; persisted to `localStorage`
- **Resizable panels** — drag edges of left sidebar, right sidebar, and CLI to resize

## Docs

- [UI Guide](docs/ui-guide.md) — canvas interactions, modes, panel layout
- [CLI Reference](docs/cli-reference.md) — all commands with usage and examples
- [Architecture](docs/architecture.md) — codebase structure and data flow
