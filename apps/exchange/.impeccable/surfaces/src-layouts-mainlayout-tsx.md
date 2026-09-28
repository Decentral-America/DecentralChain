---
version: 1
slug: "src-layouts-mainlayout-tsx"
primary_target: "src/layouts/MainLayout.tsx"
related_targets: ["src/pages","src/features","src/components"]
---

# Surface brief: DecentralExchange app (every route)

Scope: the whole authenticated app, onboarding and landing. Mode: Operate (landing is Persuade inside the same world).
Audience and job: DCC holders of mixed skill checking balances, sending, swapping, and occasionally trading. Clarity beats density.
Constraints: MUI 7 + styled-components stay; 21st.dev components are ported into styled-components + motion, never Tailwind. CSP allows fonts only from self/data. 17 languages. Light and dark both ship. No invented metrics.
Pinned by the user: premium, clean, Apple-quality craft; replace generic components with premium ones sourced from 21st.dev. Reference products for the craft bar: Apple Wallet and Stocks, macOS System Settings, Uniswap's swap card. The concept roll (seed 4a0080ea) dealt surreal challengers; they were declined because the user pinned the world, and the pin wins.

## Direction contract

THESIS: A precision instrument, not a dashboard template. Numbers are the hero and chrome recedes into material. It refuses the category default of flat indigo SaaS cards and grey skeleton boxes.

OWN-WORLD: Apple neutral ground (#f5f5f7 light, #000/#1c1c1e dark), white and graphite surfaces lifted by soft two-layer shadows (a hairline in dark mode only), 16px card and 10px control radii, a translucent vibrancy top bar. SF Pro through the system stack with self-hosted Inter as the fallback, semibold titles and regular body, tabular numerals everywhere. One accent, the logo's indigo, reserved for primary action and selection. System green and red for buy and sell.

STORY: The holder sees what they own at a glance, trusts every figure, and reaches send, swap or trade in one move without wondering what they are signing.

FIRST VIEWPORT: Wallet home: a large-title greeting, then a hero balance with rolling digits and a spark area chart spanning two-thirds, and quick actions as pressable tiles in the right third. Assets follow as a grouped inset list.

FORM: Apple HIG-grade Operate UI (canon played at full fidelity, per the user's pin). Signature interaction: the spring-sliding selection pill shared by the top nav, every tab and segmented control, and buy/sell, plus rolling digits on every balance and price. Seed key 4a0080ea.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
