import { Graph, Vertex, Edge, PALETTE } from '../types';
import { generateId } from './id';

export interface CLIResult {
  output: string;
  error?: boolean;
  graphMutation?: (graph: Graph) => Graph;
  metaMutation?: { name?: string; description?: string };
  shouldSave?: boolean;
  shouldClear?: boolean;
  shouldNew?: boolean;
  shouldLoad?: string; // graph id
}

function resolveColor(input: string): string {
  const lower = input.toLowerCase();
  if (PALETTE[lower]) return PALETTE[lower];
  if (/^#[0-9a-f]{3,6}$/i.test(input)) return input;
  if (/^[0-9a-f]{6}$/i.test(input)) return `#${input}`;
  return input;
}

function findVertex(graph: Graph, label: string): Vertex | undefined {
  return (
    graph.vertices.find(v => v.label.toLowerCase() === label.toLowerCase()) ??
    graph.vertices.find(v => v.id === label)
  );
}

function findEdge(graph: Graph, label: string): Edge | undefined {
  return (
    graph.edges.find(e => e.label.toLowerCase() === label.toLowerCase()) ??
    graph.edges.find(e => e.id === label)
  );
}

const HELP = `
COMMANDS
  add vertex [label]              spawn vertex
  add edge <src> <dst> [label]    connect two vertices
  remove vertex <label>           delete vertex + connected edges
  remove edge <label>             delete edge
  set vertex <label> label <new>  rename vertex
  set vertex <label> color <c>    recolor vertex
  set edge <label> label <new>    rename edge
  set edge <label> color <c>      recolor edge
  set edge <label> directed <t/f> toggle direction
  list                            show all elements
  list vertices                   show vertices
  list edges                      show edges
  list graphs                     show saved graphs
  load <name|index>               load saved graph into editor
  graph name <name>               set graph name
  graph desc <text>               set graph description
  save [name]                     save current graph
  clear                           clear canvas
  new                             new empty graph
  help                            this message
COLORS: green cyan yellow red magenta orange white blue gray pink #hex
`.trim();

export function parseCommand(input: string, graph: Graph | null, graphs: Graph[] = []): CLIResult {
  const trimmed = input.trim();
  if (!trimmed) return { output: '' };

  const tokens = trimmed.match(/(?:[^\s"]+|"[^"]*")+/g) ?? [];
  const args = tokens.map(t => t.replace(/^"|"$/g, ''));
  const cmd = (args[0] ?? '').toLowerCase();

  if (cmd === 'help') return { output: HELP };

  if (cmd === 'new') return { output: 'new graph created', shouldNew: true };

  if (cmd === 'clear') {
    return { output: 'graph cleared', shouldClear: true };
  }

  if (!graph) {
    return { output: 'no active graph', error: true };
  }

  if (cmd === 'list') {
    const sub = (args[1] ?? '').toLowerCase();
    if (!sub || sub === 'vertices') {
      const lines = graph.vertices.map(
        v => `  ${v.label} (id:${v.id}) @ ${Math.round(v.x)},${Math.round(v.y)} color:${v.color}`
      );
      if (!lines.length) return { output: 'no vertices' };
      if (sub === 'vertices') return { output: lines.join('\n') };
      const eLines = graph.edges.map(
        e => `  ${e.label} (id:${e.id}) ${e.sourceId} -> ${e.targetId} color:${e.color} directed:${e.directed}`
      );
      return {
        output:
          `VERTICES (${graph.vertices.length})\n${lines.join('\n')}\n\nEDGES (${graph.edges.length})\n` +
          (eLines.length ? eLines.join('\n') : '  none'),
      };
    }
    if (sub === 'edges') {
      const lines = graph.edges.map(
        e => `  ${e.label} (id:${e.id}) ${e.sourceId} -> ${e.targetId} color:${e.color} directed:${e.directed}`
      );
      if (!lines.length) return { output: 'no edges' };
      return { output: lines.join('\n') };
    }
    if (sub === 'graphs') {
      if (!graphs.length) return { output: 'no saved graphs' };
      const lines = graphs.map(
        (g, i) =>
          `  [${i}] ${g.name}${g.description ? ' — ' + g.description : ''} (V:${g.vertices.length} E:${g.edges.length})`
      );
      return { output: `SAVED GRAPHS (${graphs.length})\n${lines.join('\n')}` };
    }
    return { output: `unknown: list ${sub}`, error: true };
  }

  if (cmd === 'load') {
    const query = args.slice(1).join(' ').trim();
    if (!query) return { output: 'usage: load <name or index>', error: true };
    if (!graphs.length) return { output: 'no saved graphs', error: true };
    const idx = parseInt(query, 10);
    let found: Graph | undefined;
    if (!isNaN(idx) && idx >= 0 && idx < graphs.length) {
      found = graphs[idx];
    }
    if (!found) {
      found =
        graphs.find(g => g.name.toLowerCase() === query.toLowerCase()) ??
        graphs.find(g => g.name.toLowerCase().includes(query.toLowerCase())) ??
        graphs.find(g => g.id === query);
    }
    if (!found) return { output: `graph "${query}" not found`, error: true };
    return { output: `loaded "${found.name}"`, shouldLoad: found.id };
  }

  if (cmd === 'graph') {
    const sub = (args[1] ?? '').toLowerCase();
    const val = args.slice(2).join(' ');
    if (!val) return { output: 'value required', error: true };
    if (sub === 'name') return { output: `graph name set to "${val}"`, metaMutation: { name: val } };
    if (sub === 'desc' || sub === 'description')
      return { output: `graph description updated`, metaMutation: { description: val } };
    return { output: `unknown: graph ${sub}`, error: true };
  }

  if (cmd === 'save') {
    const name = args.slice(1).join(' ') || graph.name;
    return { output: `saved as "${name}"`, shouldSave: true, metaMutation: { name } };
  }

  if (cmd === 'add') {
    const sub = (args[1] ?? '').toLowerCase();

    if (sub === 'vertex') {
      const label = args[2] ?? `V${graph.vertices.length + 1}`;
      const existing = findVertex(graph, label);
      if (existing) return { output: `vertex "${label}" already exists`, error: true };
      const angle = Math.random() * Math.PI * 2;
      const r = 80 + Math.random() * 120;
      const cx = 400;
      const cy = 300;
      const vertex: Vertex = {
        id: generateId(),
        label,
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        color: '#00ff41',
      };
      return {
        output: `vertex "${label}" added`,
        graphMutation: g => ({ ...g, vertices: [...g.vertices, vertex], updatedAt: Date.now() }),
      };
    }

    if (sub === 'edge') {
      const srcLabel = args[2];
      const dstLabel = args[3];
      if (!srcLabel || !dstLabel)
        return { output: 'usage: add edge <src> <dst> [label]', error: true };
      const src = findVertex(graph, srcLabel);
      const dst = findVertex(graph, dstLabel);
      if (!src) return { output: `vertex "${srcLabel}" not found`, error: true };
      if (!dst) return { output: `vertex "${dstLabel}" not found`, error: true };
      if (src.id === dst.id) return { output: 'self-loops not allowed', error: true };
      const dup = graph.edges.find(
        e =>
          (e.sourceId === src.id && e.targetId === dst.id) ||
          (e.sourceId === dst.id && e.targetId === src.id)
      );
      if (dup) return { output: `edge between "${srcLabel}" and "${dstLabel}" already exists`, error: true };
      const label = args[4] ?? `E${graph.edges.length + 1}`;
      const edge: Edge = {
        id: generateId(),
        label,
        sourceId: src.id,
        targetId: dst.id,
        color: '#888888',
        directed: false,
      };
      return {
        output: `edge "${label}" added (${srcLabel} -> ${dstLabel})`,
        graphMutation: g => ({ ...g, edges: [...g.edges, edge], updatedAt: Date.now() }),
      };
    }

    return { output: `unknown: add ${sub}`, error: true };
  }

  if (cmd === 'remove' || cmd === 'delete') {
    const sub = (args[1] ?? '').toLowerCase();

    if (sub === 'vertex') {
      const label = args[2];
      if (!label) return { output: 'usage: remove vertex <label>', error: true };
      const v = findVertex(graph, label);
      if (!v) return { output: `vertex "${label}" not found`, error: true };
      return {
        output: `vertex "${v.label}" removed`,
        graphMutation: g => ({
          ...g,
          vertices: g.vertices.filter(x => x.id !== v.id),
          edges: g.edges.filter(e => e.sourceId !== v.id && e.targetId !== v.id),
          updatedAt: Date.now(),
        }),
      };
    }

    if (sub === 'edge') {
      const label = args[2];
      if (!label) return { output: 'usage: remove edge <label>', error: true };
      const e = findEdge(graph, label);
      if (!e) return { output: `edge "${label}" not found`, error: true };
      return {
        output: `edge "${e.label}" removed`,
        graphMutation: g => ({
          ...g,
          edges: g.edges.filter(x => x.id !== e.id),
          updatedAt: Date.now(),
        }),
      };
    }

    return { output: `unknown: remove ${sub}`, error: true };
  }

  if (cmd === 'set') {
    const sub = (args[1] ?? '').toLowerCase();
    const label = args[2];
    const prop = (args[3] ?? '').toLowerCase();
    const val = args.slice(4).join(' ');

    if (!label) return { output: `usage: set ${sub} <label> <prop> <value>`, error: true };
    if (!prop || !val) return { output: 'property and value required', error: true };

    if (sub === 'vertex') {
      const v = findVertex(graph, label);
      if (!v) return { output: `vertex "${label}" not found`, error: true };
      if (prop === 'label' || prop === 'name') {
        return {
          output: `vertex "${v.label}" renamed to "${val}"`,
          graphMutation: g => ({
            ...g,
            vertices: g.vertices.map(x => (x.id === v.id ? { ...x, label: val } : x)),
            updatedAt: Date.now(),
          }),
        };
      }
      if (prop === 'color' || prop === 'colour') {
        const color = resolveColor(val);
        return {
          output: `vertex "${v.label}" color set to ${color}`,
          graphMutation: g => ({
            ...g,
            vertices: g.vertices.map(x => (x.id === v.id ? { ...x, color } : x)),
            updatedAt: Date.now(),
          }),
        };
      }
      return { output: `unknown vertex property "${prop}"`, error: true };
    }

    if (sub === 'edge') {
      const e = findEdge(graph, label);
      if (!e) return { output: `edge "${label}" not found`, error: true };
      if (prop === 'label' || prop === 'name') {
        return {
          output: `edge "${e.label}" renamed to "${val}"`,
          graphMutation: g => ({
            ...g,
            edges: g.edges.map(x => (x.id === e.id ? { ...x, label: val } : x)),
            updatedAt: Date.now(),
          }),
        };
      }
      if (prop === 'color' || prop === 'colour') {
        const color = resolveColor(val);
        return {
          output: `edge "${e.label}" color set to ${color}`,
          graphMutation: g => ({
            ...g,
            edges: g.edges.map(x => (x.id === e.id ? { ...x, color } : x)),
            updatedAt: Date.now(),
          }),
        };
      }
      if (prop === 'directed') {
        const directed = val === 'true' || val === '1' || val === 'yes';
        return {
          output: `edge "${e.label}" directed set to ${directed}`,
          graphMutation: g => ({
            ...g,
            edges: g.edges.map(x => (x.id === e.id ? { ...x, directed } : x)),
            updatedAt: Date.now(),
          }),
        };
      }
      return { output: `unknown edge property "${prop}"`, error: true };
    }

    return { output: `unknown: set ${sub}`, error: true };
  }

  return { output: `unknown command: "${cmd}". type 'help' for commands`, error: true };
}
