import { Graph } from '../types';

export interface CommandDef {
  key: string;
  syntax: string;
  usage: string;
  description: string;
}

export const STATIC_COMMANDS: CommandDef[] = [
  {
    key: 'add-vertex',
    syntax: 'add vertex',
    usage: 'add vertex [label]',
    description: 'Spawn vertex at random position. Label auto-assigned if omitted.',
  },
  {
    key: 'add-edge',
    syntax: 'add edge',
    usage: 'add edge <src> <dst> [label]',
    description: 'Connect two vertices by label. Prevents duplicate edges.',
  },
  {
    key: 'remove-vertex',
    syntax: 'remove vertex',
    usage: 'remove vertex <label>',
    description: 'Delete vertex and all its connected edges.',
  },
  {
    key: 'remove-edge',
    syntax: 'remove edge',
    usage: 'remove edge <label>',
    description: 'Delete edge by label.',
  },
  {
    key: 'set-vertex-label',
    syntax: 'set vertex',
    usage: 'set vertex <label> label <new>',
    description: 'Rename a vertex.',
  },
  {
    key: 'set-vertex-color',
    syntax: 'set vertex',
    usage: 'set vertex <label> color <color>',
    description: 'Recolor vertex. Accepts color name or #hex.',
  },
  {
    key: 'set-edge-label',
    syntax: 'set edge',
    usage: 'set edge <label> label <new>',
    description: 'Rename an edge.',
  },
  {
    key: 'set-edge-color',
    syntax: 'set edge',
    usage: 'set edge <label> color <color>',
    description: 'Recolor edge.',
  },
  {
    key: 'set-edge-directed',
    syntax: 'set edge',
    usage: 'set edge <label> directed <true|false>',
    description: 'Toggle edge direction. Adds/removes arrowhead.',
  },
  {
    key: 'list',
    syntax: 'list',
    usage: 'list',
    description: 'Show all vertices and edges in current graph.',
  },
  {
    key: 'list-vertices',
    syntax: 'list vertices',
    usage: 'list vertices',
    description: 'Show vertices with positions and colors.',
  },
  {
    key: 'list-edges',
    syntax: 'list edges',
    usage: 'list edges',
    description: 'Show edges with endpoints, colors, direction.',
  },
  {
    key: 'list-graphs',
    syntax: 'list graphs',
    usage: 'list graphs',
    description: 'Show all saved graphs with vertex/edge counts.',
  },
  {
    key: 'load',
    syntax: 'load',
    usage: 'load <name|index>',
    description: 'Load saved graph by name or list index into editor.',
  },
  {
    key: 'graph-name',
    syntax: 'graph name',
    usage: 'graph name <name>',
    description: 'Set current graph name.',
  },
  {
    key: 'graph-desc',
    syntax: 'graph desc',
    usage: 'graph desc <text>',
    description: 'Set current graph description.',
  },
  {
    key: 'save',
    syntax: 'save',
    usage: 'save [name]',
    description: 'Save current graph to gallery. Name optional.',
  },
  {
    key: 'new',
    syntax: 'new',
    usage: 'new',
    description: 'Create new empty graph.',
  },
  {
    key: 'clear',
    syntax: 'clear',
    usage: 'clear',
    description: 'Clear all vertices and edges from current graph.',
  },
  {
    key: 'help',
    syntax: 'help',
    usage: 'help',
    description: 'Show all available commands.',
  },
];

export function getSuggestions(input: string, graphs: Graph[]): CommandDef[] {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return [];

  const inputTokens = trimmed.split(/\s+/);

  // Dynamic load suggestions when typing "load <partial>"
  if (inputTokens[0] === 'load' && inputTokens.length >= 2) {
    const query = inputTokens.slice(1).join(' ');
    const matched = graphs.filter(g => g.name.toLowerCase().startsWith(query));
    if (matched.length > 0) {
      return matched.map(g => ({
        key: `load-${g.id}`,
        syntax: `load ${g.name}`,
        usage: `load ${g.name}`,
        description: (g.description || '') + ` [V:${g.vertices.length} E:${g.edges.length}]`,
      }));
    }
  }

  // Static prefix matching
  const seen = new Set<string>();
  const results: CommandDef[] = [];

  for (const def of STATIC_COMMANDS) {
    const syntaxTokens = def.syntax.toLowerCase().split(/\s+/);
    const matches = inputTokens.every((t, i) => syntaxTokens[i]?.startsWith(t));
    if (matches && !seen.has(def.syntax)) {
      seen.add(def.syntax);
      results.push(def);
    }
  }

  return results;
}

export const KNOWN_COMMANDS = ['add', 'remove', 'delete', 'set', 'list', 'help', 'new', 'clear', 'save', 'graph', 'load', 'gallery'];
export const KNOWN_SUBCOMMANDS = ['vertex', 'edge', 'vertices', 'edges', 'graphs', 'name', 'desc', 'label', 'color', 'directed'];
export const KNOWN_COLORS = ['green', 'cyan', 'yellow', 'red', 'magenta', 'orange', 'white', 'blue', 'gray', 'pink'];
