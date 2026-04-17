import { useState } from 'react';
import { useGraph } from '../store/GraphContext';
import { ResizeHandle } from './ResizeHandle';

interface LeftSidebarProps {
  onResize: (delta: number) => void;
}

export function LeftSidebar({ onResize }: LeftSidebarProps) {
  const { state, dispatch } = useGraph();
  const { view, editorMode, currentGraph } = state;
  const [saving, setSaving] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDesc, setSaveDesc] = useState('');

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    dispatch({
      type: 'SAVE_CURRENT_GRAPH',
      name: saveName || (currentGraph?.name ?? 'untitled'),
      description: saveDesc || (currentGraph?.description ?? ''),
    });
    setSaving(false);
    setSaveName('');
    setSaveDesc('');
  }

  function startSave() {
    setSaveName(currentGraph?.name ?? '');
    setSaveDesc(currentGraph?.description ?? '');
    setSaving(true);
  }

  return (
    <aside className="left-sidebar" style={{ position: 'relative' }}>
      <ResizeHandle direction="right" onResize={onResize} />
      <div className="sidebar-header">
        <span className="sidebar-title">GRAPH//EDITOR</span>
      </div>

      <nav className="sidebar-nav">
        <button
          className={`nav-btn ${view === 'editor' ? 'active' : ''}`}
          onClick={() => dispatch({ type: 'NEW_GRAPH' })}
        >
          [NEW GRAPH]
        </button>
        <button
          className={`nav-btn ${view === 'gallery' ? 'active' : ''}`}
          onClick={() => dispatch({ type: 'SET_VIEW', view: 'gallery' })}
        >
          [GALLERY] {state.graphs.length > 0 && <span className="badge">{state.graphs.length}</span>}
        </button>
      </nav>

      {view === 'editor' && (
        <>
          <div className="sidebar-section">
            <div className="section-label">-- MODE --</div>
            <button
              className={`mode-btn ${editorMode === 'select' ? 'active' : ''}`}
              onClick={() => dispatch({ type: 'SET_MODE', mode: 'select' })}
            >
              [SELECT]
            </button>
            <button
              className={`mode-btn ${editorMode === 'connect' ? 'active' : ''}`}
              onClick={() => dispatch({ type: 'SET_MODE', mode: 'connect' })}
            >
              [CONNECT]
            </button>
          </div>

          <div className="sidebar-section mode-hint">
            {editorMode === 'select' && (
              <>
                <div>dbl-click: new vertex</div>
                <div>drag: move vertex</div>
                <div>click: select</div>
              </>
            )}
            {editorMode === 'connect' && (
              <>
                <div>drag vertex→vertex</div>
                <div>to create edge</div>
              </>
            )}
          </div>

          <div className="sidebar-section">
            <div className="section-label">-- GRAPH --</div>
            {currentGraph && (
              <div className="graph-info">
                <div className="graph-name">{currentGraph.name}</div>
                <div className="graph-stats">
                  V:{currentGraph.vertices.length} E:{currentGraph.edges.length}
                </div>
              </div>
            )}
            {!saving ? (
              <button className="save-btn" onClick={startSave}>
                [SAVE]
              </button>
            ) : (
              <form className="save-form" onSubmit={handleSave}>
                <input
                  className="cli-input-field"
                  value={saveName}
                  onChange={e => setSaveName(e.target.value)}
                  placeholder="name"
                  autoFocus
                />
                <input
                  className="cli-input-field"
                  value={saveDesc}
                  onChange={e => setSaveDesc(e.target.value)}
                  placeholder="description"
                />
                <div className="save-form-actions">
                  <button type="submit" className="save-btn">[OK]</button>
                  <button type="button" className="save-btn" onClick={() => setSaving(false)}>
                    [X]
                  </button>
                </div>
              </form>
            )}
          </div>
        </>
      )}
    </aside>
  );
}
