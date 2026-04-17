export interface Vertex {
  id: string;
  label: string;
  x: number;
  y: number;
  color: string;
}

export interface Edge {
  id: string;
  label: string;
  sourceId: string;
  targetId: string;
  color: string;
  directed: boolean;
}

export interface Graph {
  id: string;
  name: string;
  description: string;
  vertices: Vertex[];
  edges: Edge[];
  createdAt: number;
  updatedAt: number;
}

export type SelectedElement =
  | { type: 'vertex'; id: string }
  | { type: 'edge'; id: string }
  | null;

export type EditorMode = 'select' | 'connect';
export type AppView = 'editor' | 'gallery';

export interface CLIEntry {
  type: 'input' | 'output' | 'error' | 'info';
  text: string;
}

export const PALETTE: Record<string, string> = {
  green: '#00ff41',
  cyan: '#00ffff',
  yellow: '#ffff00',
  red: '#ff4444',
  magenta: '#ff00ff',
  orange: '#ff8c00',
  white: '#e0e0e0',
  blue: '#4488ff',
  gray: '#888888',
  pink: '#ff88cc',
};

export const VERTEX_RADIUS = 24;
