import { type Theme } from '@mui/material';
import { type IChartApi, type ISeriesApi, type SeriesType } from 'lightweight-charts';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  applyChartTheme,
  chartColors,
  type DrawingLine,
  type DrawingTool,
} from './chart-plugins/constants';
import { DrawingToolsManager } from './chart-plugins/drawing-tools/manager';

/**
 * Drawings survive a reload, per pair.
 *
 * Keyed by pair because a trendline drawn on one market means nothing on
 * another, and a single shared bucket would paint every chart with every line
 * anyone had ever drawn.
 */
const keyFor = (pair: string) => `dex.drawings.${pair}`;

function load(pair: string): DrawingLine[] {
  try {
    const raw = localStorage.getItem(keyFor(pair));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as DrawingLine[]) : [];
  } catch {
    // Corrupt or unreadable storage is not worth failing a chart over. An empty
    // canvas is recoverable; a chart that will not mount is not.
    return [];
  }
}

function save(pair: string, drawings: DrawingLine[]): void {
  try {
    localStorage.setItem(keyFor(pair), JSON.stringify(drawings));
  } catch (err) {
    // Storage full or blocked (private mode). The drawing still exists on the
    // chart; only its persistence is lost, which is not worth interrupting for.
    void err;
  }
}

/**
 * Attaches the drawing layer to a chart, and keeps it alive across the chart's
 * own lifecycle.
 *
 * `attach` is called from inside the effect that creates the chart, because the
 * manager needs the series and the container that effect just made, and has to
 * be torn down with them. Everything else here is state the toolbar reads.
 */
export function useChartDrawings(pairKey: string, theme: Theme, timeframe: string) {
  const managerRef = useRef<DrawingToolsManager | null>(null);
  const drawingsRef = useRef<DrawingLine[]>([]);
  const [tool, setToolState] = useState<DrawingTool>('none');
  const [count, setCount] = useState(0);

  const commit = useCallback(
    (next: DrawingLine[]) => {
      drawingsRef.current = next;
      setCount(next.length);
      save(pairKey, next);
    },
    [pairKey],
  );

  const attach = useCallback(
    (
      chart: IChartApi,
      series: ISeriesApi<SeriesType>,
      container: HTMLElement,
      intervalSec: number,
    ) => {
      // Canvas cannot read a design token, so the theme is resolved once here and
      // written into the chrome the renderers read.
      applyChartTheme(chartColors(theme));

      const restored = load(pairKey);
      drawingsRef.current = restored;
      setCount(restored.length);

      const manager = new DrawingToolsManager({
        callbacks: {
          onAdd: (d) => commit([...drawingsRef.current, d]),
          onRemove: (id) => commit(drawingsRef.current.filter((x) => x.id !== id)),
          // The tool disarms itself once a shape is committed, matching the
          // toolbar's pressed state to what the chart will actually do next.
          onToolFinished: () => setToolState('none'),
          onUpdate: (d) => commit(drawingsRef.current.map((x) => (x.id === d.id ? d : x))),
        },
        chart,
        container,
        intervalSec,
        series,
        timeframe,
      });
      manager.setDrawings(restored);
      managerRef.current = manager;

      return () => {
        manager.destroy();
        managerRef.current = null;
      };
    },
    [commit, pairKey, theme, timeframe],
  );

  // The toolbar owns the armed tool; the manager is told after the fact so a
  // re-mounted chart picks up whatever was already selected.
  useEffect(() => {
    managerRef.current?.setTool(tool);
  }, [tool]);

  const clear = useCallback(() => {
    commit([]);
    managerRef.current?.setDrawings([]);
  }, [commit]);

  return { attach, clear, count, setTool: setToolState, tool };
}
