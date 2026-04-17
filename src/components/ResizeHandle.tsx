import { useCallback } from 'react';

interface ResizeHandleProps {
  direction: 'left' | 'right' | 'top';
  onResize: (delta: number) => void;
}

export function ResizeHandle({ direction, onResize }: ResizeHandleProps) {
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const axis = direction === 'top' ? 'y' : 'x';
      const sign = direction === 'left' ? -1 : 1;
      let last = axis === 'x' ? e.clientX : e.clientY;

      function onMove(ev: MouseEvent) {
        const cur = axis === 'x' ? ev.clientX : ev.clientY;
        const delta = (cur - last) * sign;
        last = cur;
        onResize(delta);
      }

      function onUp() {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }

      document.body.style.cursor = direction === 'top' ? 'ns-resize' : 'ew-resize';
      document.body.style.userSelect = 'none';
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [direction, onResize]
  );

  return <div className={`resize-handle resize-handle-${direction}`} onMouseDown={onMouseDown} />;
}
