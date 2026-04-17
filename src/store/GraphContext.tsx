import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from 'react';
import { Graph, Vertex, Edge, SelectedElement, EditorMode, AppView } from '../types';
import { generateId } from '../utils/id';

interface AppState {
  graphs: Graph[];
  currentGraph: Graph | null;
  selectedElement: SelectedElement;
  editorMode: EditorMode;
  view: AppView;
}

type Action =
  | { type: 'SET_VIEW'; view: AppView }
  | { type: 'NEW_GRAPH' }
  | { type: 'LOAD_GRAPH'; graph: Graph }
  | { type: 'SAVE_CURRENT_GRAPH'; name: string; description: string }
  | { type: 'DELETE_GRAPH'; id: string }
  | { type: 'ADD_VERTEX'; vertex: Vertex }
  | { type: 'UPDATE_VERTEX'; id: string; changes: Partial<Vertex> }
  | { type: 'REMOVE_VERTEX'; id: string }
  | { type: 'ADD_EDGE'; edge: Edge }
  | { type: 'UPDATE_EDGE'; id: string; changes: Partial<Edge> }
  | { type: 'REMOVE_EDGE'; id: string }
  | { type: 'SELECT_ELEMENT'; element: SelectedElement }
  | { type: 'SET_MODE'; mode: EditorMode }
  | { type: 'UPDATE_CURRENT_META'; name?: string; description?: string }
  | { type: 'CLEAR_GRAPH' }
  | { type: 'SET_CURRENT_GRAPH'; graph: Graph };

function makeEmptyGraph(): Graph {
  return {
    id: generateId(),
    name: 'untitled',
    description: '',
    vertices: [],
    edges: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, view: action.view, selectedElement: null };

    case 'NEW_GRAPH':
      return {
        ...state,
        currentGraph: makeEmptyGraph(),
        selectedElement: null,
        editorMode: 'select',
        view: 'editor',
      };

    case 'LOAD_GRAPH':
      return {
        ...state,
        currentGraph: { ...action.graph },
        selectedElement: null,
        editorMode: 'select',
        view: 'editor',
      };

    case 'SAVE_CURRENT_GRAPH': {
      if (!state.currentGraph) return state;
      const saved: Graph = {
        ...state.currentGraph,
        name: action.name || state.currentGraph.name,
        description: action.description,
        updatedAt: Date.now(),
      };
      const exists = state.graphs.find(g => g.id === saved.id);
      const graphs = exists
        ? state.graphs.map(g => (g.id === saved.id ? saved : g))
        : [...state.graphs, saved];
      return { ...state, graphs, currentGraph: saved };
    }

    case 'DELETE_GRAPH':
      return { ...state, graphs: state.graphs.filter(g => g.id !== action.id) };

    case 'ADD_VERTEX': {
      if (!state.currentGraph) return state;
      return {
        ...state,
        currentGraph: {
          ...state.currentGraph,
          vertices: [...state.currentGraph.vertices, action.vertex],
          updatedAt: Date.now(),
        },
      };
    }

    case 'UPDATE_VERTEX': {
      if (!state.currentGraph) return state;
      return {
        ...state,
        currentGraph: {
          ...state.currentGraph,
          vertices: state.currentGraph.vertices.map(v =>
            v.id === action.id ? { ...v, ...action.changes } : v
          ),
          updatedAt: Date.now(),
        },
      };
    }

    case 'REMOVE_VERTEX': {
      if (!state.currentGraph) return state;
      const selectedEl =
        state.selectedElement?.type === 'vertex' && state.selectedElement.id === action.id
          ? null
          : state.selectedElement;
      return {
        ...state,
        selectedElement: selectedEl,
        currentGraph: {
          ...state.currentGraph,
          vertices: state.currentGraph.vertices.filter(v => v.id !== action.id),
          edges: state.currentGraph.edges.filter(
            e => e.sourceId !== action.id && e.targetId !== action.id
          ),
          updatedAt: Date.now(),
        },
      };
    }

    case 'ADD_EDGE': {
      if (!state.currentGraph) return state;
      return {
        ...state,
        currentGraph: {
          ...state.currentGraph,
          edges: [...state.currentGraph.edges, action.edge],
          updatedAt: Date.now(),
        },
      };
    }

    case 'UPDATE_EDGE': {
      if (!state.currentGraph) return state;
      return {
        ...state,
        currentGraph: {
          ...state.currentGraph,
          edges: state.currentGraph.edges.map(e =>
            e.id === action.id ? { ...e, ...action.changes } : e
          ),
          updatedAt: Date.now(),
        },
      };
    }

    case 'REMOVE_EDGE': {
      if (!state.currentGraph) return state;
      const selectedEl =
        state.selectedElement?.type === 'edge' && state.selectedElement.id === action.id
          ? null
          : state.selectedElement;
      return {
        ...state,
        selectedElement: selectedEl,
        currentGraph: {
          ...state.currentGraph,
          edges: state.currentGraph.edges.filter(e => e.id !== action.id),
          updatedAt: Date.now(),
        },
      };
    }

    case 'SELECT_ELEMENT':
      return { ...state, selectedElement: action.element };

    case 'SET_MODE':
      return { ...state, editorMode: action.mode };

    case 'UPDATE_CURRENT_META': {
      if (!state.currentGraph) return state;
      return {
        ...state,
        currentGraph: {
          ...state.currentGraph,
          ...(action.name !== undefined && { name: action.name }),
          ...(action.description !== undefined && { description: action.description }),
        },
      };
    }

    case 'CLEAR_GRAPH':
      return {
        ...state,
        currentGraph: makeEmptyGraph(),
        selectedElement: null,
      };

    case 'SET_CURRENT_GRAPH':
      return { ...state, currentGraph: action.graph, selectedElement: null };

    default:
      return state;
  }
}

const STORAGE_KEY = 'graph-editor-state';

function loadFromStorage(): Partial<AppState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return { graphs: parsed.graphs ?? [] };
  } catch {
    return {};
  }
}

function saveToStorage(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ graphs: state.graphs }));
  } catch {
    // ignore storage errors
  }
}

const initialState: AppState = {
  graphs: loadFromStorage().graphs ?? [],
  currentGraph: makeEmptyGraph(),
  selectedElement: null,
  editorMode: 'select',
  view: 'editor',
};

interface GraphContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  addVertex: (x: number, y: number) => void;
  addEdge: (sourceId: string, targetId: string) => void;
}

const GraphContext = createContext<GraphContextValue | null>(null);

export function GraphProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    saveToStorage(state);
  }, [state.graphs]);

  const addVertex = useCallback(
    (x: number, y: number) => {
      if (!state.currentGraph) return;
      const count = state.currentGraph.vertices.length + 1;
      const vertex: Vertex = {
        id: generateId(),
        label: `V${count}`,
        x,
        y,
        color: '#00ff41',
      };
      dispatch({ type: 'ADD_VERTEX', vertex });
    },
    [state.currentGraph]
  );

  const addEdge = useCallback(
    (sourceId: string, targetId: string) => {
      if (!state.currentGraph) return;
      if (sourceId === targetId) return;
      const exists = state.currentGraph.edges.some(
        e =>
          (e.sourceId === sourceId && e.targetId === targetId) ||
          (e.sourceId === targetId && e.targetId === sourceId)
      );
      if (exists) return;
      const count = state.currentGraph.edges.length + 1;
      const edge: Edge = {
        id: generateId(),
        label: `E${count}`,
        sourceId,
        targetId,
        color: '#888888',
        directed: false,
      };
      dispatch({ type: 'ADD_EDGE', edge });
    },
    [state.currentGraph]
  );

  return (
    <GraphContext.Provider value={{ state, dispatch, addVertex, addEdge }}>
      {children}
    </GraphContext.Provider>
  );
}

export function useGraph() {
  const ctx = useContext(GraphContext);
  if (!ctx) throw new Error('useGraph must be used within GraphProvider');
  return ctx;
}
