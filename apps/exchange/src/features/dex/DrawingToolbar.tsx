import {
  CropSquare,
  DeleteOutlined,
  HorizontalRule,
  NearMeOutlined,
  ShowChart,
  Straighten,
  TextFields,
  Timeline,
} from '@mui/icons-material';
import { Divider, IconButton, Stack, Tooltip, useMediaQuery, useTheme } from '@mui/material';
import { type ReactElement } from 'react';
import { type DrawingTool } from './chart-plugins/constants';
import { Segmented } from './terminal/Segmented';

/**
 * The drawing tools, as a strip beside the timeframe controls.
 *
 * A deliberate subset. The ported layer supports eighteen tools; shipping all
 * eighteen in a row would make the common four harder to hit than they are
 * today. The rest stay reachable through the manager's own keyboard shortcuts.
 */
const TOOLS: { compact?: boolean; icon: ReactElement; label: string; value: DrawingTool }[] = [
  { icon: <NearMeOutlined fontSize="small" />, label: 'Cursor', value: 'none' },
  { icon: <ShowChart fontSize="small" />, label: 'Trend line', value: 'trendline' },
  { icon: <HorizontalRule fontSize="small" />, label: 'Horizontal line', value: 'horizontal' },
  { icon: <CropSquare fontSize="small" />, label: 'Rectangle', value: 'rectangle' },
  { icon: <Timeline fontSize="small" />, label: 'Fibonacci retracement', value: 'fibonacci' },
  // Below xl the strip is the difference between fitting and scrolling. These
  // two go first; both stay one keyboard shortcut away in the manager.
  { compact: false, icon: <Straighten fontSize="small" />, label: 'Measure', value: 'measure' },
  { compact: false, icon: <TextFields fontSize="small" />, label: 'Text', value: 'text' },
];

export function DrawingToolbar({
  count,
  onClear,
  onToolChange,
  tool,
}: {
  count: number;
  onClear: () => void;
  onToolChange: (tool: DrawingTool) => void;
  tool: DrawingTool;
}) {
  const compact = useMediaQuery(useTheme().breakpoints.down('xl'));
  const tools = compact ? TOOLS.filter((t) => t.compact !== false) : TOOLS;
  return (
    <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
      <Segmented
        ariaLabel="Drawing tools"
        onChange={onToolChange}
        options={tools.map((t) => ({ label: t.icon, title: t.label, value: t.value }))}
        value={tool}
      />

      {count > 0 && (
        <>
          <Divider flexItem orientation="vertical" sx={{ mx: 0.5, my: 0.75 }} />
          <Tooltip title={`Remove all ${count} drawing${count === 1 ? '' : 's'}`}>
            <IconButton aria-label="Clear drawings" onClick={onClear} size="small">
              <DeleteOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        </>
      )}
    </Stack>
  );
}
