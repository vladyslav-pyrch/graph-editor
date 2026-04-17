import { useGraph } from '../store/GraphContext';
import { PALETTE } from '../types';
import { ResizeHandle } from './ResizeHandle';

interface RightSidebarProps {
  onResize: (delta: number) => void;
}

export function RightSidebar({ onResize }: RightSidebarProps) {
  const { state, dispatch } = useGraph();
  const { selectedElement, currentGraph } = state;

  if (!selectedElement || !currentGraph) return null;

  if (selectedElement.type === 'vertex') {
    const vertex = currentGraph.vertices.find(v => v.id === selectedElement.id);
    if (!vertex) return null;

    return (
      <aside className="right-sidebar open" style={{ position: 'relative' }}>
        <ResizeHandle direction="left" onResize={onResize} />
        <div className="sidebar-header">
          <span className="sidebar-title">VERTEX</span>
          <button
            className="close-btn"
            onClick={() => dispatch({ type: 'SELECT_ELEMENT', element: null })}
          >
            [X]
          </button>
        </div>

        <div className="prop-section">
          <div className="prop-label">ID</div>
          <div className="prop-value mono">{vertex.id}</div>
        </div>

        <div className="prop-section">
          <div className="prop-label">LABEL</div>
          <input
            className="prop-input"
            value={vertex.label}
            onChange={e =>
              dispatch({ type: 'UPDATE_VERTEX', id: vertex.id, changes: { label: e.target.value } })
            }
          />
        </div>

        <div className="prop-section">
          <div className="prop-label">POSITION</div>
          <div className="prop-row">
            <span className="prop-coord-label">X:</span>
            <input
              className="prop-input prop-coord"
              type="number"
              value={Math.round(vertex.x)}
              onChange={e =>
                dispatch({
                  type: 'UPDATE_VERTEX',
                  id: vertex.id,
                  changes: { x: parseFloat(e.target.value) || 0 },
                })
              }
            />
            <span className="prop-coord-label">Y:</span>
            <input
              className="prop-input prop-coord"
              type="number"
              value={Math.round(vertex.y)}
              onChange={e =>
                dispatch({
                  type: 'UPDATE_VERTEX',
                  id: vertex.id,
                  changes: { y: parseFloat(e.target.value) || 0 },
                })
              }
            />
          </div>
        </div>

        <div className="prop-section">
          <div className="prop-label">COLOR</div>
          <div className="color-palette">
            {Object.entries(PALETTE).map(([name, hex]) => (
              <button
                key={name}
                className={`color-swatch ${vertex.color === hex ? 'active' : ''}`}
                style={{ background: hex }}
                title={name}
                onClick={() =>
                  dispatch({ type: 'UPDATE_VERTEX', id: vertex.id, changes: { color: hex } })
                }
              />
            ))}
          </div>
          <input
            className="prop-input color-hex-input"
            value={vertex.color}
            onChange={e =>
              dispatch({ type: 'UPDATE_VERTEX', id: vertex.id, changes: { color: e.target.value } })
            }
            placeholder="#rrggbb"
          />
        </div>

        <div className="prop-section">
          <div className="prop-label">CONNECTIONS</div>
          <div className="prop-connections">
            {currentGraph.edges
              .filter(e => e.sourceId === vertex.id || e.targetId === vertex.id)
              .map(e => {
                const otherId = e.sourceId === vertex.id ? e.targetId : e.sourceId;
                const other = currentGraph.vertices.find(v => v.id === otherId);
                return (
                  <div key={e.id} className="prop-connection-item">
                    <span style={{ color: e.color }}>{e.label}</span>
                    <span className="conn-arrow"> → </span>
                    <span style={{ color: other?.color ?? '#888' }}>{other?.label ?? '?'}</span>
                  </div>
                );
              })}
            {currentGraph.edges.filter(e => e.sourceId === vertex.id || e.targetId === vertex.id).length === 0 && (
              <span className="prop-empty">no connections</span>
            )}
          </div>
        </div>

        <div className="prop-actions">
          <button
            className="danger-btn"
            onClick={() => dispatch({ type: 'REMOVE_VERTEX', id: vertex.id })}
          >
            [DELETE VERTEX]
          </button>
        </div>
      </aside>
    );
  }

  if (selectedElement.type === 'edge') {
    const edge = currentGraph.edges.find(e => e.id === selectedElement.id);
    if (!edge) return null;
    const src = currentGraph.vertices.find(v => v.id === edge.sourceId);
    const dst = currentGraph.vertices.find(v => v.id === edge.targetId);

    return (
      <aside className="right-sidebar open" style={{ position: 'relative' }}>
        <ResizeHandle direction="left" onResize={onResize} />
        <div className="sidebar-header">
          <span className="sidebar-title">EDGE</span>
          <button
            className="close-btn"
            onClick={() => dispatch({ type: 'SELECT_ELEMENT', element: null })}
          >
            [X]
          </button>
        </div>

        <div className="prop-section">
          <div className="prop-label">ID</div>
          <div className="prop-value mono">{edge.id}</div>
        </div>

        <div className="prop-section">
          <div className="prop-label">LABEL</div>
          <input
            className="prop-input"
            value={edge.label}
            onChange={e =>
              dispatch({ type: 'UPDATE_EDGE', id: edge.id, changes: { label: e.target.value } })
            }
          />
        </div>

        <div className="prop-section">
          <div className="prop-label">ENDPOINTS</div>
          <div className="endpoint-display">
            <span style={{ color: src?.color ?? '#888' }}>{src?.label ?? '?'}</span>
            <span className="endpoint-arrow">{edge.directed ? ' ──▶ ' : ' ─── '}</span>
            <span style={{ color: dst?.color ?? '#888' }}>{dst?.label ?? '?'}</span>
          </div>
        </div>

        <div className="prop-section">
          <div className="prop-label">DIRECTED</div>
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={edge.directed}
              onChange={e =>
                dispatch({ type: 'UPDATE_EDGE', id: edge.id, changes: { directed: e.target.checked } })
              }
            />
            <span className="toggle-text">{edge.directed ? '[ON]' : '[OFF]'}</span>
          </label>
        </div>

        <div className="prop-section">
          <div className="prop-label">COLOR</div>
          <div className="color-palette">
            {Object.entries(PALETTE).map(([name, hex]) => (
              <button
                key={name}
                className={`color-swatch ${edge.color === hex ? 'active' : ''}`}
                style={{ background: hex }}
                title={name}
                onClick={() =>
                  dispatch({ type: 'UPDATE_EDGE', id: edge.id, changes: { color: hex } })
                }
              />
            ))}
          </div>
          <input
            className="prop-input color-hex-input"
            value={edge.color}
            onChange={e =>
              dispatch({ type: 'UPDATE_EDGE', id: edge.id, changes: { color: e.target.value } })
            }
            placeholder="#rrggbb"
          />
        </div>

        <div className="prop-actions">
          <button
            className="danger-btn"
            onClick={() => dispatch({ type: 'REMOVE_EDGE', id: edge.id })}
          >
            [DELETE EDGE]
          </button>
        </div>
      </aside>
    );
  }

  return null;
}
