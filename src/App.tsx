import { useCallback, useState } from 'react';
import { GraphProvider } from './store/GraphContext';
import { useGraph } from './store/GraphContext';
import { LeftSidebar } from './components/LeftSidebar';
import { GraphCanvas } from './components/GraphCanvas';
import { RightSidebar } from './components/RightSidebar';
import { GalleryView } from './components/GalleryView';
import { CLI } from './components/CLI';

const CLAMP = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function Layout() {
  const { state } = useGraph();
  const [leftWidth, setLeftWidth] = useState(200);
  const [rightWidth, setRightWidth] = useState(240);
  const [cliHeight, setCliHeight] = useState(180);

  const rightOpen = !!state.selectedElement;

  const onLeftResize = useCallback((d: number) => setLeftWidth(w => CLAMP(w + d, 120, 520)), []);
  const onRightResize = useCallback((d: number) => setRightWidth(w => CLAMP(w + d, 160, 600)), []);
  const onCLIResize = useCallback((d: number) => setCliHeight(h => CLAMP(h - d, 80, 520)), []);

  return (
    <div
      className="app-layout"
      style={{
        gridTemplateColumns: `${leftWidth}px 1fr ${rightOpen ? rightWidth + 'px' : '0px'}`,
        gridTemplateRows: `1fr ${cliHeight}px`,
      }}
    >
      <LeftSidebar onResize={onLeftResize} />
      <main className="main-area">
        {state.view === 'editor' && <GraphCanvas />}
        {state.view === 'gallery' && <GalleryView />}
      </main>
      <RightSidebar onResize={onRightResize} />
      <CLI onResize={onCLIResize} />
    </div>
  );
}

export default function App() {
  return (
    <GraphProvider>
      <Layout />
    </GraphProvider>
  );
}
