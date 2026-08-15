import { Box } from '@mui/material';
import { palette } from '@/styles/tokens';

/**
 * Diagrams for the feature cards.
 *
 * Each one is a drawing of the idea beside it rather than an icon: rings that
 * spread outward for a network with no centre, plates stacking for issuance,
 * arrows resolving for a swap. A card carrying a diagram is read; a card
 * carrying a glyph is skimmed.
 *
 * Drawn as inline SVG so they cost no request and stay within the strict CSP,
 * and stroked rather than filled so they hold up on the light canvas without
 * competing with the type.
 */

const STROKE = palette.indigoHover;
const SOFT = palette.lavenderBorder;
const FAINT = palette.lilacBorder;

/** Shared frame so every diagram occupies the same box in a card. */
function Plate({ children }: { children: React.ReactNode }) {
  return (
    <Box
      aria-hidden="true"
      sx={{ display: 'block', lineHeight: 0, width: '100%' }}
      component="svg"
      viewBox="0 0 200 150"
      preserveAspectRatio="xMidYMid meet"
    >
      {children}
    </Box>
  );
}

/** Rings spreading from a centre that is only a point — no custodian. */
export function RingsDiagram() {
  return (
    <Plate>
      <title>Concentric rings</title>
      {[10, 22, 34, 46, 58].map((r, i) => (
        <circle
          key={r}
          cx="100"
          cy="75"
          r={r}
          fill="none"
          stroke={i % 2 === 0 ? STROKE : SOFT}
          strokeWidth={i === 0 ? 1.6 : 1}
          opacity={1 - i * 0.14}
        />
      ))}
      <circle cx="100" cy="75" r="3" fill={STROKE} />
    </Plate>
  );
}

/** Plates stacking, each a new asset on the same chain. */
export function StackDiagram() {
  return (
    <Plate>
      <title>Stacked plates</title>
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={`plate-${i}`}
          x={62 + i * 12}
          y={100 - i * 20}
          width="76"
          height="34"
          rx="4"
          fill="none"
          stroke={i === 3 ? STROKE : SOFT}
          strokeWidth={i === 3 ? 1.6 : 1}
        />
      ))}
    </Plate>
  );
}

/** Two streams meeting and resolving — an order matched. */
export function FlowDiagram() {
  return (
    <Plate>
      <title>Converging flow</title>
      {[0, 1, 2, 3].map((row) => (
        <g key={`row-${row}`} opacity={1 - row * 0.18}>
          <path
            d={`M ${46 + row * 6} ${48 + row * 18} l 16 12 l -16 12`}
            fill="none"
            stroke={STROKE}
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={`M ${154 - row * 6} ${48 + row * 18} l -16 12 l 16 12`}
            fill="none"
            stroke={SOFT}
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      ))}
      <line
        x1="100"
        y1="34"
        x2="100"
        y2="116"
        stroke={FAINT}
        strokeWidth="1"
        strokeDasharray="3 4"
      />
    </Plate>
  );
}

/**
 * A held balance compounding — leasing.
 *
 * Positions are computed once rather than during render so each dot carries a
 * stable identity of its own.
 */
const GROWTH_DOTS = [0, 1, 2, 3, 4].flatMap((col) =>
  Array.from({ length: col + 1 }, (_, row) => ({
    cap: row === col,
    cx: 56 + col * 22,
    cy: 112 - row * 18,
  })),
);

export function GrowthDiagram() {
  return (
    <Plate>
      <title>Compounding steps</title>
      {GROWTH_DOTS.map((dot) => (
        <circle
          key={`${dot.cx}-${dot.cy}`}
          cx={dot.cx}
          cy={dot.cy}
          r="4.5"
          fill={dot.cap ? STROKE : 'none'}
          stroke={dot.cap ? STROKE : SOFT}
          strokeWidth="1.2"
        />
      ))}
    </Plate>
  );
}

/** A key enclosed — signing that never leaves the device. */
export function ShieldDiagram() {
  return (
    <Plate>
      <title>Enclosed key</title>
      <path
        d="M100 26 L146 44 V80 C146 104 126 118 100 126 C74 118 54 104 54 80 V44 Z"
        fill="none"
        stroke={STROKE}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M100 40 L134 53 V80 C134 97 119 108 100 114 C81 108 66 97 66 80 V53 Z"
        fill="none"
        stroke={SOFT}
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <circle cx="100" cy="72" r="9" fill="none" stroke={STROKE} strokeWidth="1.4" />
      <line
        x1="100"
        y1="81"
        x2="100"
        y2="96"
        stroke={STROKE}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </Plate>
  );
}

/** Peers holding the same ledger, none of them the centre. */
export function NodesDiagram() {
  const peers = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
    return { x: 100 + Math.cos(angle) * 46, y: 75 + Math.sin(angle) * 46 };
  });
  return (
    <Plate>
      <title>Peer network</title>
      {peers.map((a, i) =>
        peers
          .slice(i + 1)
          .map((b) => (
            <line
              key={`${a.x}-${b.x}-${b.y}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={FAINT}
              strokeWidth="0.8"
            />
          )),
      )}
      {peers.map((peer, i) => (
        <circle
          key={`${peer.x}-${peer.y}`}
          cx={peer.x}
          cy={peer.y}
          r="6"
          fill={i === 0 ? STROKE : 'none'}
          stroke={STROKE}
          strokeWidth="1.4"
        />
      ))}
    </Plate>
  );
}
