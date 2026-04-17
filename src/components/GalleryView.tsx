import { useGraph } from '../store/GraphContext';
import { Graph, VERTEX_RADIUS } from '../types';

function MiniGraph({ graph }: { graph: Graph }) {
  const W = 180;
  const H = 120;

  if (graph.vertices.length === 0) {
    return (
      <svg width={W} height={H} className="mini-graph">
        <text x={W / 2} y={H / 2} textAnchor="middle" fill="#333" fontSize="11" fontFamily="monospace">
          empty graph
        </text>
      </svg>
    );
  }

  const xs = graph.vertices.map(v => v.x);
  const ys = graph.vertices.map(v => v.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const pad = 20;
  const gW = maxX - minX || 1;
  const gH = maxY - minY || 1;
  const scale = Math.min((W - pad * 2) / gW, (H - pad * 2) / gH, 1);
  const ox = (W - gW * scale) / 2 - minX * scale;
  const oy = (H - gH * scale) / 2 - minY * scale;

  const px = (x: number) => x * scale + ox;
  const py = (y: number) => y * scale + oy;
  const r = Math.max(4, VERTEX_RADIUS * scale * 0.6);

  return (
    <svg width={W} height={H} className="mini-graph">
      {graph.edges.map(e => {
        const src = graph.vertices.find(v => v.id === e.sourceId);
        const dst = graph.vertices.find(v => v.id === e.targetId);
        if (!src || !dst) return null;
        return (
          <line
            key={e.id}
            x1={px(src.x)} y1={py(src.y)}
            x2={px(dst.x)} y2={py(dst.y)}
            stroke={e.color}
            strokeWidth="1"
            opacity="0.6"
          />
        );
      })}
      {graph.vertices.map(v => (
        <circle key={v.id} cx={px(v.x)} cy={py(v.y)} r={r} fill="#0c0c0c" stroke={v.color} strokeWidth="1" />
      ))}
    </svg>
  );
}

export function GalleryView() {
  const { state, dispatch } = useGraph();
  const { graphs } = state;

  if (graphs.length === 0) {
    return (
      <div className="gallery-empty">
        <div className="gallery-empty-text">
          <div>NO SAVED GRAPHS</div>
          <div className="gallery-hint">save a graph from the editor</div>
        </div>
      </div>
    );
  }

  return (
    <div className="gallery">
      <div className="gallery-header">
        <span>GALLERY</span>
        <span className="gallery-count">{graphs.length} graph{graphs.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="gallery-grid">
        {graphs
          .slice()
          .sort((a, b) => b.updatedAt - a.updatedAt)
          .map(graph => (
            <div key={graph.id} className="gallery-card">
              <div className="card-preview">
                <MiniGraph graph={graph} />
              </div>
              <div className="card-info">
                <div className="card-name">{graph.name}</div>
                {graph.description && (
                  <div className="card-desc">{graph.description}</div>
                )}
                <div className="card-stats">
                  V:{graph.vertices.length} E:{graph.edges.length}
                  <span className="card-date">
                    {new Date(graph.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="card-actions">
                <button
                  className="card-btn"
                  onClick={() => dispatch({ type: 'LOAD_GRAPH', graph })}
                >
                  [EDIT]
                </button>
                <button
                  className="card-btn danger"
                  onClick={() => {
                    if (confirm(`Delete graph "${graph.name}"?`)) {
                      dispatch({ type: 'DELETE_GRAPH', id: graph.id });
                    }
                  }}
                >
                  [DEL]
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
