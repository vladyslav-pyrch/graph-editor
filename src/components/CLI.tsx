import { useState, useRef, useEffect, useMemo } from 'react';
import { useGraph } from '../store/GraphContext';
import { CLIEntry, PALETTE } from '../types';
import { parseCommand } from '../utils/cli';
import { getSuggestions, CommandDef, KNOWN_COMMANDS, KNOWN_SUBCOMMANDS, KNOWN_COLORS } from '../utils/cliDefs';
import { ResizeHandle } from './ResizeHandle';

const BOOT_MESSAGES: CLIEntry[] = [
  { type: 'info', text: 'GRAPH//EDITOR v1.0.0' },
  { type: 'info', text: 'type "help" for commands  |  Tab to complete  |  ↑↓ navigate' },
];

// ── Syntax highlighting ───────────────────────────────────────────────────────

const COLOR_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(PALETTE).map(([name, hex]) => [name, hex])
);

function highlightInput(input: string): React.ReactNode {
  if (!input) return null;
  const parts = input.split(/(\s+)/);
  let nonSpaceIdx = 0;
  return parts.map((part, i) => {
    if (/^\s+$/.test(part)) return <span key={i}>{part}</span>;
    const idx = nonSpaceIdx++;
    if (idx === 0) {
      const color = KNOWN_COMMANDS.includes(part.toLowerCase()) ? '#00ff41' : '#ff4444';
      return <span key={i} style={{ color }}>{part}</span>;
    }
    if (idx === 1 && KNOWN_SUBCOMMANDS.includes(part.toLowerCase())) {
      return <span key={i} style={{ color: '#00ffff' }}>{part}</span>;
    }
    if (/^#[0-9a-f]{3,6}$/i.test(part)) {
      return <span key={i} style={{ color: part }}>{part}</span>;
    }
    if (KNOWN_COLORS.includes(part.toLowerCase()) && COLOR_MAP[part.toLowerCase()]) {
      return <span key={i} style={{ color: COLOR_MAP[part.toLowerCase()] }}>{part}</span>;
    }
    if (part === 'true' || part === 'false') {
      return <span key={i} style={{ color: '#ff8c00' }}>{part}</span>;
    }
    return <span key={i} style={{ color: '#cccccc' }}>{part}</span>;
  });
}

// ── CLI Component ─────────────────────────────────────────────────────────────

interface CLIProps {
  onResize: (delta: number) => void;
}

export function CLI({ onResize }: CLIProps) {
  const { state, dispatch } = useGraph();
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<CLIEntry[]>(BOOT_MESSAGES);
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [suggestionIdx, setSuggestionIdx] = useState(-1);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(
    () => getSuggestions(input, state.graphs),
    [input, state.graphs]
  );

  // Auto-scroll output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [history]);

  // Reset suggestion index when suggestions change
  useEffect(() => {
    setSuggestionIdx(-1);
  }, [suggestions.length]);

  function submit() {
    const trimmed = input.trim();
    if (!trimmed) return;

    setHistory(h => [...h, { type: 'input', text: `> ${trimmed}` }]);
    setCmdHistory(h => [trimmed, ...h.slice(0, 99)]);
    setHistoryIdx(-1);
    setInput('');

    const result = parseCommand(trimmed, state.currentGraph, state.graphs);

    if (result.shouldNew) {
      dispatch({ type: 'NEW_GRAPH' });
    } else if (result.shouldClear) {
      dispatch({ type: 'CLEAR_GRAPH' });
    } else if (result.shouldLoad) {
      const graph = state.graphs.find(g => g.id === result.shouldLoad);
      if (graph) dispatch({ type: 'LOAD_GRAPH', graph });
    } else if (result.graphMutation && state.currentGraph) {
      const next = result.graphMutation(state.currentGraph);
      dispatch({ type: 'SET_CURRENT_GRAPH', graph: next });
    }

    if (result.metaMutation) {
      dispatch({ type: 'UPDATE_CURRENT_META', ...result.metaMutation });
    }

    if (result.shouldSave && state.currentGraph) {
      const name = result.metaMutation?.name ?? state.currentGraph.name;
      const description = result.metaMutation?.description ?? state.currentGraph.description;
      dispatch({ type: 'SAVE_CURRENT_GRAPH', name, description });
    }

    if (result.output) {
      setHistory(h => [
        ...h,
        { type: result.error ? 'error' : 'output', text: result.output },
      ]);
    }
  }

  function fillSuggestion(def: CommandDef) {
    setInput(def.syntax + ' ');
    setSuggestionIdx(-1);
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    // Suggestions navigation takes priority when suggestions visible
    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSuggestionIdx(i => Math.min(i + 1, suggestions.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSuggestionIdx(i => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        const pick = suggestions[suggestionIdx >= 0 ? suggestionIdx : 0];
        if (pick) fillSuggestion(pick);
        return;
      }
      if (e.key === 'Enter' && suggestionIdx >= 0) {
        e.preventDefault();
        fillSuggestion(suggestions[suggestionIdx]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setInput('');
        setSuggestionIdx(-1);
        return;
      }
    }

    // CMD history navigation
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(historyIdx + 1, cmdHistory.length - 1);
      setHistoryIdx(next);
      setInput(cmdHistory[next] ?? '');
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = historyIdx - 1;
      if (next < 0) {
        setHistoryIdx(-1);
        setInput('');
      } else {
        setHistoryIdx(next);
        setInput(cmdHistory[next] ?? '');
      }
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      return;
    }
    if (e.key === 'Enter') {
      submit();
    }
  }

  const highlighted = highlightInput(input);
  const activeSuggestion = suggestionIdx >= 0 ? suggestions[suggestionIdx] : null;

  return (
    <div className="cli-panel" onClick={() => inputRef.current?.focus()}>
      <ResizeHandle direction="top" onResize={onResize} />

      <div className="cli-output" ref={outputRef}>
        {history.map((entry, i) => (
          <div key={i} className={`cli-line cli-${entry.type}`}>
            {entry.text.split('\n').map((line, j) => (
              <div key={j}>{line || '\u00a0'}</div>
            ))}
          </div>
        ))}
      </div>

      {/* Suggestions popup */}
      {suggestions.length > 0 && (
        <div className="cli-suggestions">
          <div className="sug-list">
            {suggestions.map((s, i) => (
              <div
                key={s.key}
                className={`sug-item ${i === suggestionIdx ? 'active' : ''}`}
                onMouseDown={e => { e.preventDefault(); fillSuggestion(s); }}
              >
                <span className="sug-usage">{s.usage}</span>
              </div>
            ))}
          </div>
          {activeSuggestion && (
            <div className="sug-detail">
              <span className="sug-detail-usage">{activeSuggestion.usage}</span>
              <span className="sug-detail-desc">{activeSuggestion.description}</span>
            </div>
          )}
        </div>
      )}

      <div className="cli-input-row">
        <span className="cli-prompt">
          {state.currentGraph?.name ?? 'graph'}
          <span className="cli-prompt-symbol">&gt;</span>
        </span>
        <div className="cli-input-wrapper">
          <div className="cli-highlight-overlay" aria-hidden="true">
            {highlighted}
          </div>
          <input
            ref={inputRef}
            className="cli-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
          />
        </div>
      </div>
    </div>
  );
}
