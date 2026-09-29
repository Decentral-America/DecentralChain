# Chart plugins

Ported from [OpenCharts](https://github.com/dylanpersonguy/OpenCharts) (MIT,
© 2024 OpenCharts Contributors), which builds them on `lightweight-charts` —
the same engine this app already uses.

These are engine-level: they attach to a series or a chart as
`ISeriesPrimitive`/pane views and draw on the canvas. Nothing here imports
React, MUI, Radix or Tailwind, which is why they port without dragging a second
design system in behind them.

OpenCharts targets `lightweight-charts@4`; this app is on `5`. The v5 break is
in *series creation* (`addCandlestickSeries` became `addSeries(CandlestickSeries, …)`),
and these files create no series, so the primitive API they use carries over.
Anything that did need adjusting is marked with a `v5:` comment.
