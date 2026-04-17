import { useRef, useState, useCallback, useEffect } from 'react';
import { useGraph } from '../store/GraphContext';
import { Vertex, Edge, VERTEX_RADIUS } from '../types';

type DragState =
  | null
  | { type: 'move'; vertexId: string; startMouseX: number; startMouseY: number; origX: number; origY: number }
  | { type: 'connect'; sourceId: string; currentX: number; currentY: number }
  | { type: 'pan'; startMouseX: number; startMouseY: number; origPanX: number; origPanY: number };

function getEdgeEndpoints(src: Vertex, dst: Vertex) {
  const dx = dst.x - src.x;
  const dy = dst.y - src.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 1) return { x1: src.x, y1: src.y, x2: dst.x, y2: dst.y };
  const nx = dx / dist;
  const ny = dy / dist;
  const pad = VERTEX_RADIUS + 2;
  return {
    x1: src.x + nx * pad,
    y1: src.y + ny * pad,
    x2: dst.x - nx * pad,
    y2: dst.y - ny * pad,
  };
}

function edgeMidpoint(src: Vertex, dst: Vertex) {
  return {
    x: (src.x + dst.x) / 2,
    y: (src.y + dst.y) / 2,
  };
}

export function GraphCanvas() {
  const { state, dispatch, addVertex, addEdge } = useGraph();
  const { currentGraph, selectedElement, editorMode } = state;
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragState, setDragState] = useState<DragState>(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const mouseDownData = useRef<{ x: number; y: number; time: number } | null>(null);

  const getSVGPoint = useCallback(
    (clientX: number, clientY: number) => {
      if (!svgRef.current) return { x: 0, y: 0 };
      const rect = svgRef.current.getBoundingClientRect();
      return {
        x: clientX - rect.left - panOffset.x,
        y: clientY - rect.top - panOffset.y,
      };
    },
    [panOffset]
  );

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragState) return;
      if (dragState.type === 'move') {
        const gx = e.clientX - dragState.startMouseX + dragState.origX;
        const gy = e.clientY - dragState.startMouseY + dragState.origY;
        dispatch({ type: 'UPDATE_VERTEX', id: dragState.vertexId, changes: { x: gx, y: gy } });
      } else if (dragState.type === 'connect') {
        const pt = getSVGPoint(e.clientX, e.clientY);
        setDragState({ ...dragState, currentX: pt.x, currentY: pt.y });
      } else if (dragState.type === 'pan') {
        const dx = e.clientX - dragState.startMouseX;
        const dy = e.clientY - dragState.startMouseY;
        setPanOffset({ x: dragState.origPanX + dx, y: dragState.origPanY + dy });
      }
    }

    function onMouseUp(e: MouseEvent) {
      if (dragState?.type === 'connect') {
        if (svgRef.current) {
          const pt = getSVGPoint(e.clientX, e.clientY);
          const target = currentGraph?.vertices.find(v => {
            const dx = v.x - pt.x;
            const dy = v.y - pt.y;
            return Math.sqrt(dx * dx + dy * dy) <= VERTEX_RADIUS + 4;
          });
          if (target && target.id !== dragState.sourceId) {
            addEdge(dragState.sourceId, target.id);
          }
        }
      }
      setDragState(null);
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragState, panOffset, currentGraph, getSVGPoint, addEdge, dispatch]);

  function onSVGMouseDown(e: React.MouseEvent<SVGSVGElement>) {
    const tag = (e.target as Element).tagName.toLowerCase();
    if (tag !== 'svg' && tag !== 'rect' && tag !== 'pattern') return;
    if (e.button !== 0) return;
    const pt = getSVGPoint(e.clientX, e.clientY);
    mouseDownData.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    setDragState({
      type: 'pan',
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      origPanX: panOffset.x,
      origPanY: panOffset.y,
    });
    void pt;
  }

  function onSVGDoubleClick(e: React.MouseEvent<SVGSVGElement>) {
    const tag = (e.target as Element).tagName.toLowerCase();
    if (tag !== 'svg' && tag !== 'rect' && tag !== 'pattern') return;
    const pt = getSVGPoint(e.clientX, e.clientY);
    addVertex(pt.x, pt.y);
    dispatch({ type: 'SELECT_ELEMENT', element: null });
  }

  function onSVGClick(e: React.MouseEvent<SVGSVGElement>) {
    const tag = (e.target as Element).tagName.toLowerCase();
    if (tag !== 'svg' && tag !== 'rect' && tag !== 'pattern') return;
    dispatch({ type: 'SELECT_ELEMENT', element: null });
  }

  function onVertexMouseDown(e: React.MouseEvent, v: Vertex) {
    e.stopPropagation();
    if (e.button !== 0) return;
    mouseDownData.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    if (editorMode === 'connect') {
      const pt = getSVGPoint(e.clientX, e.clientY);
      setDragState({ type: 'connect', sourceId: v.id, currentX: pt.x, currentY: pt.y });
    } else {
      setDragState({
        type: 'move',
        vertexId: v.id,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        origX: v.x,
        origY: v.y,
      });
    }
  }

  function onVertexClick(e: React.MouseEvent, v: Vertex) {
    e.stopPropagation();
    if (editorMode === 'connect') return;
    const md = mouseDownData.current;
    if (!md) return;
    const moved = Math.abs(e.clientX - md.x) + Math.abs(e.clientY - md.y) > 4;
    if (!moved) {
      dispatch({ type: 'SELECT_ELEMENT', element: { type: 'vertex', id: v.id } });
    }
  }

  function onEdgeClick(e: React.MouseEvent, edge: Edge) {
    e.stopPropagation();
    dispatch({ type: 'SELECT_ELEMENT', element: { type: 'edge', id: edge.id } });
  }

  if (!currentGraph) return <div className="canvas-empty">no graph loaded</div>;

  const srcVertex =
    dragState?.type === 'connect'
      ? currentGraph.vertices.find(v => v.id === dragState.sourceId)
      : null;

  return (
    <svg
      ref={svgRef}
      className="graph-canvas"
      onMouseDown={onSVGMouseDown}
      onDoubleClick={onSVGDoubleClick}
      onClick={onSVGClick}
      style={{ cursor: dragState?.type === 'pan' ? 'grabbing' : editorMode === 'connect' ? 'crosshair' : 'default' }}
    >
      <defs>
        <marker
          id="arrow-default"
          markerWidth="8"
          markerHeight="6"
          refX="7"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <polygon points="0 0, 8 3, 0 6" fill="#888888" />
        </marker>
        {currentGraph.edges
          .filter(e => e.directed)
          .map(e => (
            <marker
              key={`arrow-${e.id}`}
              id={`arrow-${e.id}`}
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <polygon
                points="0 0, 8 3, 0 6"
                fill={
                  selectedElement?.type === 'edge' && selectedElement.id === e.id
                    ? '#00ff41'
                    : e.color
                }
              />
            </marker>
          ))}
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g transform={`translate(${panOffset.x}, ${panOffset.y})`}>
        {/* Grid dots */}
        <pattern id="grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="0" cy="0" r="1" fill="#1a1a1a" />
        </pattern>
        <rect
          x={-panOffset.x - 2000}
          y={-panOffset.y - 2000}
          width="6000"
          height="6000"
          fill="url(#grid)"
        />

        {/* Edges */}
        {currentGraph.edges.map(edge => {
          const src = currentGraph.vertices.find(v => v.id === edge.sourceId);
          const dst = currentGraph.vertices.find(v => v.id === edge.targetId);
          if (!src || !dst) return null;
          const { x1, y1, x2, y2 } = getEdgeEndpoints(src, dst);
          const mid = edgeMidpoint(src, dst);
          const isSelected = selectedElement?.type === 'edge' && selectedElement.id === edge.id;
          const strokeColor = isSelected ? '#00ff41' : edge.color;
          return (
            <g key={edge.id} onClick={e => onEdgeClick(e, edge)} style={{ cursor: 'pointer' }}>
              {/* Wide invisible hit area */}
              <line
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="transparent"
                strokeWidth="12"
              />
              <line
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={strokeColor}
                strokeWidth={isSelected ? 2.5 : 1.5}
                markerEnd={edge.directed ? `url(#arrow-${edge.id})` : undefined}
                filter={isSelected ? 'url(#glow)' : undefined}
              />
              {edge.label && (
                <text
                  x={mid.x}
                  y={mid.y - 8}
                  className="edge-label"
                  fill={strokeColor}
                  textAnchor="middle"
                  fontSize="11"
                >
                  {edge.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Temp edge during connect drag */}
        {dragState?.type === 'connect' && srcVertex && (
          <line
            x1={srcVertex.x}
            y1={srcVertex.y}
            x2={dragState.currentX}
            y2={dragState.currentY}
            stroke="#00ff41"
            strokeWidth="1.5"
            strokeDasharray="6 3"
            opacity="0.7"
          />
        )}

        {/* Vertices */}
        {currentGraph.vertices.map(vertex => {
          const isSelected = selectedElement?.type === 'vertex' && selectedElement.id === vertex.id;
          return (
            <g
              key={vertex.id}
              onMouseDown={e => onVertexMouseDown(e, vertex)}
              onClick={e => onVertexClick(e, vertex)}
              style={{ cursor: editorMode === 'connect' ? 'crosshair' : 'grab' }}
            >
              {isSelected && (
                <circle
                  cx={vertex.x}
                  cy={vertex.y}
                  r={VERTEX_RADIUS + 6}
                  fill="none"
                  stroke="#00ff41"
                  strokeWidth="1"
                  strokeDasharray="4 2"
                  opacity="0.6"
                />
              )}
              <circle
                cx={vertex.x}
                cy={vertex.y}
                r={VERTEX_RADIUS}
                fill="#0c0c0c"
                stroke={isSelected ? '#00ff41' : vertex.color}
                strokeWidth={isSelected ? 2.5 : 1.5}
                filter={isSelected ? 'url(#glow)' : undefined}
              />
              <circle
                cx={vertex.x}
                cy={vertex.y}
                r={VERTEX_RADIUS - 6}
                fill={vertex.color}
                opacity="0.15"
              />
              <text
                x={vertex.x}
                y={vertex.y + 5}
                textAnchor="middle"
                fill={isSelected ? '#00ff41' : vertex.color}
                fontSize="12"
                fontFamily="'Courier New', monospace"
                fontWeight="bold"
              >
                {vertex.label}
              </text>
            </g>
          );
        })}
      </g>

      {/* Canvas hints */}
      {currentGraph.vertices.length === 0 && (
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          fill="#333333"
          fontSize="14"
          fontFamily="'Courier New', monospace"
        >
          double-click to add vertex
        </text>
      )}
    </svg>
  );
}
