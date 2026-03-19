# Software Requirements Specification

## DecentralScan — Blockchain Explorer for DecentralChain (DCC)

| | |
|---|---|
| **Document Version** | 1.0.0 |
| **Date** | 2026-03-18 |
| **Status** | Draft |
| **Product** | DecentralScan |
| **Repository** | `apps/scanner` within the DecentralChain SDK monorepo |

### Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0.0 | 2026-03-18 | — | Initial release |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Overview](#2-system-overview)
3. [Definitions & Acronyms](#3-definitions--acronyms)
4. [Constraints & Assumptions](#4-constraints--assumptions)
5. [Module Requirements](#5-module-requirements)
   - 5.1 [MOD-HOME: Landing Page](#51-mod-home-landing-page)
   - 5.2 [MOD-DASH: Network Dashboard](#52-mod-dash-network-dashboard)
   - 5.3 [MOD-BLOCKS: Block Browser](#53-mod-blocks-block-browser)
   - 5.4 [MOD-BFEED: Live Block Feed](#54-mod-bfeed-live-block-feed)
   - 5.5 [MOD-TX: Transaction Explorer](#55-mod-tx-transaction-explorer)
   - 5.6 [MOD-TXMAP: Transaction Flow Map](#56-mod-txmap-transaction-flow-map)
   - 5.7 [MOD-MEMPOOL: Unconfirmed Transactions](#57-mod-mempool-unconfirmed-transactions)
   - 5.8 [MOD-ADDR: Address Profile](#58-mod-addr-address-profile)
   - 5.9 [MOD-ASSET: Asset Explorer](#59-mod-asset-asset-explorer)
   - 5.10 [MOD-DEX: DEX Pair Monitor](#510-mod-dex-dex-pair-monitor)
   - 5.11 [MOD-DIST: Distribution Analyzer](#511-mod-dist-distribution-analyzer)
   - 5.12 [MOD-STATS: Network Statistics](#512-mod-stats-network-statistics)
   - 5.13 [MOD-NMAP: Network Map](#513-mod-nmap-network-map)
   - 5.14 [MOD-PEERS: Peer Status](#514-mod-peers-peer-status)
   - 5.15 [MOD-GREEN: Sustainability Dashboard](#515-mod-green-sustainability-dashboard)
   - 5.16 [MOD-NODE: Node Inspector](#516-mod-node-node-inspector)
6. [Cross-Cutting Requirements](#6-cross-cutting-requirements)
   - 6.1 [Navigation & Layout Shell](#61-navigation--layout-shell)
   - 6.2 [Search System](#62-search-system)
   - 6.3 [Theming](#63-theming)
   - 6.4 [Internationalization](#64-internationalization)
   - 6.5 [Error Handling & Resilience](#65-error-handling--resilience)
   - 6.6 [Data Fetching & Caching](#66-data-fetching--caching)
   - 6.7 [Accessibility](#67-accessibility)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [External Interfaces](#8-external-interfaces)
9. [Data Dictionary](#9-data-dictionary)

---

## 1. Introduction

### 1.1 Purpose

This document specifies every functional and non-functional requirement for **DecentralScan**, the open-source blockchain explorer frontend for the DecentralChain (DCC) network. It serves as the single source of truth for design, implementation, testing, and acceptance decisions.

### 1.2 Scope

DecentralScan is a client-side single-page application (SPA) that connects directly to DCC node REST APIs with zero backend of its own. It provides real-time exploration of blocks, transactions, addresses, digital assets, DEX trading pairs, network topology, and node health. The application runs in modern browsers and is deployed as a static bundle served by Nginx in a Docker container.

### 1.3 Intended Audience

| Audience | Relevance |
|---|---|
| Frontend Engineers | Detailed functional & technical requirements for implementation |
| QA / Test Engineers | Acceptance criteria, edge cases, error states for test case authoring |
| Product Owners | Feature scope, traceability, prioritization input |
| DevOps | Deployment constraints, external dependencies, performance targets |

### 1.4 Document Conventions

**Requirement IDs** follow the pattern `{MODULE}-{CATEGORY}-{SEQ}`:

- Module: short mnemonic code (e.g., `DASH`, `TX`, `ADDR`, `MEMPOOL`)
- Category: `F` (functional), `D` (data), `UI` (interface), `E` (error)
- Sequence: zero-padded integer

Priority levels: **P0** (must-have for launch), **P1** (expected), **P2** (nice-to-have).

---

## 2. System Overview

### 2.1 Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Browser (SPA)                    │
│  React 19 · Vite 8 · Tailwind CSS 4 · React Query  │
│                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │  Pages   │ │  Shared  │ │   UI     │            │
│  │ (17 lazy │ │Components│ │(shadcn)  │            │
│  │  routes) │ │          │ │18 prims  │            │
│  └────┬─────┘ └────┬─────┘ └──────────┘            │
│       │             │                               │
│  ┌────▼─────────────▼───────────────────┐           │
│  │          lib/api.ts                  │           │
│  │  SDK wrapper · fetch · React Query   │           │
│  └────┬──────────┬──────────┬───────────┘           │
│       │          │          │                       │
└───────┼──────────┼──────────┼───────────────────────┘
        │          │          │
   ┌────▼───┐ ┌───▼────┐ ┌───▼──────┐
   │DCC Node│ │Matcher │ │ Proxied  │
   │REST API│ │  API   │ │ Services │
   │(blocks,│ │(DEX    │ │(ipinfo,  │
   │ txs,   │ │orders) │ │ green    │
   │ peers) │ │        │ │ web fdn) │
   └────────┘ └────────┘ └──────────┘
```

### 2.2 Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | React | 19.2 |
| Build Tool | Vite | 8.0 |
| Styling | Tailwind CSS | 4.2 |
| UI Primitives | Radix UI (unified) | 1.4 |
| Component Library | shadcn/ui | new-york style |
| Routing | React Router | 7.13 |
| Async State | TanStack React Query | 5.90 |
| Charts | Recharts | 3.8 |
| Maps | Leaflet + React-Leaflet | 1.9 / 5.0 |
| Graph Visualization | Cytoscape.js | 3.33 |
| Icons | Lucide React | 0.577 |
| Theming | next-themes | 0.4 |
| Error Tracking | Sentry | 10.43 |
| Unit Testing | Vitest + React Testing Library | 4.x |
| E2E Testing | Playwright | latest |
| Linting/Format | Biome | 2.4 |

### 2.3 Page Map

The application consists of 17 lazy-loaded page components rendered inside a shared layout shell. The navigation bar exposes 15 top-level tabs plus 1 detail page and 1 landing page reachable by deep link.

| # | Tab Label | Route | Module ID |
|---|---|---|---|
| — | (Landing) | `/Home` | MOD-HOME |
| 1 | Dashboard | `/Dashboard` (default) | MOD-DASH |
| 2 | Blocks | `/Blocks` | MOD-BLOCKS |
| 3 | Block Feed | `/BlockFeed` | MOD-BFEED |
| 4 | Transactions | `/Transaction` | MOD-TX |
| 5 | DEX Pairs | `/DexPairs` | MOD-DEX |
| 6 | Unconfirmed | `/UnconfirmedTransactions` | MOD-MEMPOOL |
| 7 | Address | `/Address` | MOD-ADDR |
| 8 | Assets | `/Asset` | MOD-ASSET |
| 9 | Distribution | `/DistributionTool` | MOD-DIST |
| 10 | Transaction Map | `/TransactionMap` | MOD-TXMAP |
| 11 | Network Stats | `/NetworkStatistics` | MOD-STATS |
| 12 | Network Map | `/NetworkMap` | MOD-NMAP |
| 13 | Peers | `/Peers` | MOD-PEERS |
| 14 | Sustainability | `/Sustainability` | MOD-GREEN |
| 15 | Node | `/Node` | MOD-NODE |
| — | Block Detail | `/BlockDetail?height=N` | (sub of MOD-BLOCKS) |

---

## 3. Definitions & Acronyms

| Term | Definition |
|---|---|
| **DCC** | DecentralChain — the blockchain network (Waves-protocol fork, LPoS consensus) |
| **Block Height** | Sequential integer identifying each block in the chain (starts at 1) |
| **Generator** | The address of the node that forged/mined a given block |
| **TX** | Transaction — an atomic state change on the blockchain |
| **Mempool** | The pool of unconfirmed transactions awaiting inclusion in a block |
| **DEX** | Decentralized Exchange — the protocol-native order matching engine |
| **Matcher** | The off-chain service that matches buy/sell orders for the DEX |
| **Asset** | A user-issued digital token on the DCC chain (fungible or NFT) |
| **NFT** | Non-Fungible Token — an asset with quantity = 1 and decimals = 0 |
| **Lease** | A delegation of DCC stake to a node for Liquid Proof-of-Stake |
| **Ride** | DCC's native smart contract language |
| **Green Hosting** | Server infrastructure verified by The Green Web Foundation to run on renewable energy |
| **Gini Coefficient** | A statistical measure of distribution inequality (0 = perfectly equal, 1 = maximally concentrated) |
| **BFS** | Breadth-First Search — the graph traversal algorithm used in Transaction Map |

---

## 4. Constraints & Assumptions

### 4.1 Constraints

| ID | Constraint |
|---|---|
| C-01 | The application has **no backend**. All data is fetched client-side from DCC node REST APIs, the DEX Matcher API, and proxied third-party services. |
| C-02 | The DCC node REST API is the sole authoritative data source. Data freshness depends on node polling intervals, not push/WebSocket subscriptions. |
| C-03 | Geo-enrichment for peers uses **ipinfo.io** free tier (50,000 requests/month). Rate limiting must be respected. |
| C-04 | Green hosting verification depends on **The Green Web Foundation** API availability and accuracy. |
| C-05 | The DEX Matcher API and Data Service API are external services with independent uptime SLAs. Their unavailability should degrade gracefully (DEX tab shows error, rest of app unaffected). |
| C-06 | The asset distribution endpoint imposes a server-side page limit of 1,000 entries per request with cursor-based pagination. Full distribution data for popular assets may require dozens of sequential requests. |
| C-07 | Tailwind CSS 4 uses OKLCH color space. All design tokens must be specified in OKLCH, not HSL. |

### 4.2 Assumptions

| ID | Assumption |
|---|---|
| A-01 | The user has a modern browser (Chrome 90+, Firefox 88+, Safari 15+, Edge 90+). |
| A-02 | A DCC node is accessible at the configured API base URL with CORS enabled. |
| A-03 | Block times average ~5 seconds. UI polling intervals are tuned accordingly. |
| A-04 | The Network Map uses simulated geolocation (deterministic mock data). When the geo enrichment proxy is available, it will use real ipinfo.io data. The Peers page already uses real geo data. |
| A-05 | Users may bookmark or share deep links to any page with query parameters (e.g., `?height=100`, `?id=abc`, `?addr=3xxx`). URL state must be the source of truth for detail pages. |

---

## 5. Module Requirements

---

### 5.1 MOD-HOME: Landing Page

**Route:** `/Home`
**Purpose:** First-time visitor landing page with hero, search, and feature discovery.

#### Functional Requirements

| ID | Priority | Requirement |
|---|---|---|
| HOME-F-01 | P0 | The page SHALL display a hero section with the application title ("DecentralScan"), a subtitle describing its purpose, and a global search bar. |
| HOME-F-02 | P0 | The page SHALL display a grid of 6 feature cards, each linking to a primary page: Block Explorer (`/Blocks`), Live Block Feed (`/BlockFeed`), Asset Explorer (`/Asset`), Network Statistics (`/NetworkStatistics`), Network Map (`/NetworkMap`), Distribution Tool (`/DistributionTool`). |
| HOME-F-03 | P0 | Each feature card SHALL display an icon, a title, and a one-line description. Clicking any card SHALL navigate to the corresponding route. |
| HOME-F-04 | P1 | The page SHALL include an "Open Dashboard" button that navigates to `/Dashboard`. |
| HOME-F-05 | P0 | The search bar SHALL support the same intelligent routing logic defined in [§6.2](#62-search-system). |

#### UI Requirements

| ID | Priority | Requirement |
|---|---|---|
| HOME-UI-01 | P1 | Feature cards SHALL be arranged in a 3×2 grid on desktop (≥1024px), 2×3 on tablet (≥768px), and 1×6 stacked on mobile (<768px). |
| HOME-UI-02 | P1 | Feature card icons SHALL use the `text-info` semantic color with a `bg-info/10` rounded container. Card titles SHALL transition to `text-info` on hover. |

---

### 5.2 MOD-DASH: Network Dashboard

**Route:** `/Dashboard` (application default)
**Purpose:** At-a-glance network health with real-time auto-refresh.

#### Functional Requirements

| ID | Priority | Requirement |
|---|---|---|
| DASH-F-01 | P0 | The page SHALL display 3 stat cards: **Current Block Height** (formatted with locale separators), **Node Version** (e.g., "DCC v1.3.5"), and **Last Block** (relative time, e.g., "12s ago"). |
| DASH-F-02 | P0 | The page SHALL display a "Latest Block" detail card showing: Block ID (truncated, copyable), Height (linked to BlockDetail), Transaction count, Timestamp (absolute), Reward (in DC), and Generator address (linked to Address page). |
| DASH-F-03 | P0 | The page SHALL display a "Recent Blocks" section listing the last 50 blocks in a table with columns: Height (linked), Block ID (truncated, copyable), Transactions, Generator (linked), and Time (relative). |
| DASH-F-04 | P0 | The page SHALL provide an auto-refresh toggle (labeled switch). When enabled, all data SHALL re-fetch every **15 seconds**. When disabled, data SHALL only load on page mount. |
| DASH-F-05 | P1 | Each stat card SHALL display a decorative gradient background circle (opacity 10%) using the value of the `gradient` prop, and an icon whose color derives from the same prop via `bg-` → `text-` replacement. |

#### Data Requirements

| ID | Priority | Requirement |
|---|---|---|
| DASH-D-01 | P0 | Block height SHALL be fetched via `GET /blocks/height`. |
| DASH-D-02 | P0 | Latest block SHALL be fetched via `GET /blocks/last`. |
| DASH-D-03 | P0 | Node version SHALL be fetched via `GET /node/version`. |
| DASH-D-04 | P0 | Recent blocks SHALL be fetched via `GET /blocks/headers/seq/{from}/{to}` where `from = max(1, height - 49)` and `to = height`. |

#### Error Requirements

| ID | Priority | Requirement |
|---|---|---|
| DASH-E-01 | P0 | While any data is loading, the corresponding UI region SHALL display a skeleton placeholder matching the expected layout dimensions. |
| DASH-E-02 | P1 | If any API call fails, the stat card SHALL display "..." as the value rather than crashing. |

---

### 5.3 MOD-BLOCKS: Block Browser

**Route:** `/Blocks`
**Purpose:** Paginated, chronological block list for navigating blockchain history.

#### Functional Requirements

| ID | Priority | Requirement |
|---|---|---|
| BLOCKS-F-01 | P0 | The page SHALL display a table of blocks with columns: **Height** (numeric, linked to BlockDetail), **Block ID** (truncated to 16 chars, copyable), **Transactions** (count), **Generator** (truncated address, linked to Address page), **Time** (relative, e.g., "2m ago"). |
| BLOCKS-F-02 | P0 | The table SHALL display a fixed page size of **50 blocks**. |
| BLOCKS-F-03 | P0 | Pagination controls SHALL include 4 buttons: **First** (go to block 1), **Previous** (decrement by page size), **Next** (increment by page size), **Last** (go to most recent). |
| BLOCKS-F-04 | P0 | The page SHALL display a breadcrumb label: "Showing blocks {from} – {to}" and a page indicator: "Page {n} of {total}". |
| BLOCKS-F-05 | P0 | The **First** and **Previous** buttons SHALL be disabled when `fromHeight ≤ 1`. The **Next** and **Last** buttons SHALL be disabled when `toHeight ≥ currentHeight`. |
| BLOCKS-F-06 | P1 | Clicking any table row SHALL navigate to `/BlockDetail?height={block.height}`. |

#### Block Detail (Sub-page)

| ID | Priority | Requirement |
|---|---|---|
| BLOCKS-F-10 | P0 | `/BlockDetail` SHALL accept either `?height={N}` or `?id={blockId}` as URL parameters. If `height` is provided, the block SHALL be fetched by height. If `id` is provided, it SHALL be fetched by signature. |
| BLOCKS-F-11 | P0 | The detail page SHALL display: Block height, Timestamp (absolute), Block signature (full, copyable), Version (badge), Transaction count, Block size (bytes), Reward (DC), Generator address (linked), and Parent block reference (linked to its own BlockDetail). |
| BLOCKS-F-12 | P0 | The page SHALL list all transactions in the block. Each transaction row SHALL link to `/Transaction?id={tx.id}`. |
| BLOCKS-F-13 | P1 | A collapsible raw JSON section SHALL display the full block API response. |
| BLOCKS-F-14 | P0 | A back button SHALL call `window.history.back()`. |

#### Error Requirements

| ID | Priority | Requirement |
|---|---|---|
| BLOCKS-E-01 | P0 | If the block is not found (API returns 404 or null), an alert SHALL display: "Block not found". |
| BLOCKS-E-02 | P0 | If the API returns an error, a destructive alert SHALL render with the error message text. |

---

### 5.4 MOD-BFEED: Live Block Feed

**Route:** `/BlockFeed`
**Purpose:** Real-time streaming view of new blocks as they are forged.

#### Functional Requirements

| ID | Priority | Requirement |
|---|---|---|
| BFEED-F-01 | P0 | The page SHALL poll for new blocks and prepend them to a live-updating list. The list SHALL retain a maximum of **50 blocks** (oldest are evicted). |
| BFEED-F-02 | P0 | A live status indicator SHALL display when the feed is active: a Card with a green-tinted background (`border-success/20 bg-success/5`), a pulsing Activity icon (`text-success`), and the text "live — Monitoring for new blocks". |
| BFEED-F-03 | P0 | A **Pause/Resume** button SHALL toggle the feed between active and paused states. When paused, polling stops and the live indicator disappears. |
| BFEED-F-04 | P0 | Each block card SHALL display: Block height (in a prominent `bg-primary text-primary-foreground` box), Timestamp (absolute + relative), Transaction count (badge), Block ID (truncated, copyable), and Generator address (linked, `text-link hover:text-link-hover`). |
| BFEED-F-05 | P1 | Each block card SHALL include a collapsible "Show Transactions" section. When expanded, the component SHALL fetch the full block at that height and list all transactions with their IDs (linked to Transaction page). |
| BFEED-F-06 | P0 | A "View Details" link button on each card SHALL navigate to `/BlockDetail?height={height}`. |
| BFEED-F-07 | P1 | When a gap of more than 1 block is detected between the last known height and the new height, the system SHALL fetch intermediate block headers via `fetchBlockHeadersSeq` to fill the gap. If the gap exceeds a safety threshold (50 blocks), a console warning SHALL be logged and only the new block SHALL be appended. |

#### Data Requirements

| ID | Priority | Requirement |
|---|---|---|
| BFEED-D-01 | P0 | Current height SHALL be polled via `useBlockHeight()` hook (enabled only when not paused). |
| BFEED-D-02 | P0 | Latest block SHALL be polled via `useLatestBlock()` hook (enabled only when not paused). |
| BFEED-D-03 | P1 | Transaction data for expanded blocks SHALL be fetched on-demand via `fetchBlockAt(height)`. |

---

### 5.5 MOD-TX: Transaction Explorer

**Route:** `/Transaction`
**Purpose:** Search, view, and inspect individual transactions (confirmed or unconfirmed).

#### Functional Requirements

| ID | Priority | Requirement |
|---|---|---|
| TX-F-01 | P0 | The page SHALL display a search form that accepts a transaction ID. On submission, the URL SHALL update to `/Transaction?id={txId}`. |
| TX-F-02 | P0 | The system SHALL first attempt to fetch the transaction as **confirmed** (`GET /transactions/info/{id}`). If that returns 404/error, it SHALL fall back to **unconfirmed** (`GET /transactions/unconfirmed/info/{id}`). |
| TX-F-03 | P0 | The transaction detail card SHALL display: TX ID (full, copyable), Type (named badge), Version, Timestamp (absolute), Fee (in DC), Block height (linked to BlockDetail, or "Unconfirmed" badge), and Status (Confirmed with CheckCircle icon / Unconfirmed with Clock icon). |
| TX-F-04 | P0 | A "Parties" section SHALL display: Sender address (linked), Recipient address (linked, if applicable), Amount (with asset name), and Asset ID (linked to Asset page). |
| TX-F-05 | P1 | A collapsible raw JSON section SHALL display the full transaction API response. |
| TX-F-06 | P0 | A back button SHALL call `window.history.back()`. |

#### Error Requirements

| ID | Priority | Requirement |
|---|---|---|
| TX-E-01 | P0 | If neither confirmed nor unconfirmed lookup succeeds, an alert SHALL display: "Transaction not found". |
| TX-E-02 | P0 | If the API returns an error, a destructive alert SHALL render with `error.message`. |

---

### 5.6 MOD-TXMAP: Transaction Flow Map

**Route:** `/TransactionMap`
**Purpose:** Interactive graph visualization of value transfers between addresses using BFS traversal.

#### Functional Requirements

| ID | Priority | Requirement |
|---|---|---|
| TXMAP-F-01 | P0 | A configuration card SHALL provide the following inputs: **Asset ID** (text, optional — if blank, analyzes all assets), **Root Address** (text, required), **Max Hops** (slider, range 1–4, default 2), **Transactions Per Address** (slider, range 50–500, default 200), and a **Treat as Native** checkbox (for DCC). |
| TXMAP-F-02 | P0 | A "Build Map" button SHALL launch an asynchronous BFS graph traversal starting from the root address. A "Clear" button SHALL reset the graph and all form state. |
| TXMAP-F-03 | P0 | The BFS traversal SHALL: for each address in the queue, fetch up to `perAddressLimit` transactions; extract Transfer (type 4) and MassTransfer (type 11) transactions; identify counterparty addresses; add them to the next hop's queue if not yet visited. |
| TXMAP-F-04 | P0 | The graph SHALL be rendered using Cytoscape.js with an **fcose** (fast compound spring-embedder) layout. Nodes (addresses) SHALL be blue circles sized proportionally to total transfer amount. Edges (transfers) SHALL be purple bezier curves with width proportional to transfer amount. |
| TXMAP-F-05 | P1 | Clicking a node SHALL copy the address to clipboard and show a toast notification. Clicking an edge SHALL copy the transaction ID and show a toast with amount and timestamp. |
| TXMAP-F-06 | P1 | During traversal, a progress indicator SHALL show the current hop number and count of addresses/transfers discovered. |
| TXMAP-F-07 | P0 | Three stats cards below the graph SHALL show: **Addresses** (node count), **Transfers** (edge count), and **Hops Explored**. |

#### Validation Requirements

| ID | Priority | Requirement |
|---|---|---|
| TXMAP-F-10 | P0 | If the root address field is empty, the system SHALL alert "Root address required". |
| TXMAP-F-11 | P0 | If the root address does not match DCC address format (starts with '3', length ≥ 30 characters), the system SHALL alert "Invalid address format". |
| TXMAP-F-12 | P1 | Alias addresses (matching `alias:*` pattern) SHALL be skipped during traversal. |

---

### 5.7 MOD-MEMPOOL: Unconfirmed Transactions

**Route:** `/UnconfirmedTransactions`
**Purpose:** Real-time mempool view with filtering and auto-refresh.

#### Functional Requirements

| ID | Priority | Requirement |
|---|---|---|
| MEMPOOL-F-01 | P0 | The page SHALL display all unconfirmed transactions in a table with columns: **TX ID** (truncated, copyable), **Type** (named badge), **From** (address, linked), **To** (address, linked), **Amount** (DC), **Fee** (DC), **Time** (relative). |
| MEMPOOL-F-02 | P0 | An auto-refresh toggle SHALL control a **5-second** polling interval. When enabled, the table SHALL update in-place without scroll position reset. |
| MEMPOOL-F-03 | P0 | A search input SHALL filter the table by transaction ID or sender/recipient address. Filtering SHALL be performed client-side on the cached dataset. |
| MEMPOOL-F-04 | P0 | Clicking a TX ID link SHALL navigate to `/Transaction?id={id}`. Clicking an address SHALL navigate to `/Address?addr={addr}`. |

#### Error Requirements

| ID | Priority | Requirement |
|---|---|---|
| MEMPOOL-E-01 | P0 | If the API returns an error, a destructive alert SHALL render. |
| MEMPOOL-E-02 | P0 | If the pool is empty, the message "No unconfirmed transactions" SHALL display. If the search has no matches, "No transactions match your search" SHALL display. |

---

### 5.8 MOD-ADDR: Address Profile

**Route:** `/Address`
**Purpose:** Comprehensive wallet view with balances, transaction history, NFTs, and leases.

This module uses an internal **4-tab** layout. Each tab is specified as a sub-section.

#### General Requirements

| ID | Priority | Requirement |
|---|---|---|
| ADDR-F-01 | P0 | The page SHALL display a search bar that accepts a DCC address. On submission, the URL SHALL update to `/Address?addr={address}`. |
| ADDR-F-02 | P0 | Below the search bar, the resolved address SHALL be displayed in full with a CopyButton. |
| ADDR-F-03 | P0 | A tab bar SHALL present 4 tabs: **Balances**, **Transactions**, **NFTs**, **Leases**. The active tab SHALL be visually distinguished. |

#### Tab 1: Balances

| ID | Priority | Requirement |
|---|---|---|
| ADDR-F-10 | P0 | The Balances tab SHALL list all assets held by the address. Each row SHALL display: Asset logo (with fallback), Asset name, Balance (human-readable with decimals applied), and Raw balance (smallest unit). |
| ADDR-F-11 | P0 | Clicking an asset row SHALL navigate to `/Asset?id={assetId}`. |
| ADDR-F-12 | P1 | The asset logo SHALL be resolved in order: (1) hardcoded DCC/CR logos, (2) approved logo from `AssetLogoRequest.filter()`, (3) fallback Coins icon in a gradient circle. If the image fails to load, the fallback SHALL be shown. |

#### Tab 2: Transactions

| ID | Priority | Requirement |
|---|---|---|
| ADDR-F-20 | P0 | The Transactions tab SHALL display the last 50 transactions for the address in a sortable table with columns: **Type** (named badge), **TX ID** (truncated, copyable), **Sender** (linked), **Recipient** (linked), **Amount**, **Fee**, **Timestamp**. |
| ADDR-F-21 | P0 | Column headers for **Type**, **Timestamp**, and **Fee** SHALL be clickable to toggle sort direction (ascending ↔ descending). An ArrowUpDown icon SHALL indicate the sort state. |
| ADDR-F-22 | P1 | A search input SHALL filter transactions by sender or recipient address (client-side). |
| ADDR-F-23 | P1 | A type filter dropdown SHALL allow filtering by transaction type (e.g., Transfer, MassTransfer, InvokeScript). "All Types" SHALL be the default. |
| ADDR-F-24 | P0 | Clicking a TX ID SHALL navigate to `/Transaction?id={id}`. |

#### Tab 3: NFTs

| ID | Priority | Requirement |
|---|---|---|
| ADDR-F-30 | P0 | The NFTs tab SHALL display all NFTs held by the address in a responsive grid (4 columns on large screens, 2 on medium, 1 on small). |
| ADDR-F-31 | P0 | Each NFT card SHALL display the asset logo and name. Clicking SHALL navigate to `/Asset?id={nftId}`. |
| ADDR-F-32 | P0 | The system SHALL fetch up to **100 NFTs** via `fetchAddressNFTs(address, 100)`. |

#### Tab 4: Leases

| ID | Priority | Requirement |
|---|---|---|
| ADDR-F-40 | P0 | The Leases tab SHALL display all active leases in a table with columns: **Lease ID** (truncated, copyable), **Recipient** (linked to Address page), **Amount** (in DC), **Status** (badge, always "Active" with success color). |
| ADDR-F-41 | P0 | Clicking a recipient address SHALL navigate to `/Address?addr={recipient}`. |

#### Data Requirements

| ID | Priority | Requirement |
|---|---|---|
| ADDR-D-01 | P0 | Balances SHALL be fetched via `GET /assets/balance/{address}`. |
| ADDR-D-02 | P0 | Transactions SHALL be fetched via `GET /transactions/address/{address}/limit/50`. |
| ADDR-D-03 | P0 | NFTs SHALL be fetched via the NFT-specific asset endpoint with limit 100. |
| ADDR-D-04 | P0 | Leases SHALL be fetched via `GET /leasing/active/{address}`. |

---

### 5.9 MOD-ASSET: Asset Explorer

**Route:** `/Asset`
**Purpose:** Token metadata, supply info, and real-time transfer activity analysis.

#### Functional Requirements

| ID | Priority | Requirement |
|---|---|---|
| ASSET-F-01 | P0 | The page SHALL display a search bar that accepts an asset ID. On submission, the URL SHALL update to `/Asset?id={assetId}`. |
| ASSET-F-02 | P0 | The asset detail card SHALL display: Asset name (with logo), Decimal places, Asset ID (full, copyable), Total quantity (formatted), Reissuable status (Yes/No badge), Issuer address (linked to Address page), and Description. |
| ASSET-F-03 | P1 | A "View Distribution" card SHALL link to `/DistributionTool?assetId={assetId}`. |
| ASSET-F-04 | P1 | A collapsible raw JSON section SHALL display the full asset API response. |

#### Asset Activity Widget

| ID | Priority | Requirement |
|---|---|---|
| ASSET-F-10 | P1 | An "Asset Activity (Last 24h Est.)" section SHALL analyze transfer activity across the most recent 8 blocks. |
| ASSET-F-11 | P1 | The widget SHALL aggregate Transfer (type 4) and MassTransfer (type 11) transactions to compute: per-asset transaction count, per-asset total volume, and unique asset count. |
| ASSET-F-12 | P1 | A **pie chart** SHALL display the transaction distribution across the top assets. |
| ASSET-F-13 | P1 | A **horizontal bar chart** SHALL display the transaction volume by asset. |
| ASSET-F-14 | P1 | A "Top Assets" grid SHALL list the top 8 assets by transaction count. Each item SHALL show: Asset logo, Asset name, Total amount transferred, and TX count (badge). Each item SHALL link to `/Asset?id={assetId}`. |

---

### 5.10 MOD-DEX: DEX Pair Monitor

**Route:** `/DexPairs`
**Purpose:** Decentralized exchange trading pair listings with price and volume data.

#### Functional Requirements

| ID | Priority | Requirement |
|---|---|---|
| DEX-F-01 | P0 | The page SHALL display 3 stat cards: **Total Pairs** (count), **Total Volume 24h** (sum), **Total Trades 24h** (sum). |
| DEX-F-02 | P0 | The page SHALL display a sortable table of all DEX pairs with columns: **Pair** (amount/price asset names with logos), **Last Price** (8 decimal places), **24h Change %** (green with TrendingUp icon if positive, red with TrendingDown icon if negative), **24h High**, **24h Low**, **Volume 24h**, **Trades**. |
| DEX-F-03 | P0 | All column headers SHALL be sortable. Clicking a header SHALL toggle between ascending and descending order. |
| DEX-F-04 | P0 | A search input SHALL filter pairs by pair name (client-side). |
| DEX-F-05 | P1 | A refresh button SHALL manually re-fetch the orderbook data. The button SHALL display a spinning animation while the fetch is in progress. |
| DEX-F-06 | P0 | Clicking an asset name in a pair SHALL navigate to `/Asset?id={assetId}`. |

#### Data Requirements

| ID | Priority | Requirement |
|---|---|---|
| DEX-D-01 | P0 | Pair list SHALL be fetched from the DEX Matcher API (`GET /matcher/orderbook`). Results SHALL be cached with a staleTime of **60 seconds**. |
| DEX-D-02 | P0 | For each pair, detailed stats SHALL be fetched from the Data Service API (`GET /v0/pairs/{amountAsset}/{priceAsset}`) with a **100ms delay** between requests to avoid rate limiting. |
| DEX-D-03 | P0 | Asset names SHALL be resolved via a single batch `POST /assets/details` request. |

---

### 5.11 MOD-DIST: Distribution Analyzer

**Route:** `/DistributionTool`
**Purpose:** Token holder analysis with wealth concentration metrics, downloadable datasets, and tier classification.

#### Functional Requirements

| ID | Priority | Requirement |
|---|---|---|
| DIST-F-01 | P0 | The page SHALL display an input form with: **Asset ID** (text, pre-populated from `?assetId` URL param if present), **Height** (number, defaults to `currentHeight - 10`), and a **Fetch Distribution** button. |
| DIST-F-02 | P0 | Height SHALL be validated within the range `[currentHeight - 2000, currentHeight - 10]`. Out-of-range values SHALL show an inline alert: "Height too recent" or "Height too old". |
| DIST-F-03 | P0 | During fetch, a progress card SHALL display: pages fetched, holders discovered, and a loading progress indicator. |
| DIST-F-04 | P0 | After fetch, 4 stats cards SHALL display: **Asset** (name with logo), **Supply** (total, formatted), **Total Holders** (count), **Gini Coefficient** (0.000–1.000 scale). |
| DIST-F-05 | P0 | A holder tier card SHALL classify each address into one of four tiers based on percentage of total supply held: **Whale** (🐋 ≥ 1%), **Shark** (🦈 ≥ 0.1%), **Dolphin** (🐬 ≥ 0.01%), **Shrimp** (🦐 < 0.01%). Each tier SHALL display its emoji, label, count of addresses, and combined balance. |
| DIST-F-06 | P0 | A searchable, sortable, paginated table SHALL list all holders with columns: **Rank**, **Address** (truncated, copyable), **Balance** (human-readable), **Supply %**, **Cumulative %**. Page size: **25 rows**. |
| DIST-F-07 | P0 | The table SHALL support sorting by any column (click header to toggle). |
| DIST-F-08 | P0 | A search input SHALL filter holders by address (client-side match). |
| DIST-F-09 | P1 | Two download buttons SHALL export the complete holder dataset: **Download CSV** (comma-separated, with headers) and **Download JSON** (prettified array of objects). |

#### Data Requirements

| ID | Priority | Requirement |
|---|---|---|
| DIST-D-01 | P0 | Distribution data SHALL be fetched via `GET /assets/{assetId}/distribution/{height}` using cursor-based pagination (1,000 holders per page, `after` parameter for cursor). |
| DIST-D-02 | P0 | Asset metadata (supply, decimals, name) SHALL be fetched via `GET /assets/details/{assetId}`. |
| DIST-D-03 | P0 | An `onProgress` callback SHALL relay page count and holder count to the UI during paginated fetch. |

---

### 5.12 MOD-STATS: Network Statistics

**Route:** `/NetworkStatistics`
**Purpose:** Historical blockchain analytics with charts and performance metrics.

#### Functional Requirements

| ID | Priority | Requirement |
|---|---|---|
| STATS-F-01 | P0 | The page SHALL display 4 stat cards: **Avg Block Time** (seconds, to 1 decimal), **TPS** (transactions per second, to 2 decimals), **Avg TX per Block**, **Connected Peers** (count). |
| STATS-F-02 | P0 | A Node Information card SHALL display: Node version, Blockchain height, and Block generator status (Active/Inactive). |
| STATS-F-03 | P0 | The page SHALL render 4 Recharts charts: |

| Chart | Type | X-Axis | Y-Axis | Data Source |
|---|---|---|---|---|
| Transaction Volume Trend | Bar | Hour bucket | TX count | Last 100 blocks, bucketed by hour |
| Transactions per Block | Bar | Block height | TX count | Last 50 blocks |
| Block Time | Line | Block height | Seconds | Delta between consecutive block timestamps |
| Block Size | Line | Block height | Bytes | `blocksize` field from block headers |

| ID | Priority | Requirement |
|---|---|---|
| STATS-F-04 | P1 | A summary grid SHALL display: Total transactions analyzed, Blocks analyzed, Average block size, and Maximum block size. |
| STATS-F-05 | P1 | All charts SHALL display a Tooltip on hover showing the exact data point values. |

#### Data Requirements

| ID | Priority | Requirement |
|---|---|---|
| STATS-D-01 | P0 | Analytics SHALL be computed from the last **100 block headers** fetched via `GET /blocks/headers/seq/{from}/{to}`. |
| STATS-D-02 | P0 | Peer count SHALL be fetched via `GET /peers/connected`. |
| STATS-D-03 | P0 | Node status and version SHALL be fetched via `GET /node/status` and `GET /node/version`. |

---

### 5.13 MOD-NMAP: Network Map

**Route:** `/NetworkMap`
**Purpose:** Geographic visualization of peer nodes on an interactive world map.

#### Functional Requirements

| ID | Priority | Requirement |
|---|---|---|
| NMAP-F-01 | P0 | The page SHALL render a Leaflet map centered on a global view with OpenStreetMap tiles. |
| NMAP-F-02 | P0 | Each known peer SHALL be plotted as a blue circle marker at its geolocated coordinates. |
| NMAP-F-03 | P0 | Clicking a marker SHALL open a popup displaying: Peer name (or "Unknown"), Address, and Location. |
| NMAP-F-04 | P0 | Below the map, 3 stats cards SHALL display: **Connected Peers** (count), **All Known Peers** (count), and **Regions** (count of unique geographic regions). |
| NMAP-F-05 | P1 | Below the stats, a scrollable peer list SHALL display all connected peers with their addresses. |
| NMAP-F-06 | P2 | (Current limitation) Geolocation currently uses **deterministic mock data** based on IP patterns. When the ipinfo.io proxy is available (as already used by MOD-PEERS), this SHALL be replaced with real geolocation. |

#### Data Requirements

| ID | Priority | Requirement |
|---|---|---|
| NMAP-D-01 | P0 | Connected peers SHALL be fetched via `GET /peers/connected`. |
| NMAP-D-02 | P0 | All known peers SHALL be fetched via `GET /peers/all`. |

---

### 5.14 MOD-PEERS: Peer Status

**Route:** `/Peers`
**Purpose:** Comprehensive peer network monitoring with status categorization, geo-enrichment, and green hosting verification.

This module uses an internal **4-tab** layout.

#### General Requirements

| ID | Priority | Requirement |
|---|---|---|
| PEERS-F-01 | P0 | The page SHALL display 4 stat cards: **Connected** (with success icon), **All Peers** (with info icon), **Suspended** (with warning icon), **Blacklisted** (with destructive icon). Each card SHALL use the appropriate semantic color token for its icon and background. |
| PEERS-F-02 | P0 | A tab bar SHALL present 4 tabs: **Connected**, **All Peers**, **Suspended**, **Blacklisted**. |

#### Per-Tab Table (applies to all 4 tabs)

| ID | Priority | Requirement |
|---|---|---|
| PEERS-F-10 | P0 | Each tab SHALL display a table with columns: **Address** (IP:port), **Declared Address**, **Node Name** (resolved from registered node list, or "Unknown Node"), **Country** (city + country name + flag emoji, from geo enrichment), **Green Host** (badge: "Green" with Leaf icon or "Standard"), **Last Seen** (relative time). |
| PEERS-F-11 | P0 | The **Node Name** SHALL be resolved by matching the peer's declared address against the `NodeRegistration.list()` approved registrations. |
| PEERS-F-12 | P0 | **Country** data SHALL be fetched via the `usePeerGeo` hook, which calls `fetchGeoForIp(ip)` (proxied through `/api/geo/{ip}/json` to ipinfo.io) for each unique IP. Country codes SHALL be resolved to full names via `Intl.DisplayNames`. |
| PEERS-F-13 | P0 | **Green Host** status SHALL be fetched via `fetchGreenCheck(ip)` (proxied through `/api/greencheck/{ip}` to The Green Web Foundation API). |
| PEERS-F-14 | P1 | While geo and green data is loading for a peer, a Skeleton placeholder SHALL appear in those columns. |

#### Data Requirements

| ID | Priority | Requirement |
|---|---|---|
| PEERS-D-01 | P0 | Connected: `GET /peers/connected` |
| PEERS-D-02 | P0 | All: `GET /peers/all` |
| PEERS-D-03 | P0 | Suspended: `GET /peers/suspended` |
| PEERS-D-04 | P0 | Blacklisted: `GET /peers/blacklisted` |
| PEERS-D-05 | P0 | Geo: `GET /api/geo/{ip}/json` (proxied to ipinfo.io) |
| PEERS-D-06 | P0 | Green check: `GET /api/greencheck/{ip}` (proxied to The Green Web Foundation) |

---

### 5.15 MOD-GREEN: Sustainability Dashboard

**Route:** `/Sustainability`
**Purpose:** Network sustainability analysis — renewable energy adoption, green hosting providers, and geographic distribution of green nodes.

#### Functional Requirements

| ID | Priority | Requirement |
|---|---|---|
| GREEN-F-01 | P0 | The page SHALL display 3 stat cards: **Green Hosting %** (percentage of connected peers on green infrastructure, `text-success`), **Green Nodes** (absolute count, `text-success`), **Total Analyzed** (count of peers checked). |
| GREEN-F-02 | P0 | A **pie chart** (Recharts) SHALL display the distribution of Green Hosting vs Standard Hosting as proportional slices. |
| GREEN-F-03 | P0 | A **Top Green Hosting Providers** list SHALL rank the top 5 providers by node count. Each entry SHALL display: Rank badge (`bg-success/10 text-success`), Provider name, and Count. |
| GREEN-F-04 | P0 | A **Top Countries by Green Hosting Adoption** section SHALL list up to 5 countries with: Rank badge, Country name, Node ratio (green/total), Percentage, and a Progress bar visualizing the percentage. |
| GREEN-F-05 | P1 | An informational card at the bottom SHALL explain green hosting and credit The Green Web Foundation. |

#### Data Requirements

| ID | Priority | Requirement |
|---|---|---|
| GREEN-D-01 | P0 | The page SHALL fetch connected peers via `GET /peers/connected`, then for each peer: call `fetchGreenCheck(ip)` and `fetchGeoForIp(ip)` with a **100ms delay** between requests to respect rate limits. |
| GREEN-D-02 | P0 | Aggregation SHALL compute: total green/non-green counts, green percentage, provider grouping, and per-country statistics. |

---

### 5.16 MOD-NODE: Node Inspector

**Route:** `/Node`
**Purpose:** Direct inspection of the connected DCC node's status and configuration.

#### Functional Requirements

| ID | Priority | Requirement |
|---|---|---|
| NODE-F-01 | P0 | The page SHALL display 4 info cards (each with an icon in a `bg-info/10` rounded container): **Node Version** (e.g., "DCC v1.3.5"), **State Height** (block number), **Block Generator** (Active/Inactive badge), **History Replier** (Enabled/Disabled badge). |
| NODE-F-02 | P0 | A detailed status card SHALL display: Blockchain height, State height, Updated timestamp, and Updated date. |
| NODE-F-03 | P1 | A collapsible raw JSON section SHALL display the combined status + version API response. |

#### Data Requirements

| ID | Priority | Requirement |
|---|---|---|
| NODE-D-01 | P0 | Node status SHALL be fetched via `GET /node/status`. |
| NODE-D-02 | P0 | Node version SHALL be fetched via `GET /node/version`. |

---

## 6. Cross-Cutting Requirements

### 6.1 Navigation & Layout Shell

| ID | Priority | Requirement |
|---|---|---|
| NAV-F-01 | P0 | All pages (except Home) SHALL be rendered inside a shared Layout shell that provides: a sticky header with logo + search bar + theme toggle + language switcher, a horizontal scrollable navigation bar with icons and labels for all 15 tabs, and a footer with branding. |
| NAV-F-02 | P0 | The active navigation tab SHALL be visually highlighted based on the current route (`useLocation().pathname`). |
| NAV-F-03 | P0 | The header SHALL become more opaque (`bg-background/95 backdrop-blur-lg shadow-sm`) when the user scrolls past 20px. |
| NAV-F-04 | P1 | A mobile hamburger menu (Menu icon) SHALL toggle a fullscreen overlay navigation on screens < 768px. Clicking any item or the X button SHALL close the menu. |
| NAV-F-05 | P0 | A "Skip to main content" link SHALL be the first focusable element in the DOM (`sr-only` with `focus:not-sr-only`). |

### 6.2 Search System

| ID | Priority | Requirement |
|---|---|---|
| SEARCH-F-01 | P0 | A `SearchBar` component SHALL be available in the layout header (all pages) and on the Home page hero. |
| SEARCH-F-02 | P0 | The search SHALL implement the following routing logic based on input analysis: |

| Input Pattern | Detection Rule | Navigation Target |
|---|---|---|
| All digits | `/^\d+$/` | `/BlockDetail?height={input}` |
| 40+ character string | Length ≥ 40 | Try in order: `fetchBlockById(input)` → `/BlockDetail?id={input}`, then `fetchTransactionInfo(input)` → `/Transaction?id={input}`, then `fetchAssetDetailsById(input)` → `/Asset?id={input}`. First successful match wins. |
| Anything else | Default | `/Address?addr={input}` |

| ID | Priority | Requirement |
|---|---|---|
| SEARCH-F-03 | P0 | While the search is resolving, the submit button SHALL show a loading spinner. |
| SEARCH-F-04 | P0 | If no entity is found for a long-string input, a toast error SHALL display. |

### 6.3 Theming

| ID | Priority | Requirement |
|---|---|---|
| THEME-F-01 | P0 | The application SHALL support 3 theme modes: **Light**, **Dark**, and **System** (follows OS preference). The default theme SHALL be **Light**. |
| THEME-F-02 | P0 | Theme selection SHALL be controlled via `next-themes` with `attribute="class"` and `enableSystem=true`. The selected theme SHALL persist across sessions via localStorage. |
| THEME-F-03 | P0 | A theme toggle button in the header SHALL cycle between Light (Sun icon) and Dark (Moon icon). |
| THEME-F-04 | P0 | All color values SHALL be defined as CSS custom properties in OKLCH color space, registered in `@theme inline` and scoped to `:root` (light) and `.dark` (dark) in `index.css`. The `@custom-variant dark` SHALL use `(&:is(.dark *))`. |
| THEME-F-05 | P0 | All page and component styles SHALL use semantic color tokens (`bg-background`, `text-foreground`, `bg-card`, `text-muted-foreground`, `text-link`, `text-success`, `text-warning`, `text-info`, `text-destructive`, etc.) — never raw Tailwind color values (e.g., `text-blue-600`). The only exceptions are saturated branded gradients on card headers (e.g., `from-blue-600 to-blue-700 text-white`). |
| THEME-F-06 | P0 | Dark mode SHALL use alpha-based borders (`oklch(1 0 0 / 10%)`) and elevated card surfaces (`card` slightly lighter than `background`) for visual depth hierarchy. |

### 6.4 Internationalization

| ID | Priority | Requirement |
|---|---|---|
| I18N-F-01 | P0 | The application SHALL support **English** and **Spanish** translations via a `LanguageContext` React context. |
| I18N-F-02 | P0 | A language switcher dropdown in the header SHALL allow switching between available languages. |
| I18N-F-03 | P0 | The selected language SHALL persist across sessions via **localStorage**. |
| I18N-F-04 | P0 | All user-facing static text SHALL be sourced from the translations dictionary via `t('key')`. Dynamic values (numbers, addresses, timestamps) are not translated. |
| I18N-F-05 | P1 | Adding a new language SHALL only require adding a new key to the translations record in `translations.tsx` — no structural changes to components. |

### 6.5 Error Handling & Resilience

| ID | Priority | Requirement |
|---|---|---|
| ERR-F-01 | P0 | A global `ErrorBoundary` (React class component) SHALL wrap the entire application. It SHALL catch rendering errors via `componentDidCatch()`. |
| ERR-F-02 | P0 | The error fallback UI SHALL display: an AlertTriangle icon (`text-destructive` in `bg-destructive/10` circle), the heading "Something went wrong", a description, a "Try Again" button (resets component state), and a "Go to Dashboard" link (navigates to `/`). |
| ERR-F-03 | P1 | In development environments, the error stack trace SHALL be displayed in a `<pre>` block below the buttons. |
| ERR-F-04 | P0 | If `window.__ERROR_LOGGER__` is defined, caught errors SHALL be forwarded to it (Sentry integration point). |
| ERR-F-05 | P0 | Per-page data fetching errors SHALL be handled at the component level via React Query's `error` state, rendered as destructive Alert components with the `error.message` text. The rest of the application SHALL remain functional. |
| ERR-F-06 | P0 | All data-loading regions SHALL display Skeleton placeholders matching the expected content dimensions while queries are in-flight. |

### 6.6 Data Fetching & Caching

| ID | Priority | Requirement |
|---|---|---|
| DATA-F-01 | P0 | All API calls SHALL be managed through TanStack React Query with a shared `QueryClient`. |
| DATA-F-02 | P0 | Query keys SHALL encode parameter dependencies (e.g., `['block', height, id]`, `['balances', address]`) to prevent stale cache reads and enable automatic refetch on parameter change. |
| DATA-F-03 | P0 | Pages with auto-refresh (Dashboard, UnconfirmedTransactions, BlockFeed) SHALL use `refetchInterval` to schedule periodic polling. The interval SHALL be disabled when the feature toggle is off. |
| DATA-F-04 | P0 | Computed/derived data (filtered tables, sorted arrays, chart data) SHALL be wrapped in `useMemo` to prevent unnecessary re-renders. |
| DATA-F-05 | P0 | URL query parameters (`height`, `id`, `addr`, `assetId`) SHALL be the source of truth for detail pages, enabling deep linking and bookmarking. |

### 6.7 Accessibility

| ID | Priority | Requirement |
|---|---|---|
| A11Y-F-01 | P0 | All interactive elements (buttons, links, inputs) SHALL be keyboard-navigable and have visible focus indicators. |
| A11Y-F-02 | P0 | All form inputs SHALL have associated labels or `aria-label` attributes. |
| A11Y-F-03 | P0 | Status information SHALL NOT rely solely on color. All color-coded elements (badges, icons) SHALL also have text labels or icon shapes that convey meaning. |
| A11Y-F-04 | P0 | The layout SHALL include a "Skip to main content" link as the first DOM element. |
| A11Y-F-05 | P1 | Decorative icons SHALL have `aria-hidden="true"`. Meaningful icons SHALL have descriptive `aria-label` text. |
| A11Y-F-06 | P1 | Loading states SHALL use skeleton placeholders rather than spinner-only indicators, to maintain layout stability and prevent content shift. |

---

## 7. Non-Functional Requirements

### 7.1 Performance

| ID | Priority | Requirement |
|---|---|---|
| PERF-01 | P0 | Time to Interactive (TTI) SHALL be ≤ **3 seconds** on a 4G connection with cold cache. |
| PERF-02 | P0 | All 17 page components SHALL be **lazy-loaded** via `React.lazy()` with code-splitting at the route level. |
| PERF-03 | P0 | Vendor libraries (React, Recharts, Leaflet, Cytoscape, TanStack Query) SHALL be split into separate chunks to maximize CDN cache efficiency. |
| PERF-04 | P1 | The total initial JS bundle (excluding lazy chunks) SHALL be ≤ **200 KB** gzipped. |
| PERF-05 | P0 | Polling intervals SHALL be no more frequent than: 5s (mempool), 15s (Dashboard), block-time-adaptive (BlockFeed). |

### 7.2 Reliability

| ID | Priority | Requirement |
|---|---|---|
| REL-01 | P0 | Failure of any single external API (Matcher, Data Service, ipinfo.io, Green Web Foundation) SHALL NOT crash the application. The affected feature SHALL degrade to an error state while other features remain operational. |
| REL-02 | P0 | The global ErrorBoundary SHALL prevent white-screen crashes for any unhandled React rendering error. |
| REL-03 | P1 | Sentry error reporting SHALL capture unhandled exceptions with source maps for production debugging. |

### 7.3 Security

| ID | Priority | Requirement |
|---|---|---|
| SEC-01 | P0 | The Nginx production config SHALL set the following security headers: `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Content-Security-Policy` with restrictive `connect-src 'self'`. |
| SEC-02 | P0 | All external API requests from the browser SHALL be proxied through first-party endpoints (`/api/geo/*`, `/api/greencheck/*`) — the browser SHALL NOT make direct requests to third-party origins. |
| SEC-03 | P0 | No user-supplied data SHALL be rendered as raw HTML. All dynamic content SHALL be rendered via React's JSX (which escapes by default). |
| SEC-04 | P1 | Static assets SHALL be served with long-lived cache headers (1 year for hashed filenames). HTML SHALL be served with `no-cache`. |

### 7.4 Compatibility

| ID | Priority | Requirement |
|---|---|---|
| COMPAT-01 | P0 | The application SHALL support the latest 2 major versions of Chrome, Firefox, Safari, and Edge. |
| COMPAT-02 | P0 | The application SHALL be fully responsive from 320px (mobile) to 2560px (ultrawide) viewport widths. |
| COMPAT-03 | P1 | The application SHALL respect `prefers-color-scheme` when theme is set to "System". |

### 7.5 Deployment

| ID | Priority | Requirement |
|---|---|---|
| DEPLOY-01 | P0 | The application SHALL be deployable as a multi-stage Docker image: Node.js build stage → Nginx serve stage. |
| DEPLOY-02 | P0 | The Nginx config SHALL handle SPA routing (all non-file paths rewrite to `/index.html`). |
| DEPLOY-03 | P0 | Gzip compression SHALL be enabled for text/HTML/CSS/JS/JSON/SVG resources. |

### 7.6 Testing

| ID | Priority | Requirement |
|---|---|---|
| TEST-01 | P0 | Unit tests (Vitest) SHALL cover: ErrorBoundary behavior, LanguageContext switching, utility functions, and data formatting. |
| TEST-02 | P1 | E2E tests (Playwright) SHALL cover: navigation between all tabs, search routing logic, and theme toggle persistence. |
| TEST-03 | P0 | CI pipeline SHALL run: linting (Biome) → typechecking → unit tests → production build. All stages must pass before merge. |

---

## 8. External Interfaces

### 8.1 DCC Node REST API

**Base URL:** Configurable (default: mainnet public node)

| Endpoint | Method | Used By |
|---|---|---|
| `/blocks/height` | GET | Dashboard, Blocks, BlockFeed, DistributionTool, NetworkStatistics |
| `/blocks/last` | GET | Dashboard, BlockFeed |
| `/blocks/at/{height}` | GET | BlockDetail, BlockFeed (expanded) |
| `/blocks/{id}` | GET | BlockDetail (by signature) |
| `/blocks/headers/seq/{from}/{to}` | GET | Dashboard, Blocks, BlockFeed, NetworkStatistics, Asset (activity) |
| `/transactions/info/{id}` | GET | Transaction |
| `/transactions/unconfirmed/info/{id}` | GET | Transaction (fallback) |
| `/transactions/unconfirmed` | GET | UnconfirmedTransactions |
| `/transactions/address/{addr}/limit/{n}` | GET | Address, TransactionMap |
| `/assets/details/{id}` | GET | Asset, DistributionTool, DexPairs |
| `/assets/details` | POST | DexPairs (batch) |
| `/assets/balance/{addr}` | GET | Address |
| `/assets/nft/{addr}/limit/{n}` | GET | Address |
| `/assets/{id}/distribution/{height}` | GET | DistributionTool |
| `/leasing/active/{addr}` | GET | Address |
| `/peers/connected` | GET | Dashboard, Peers, NetworkMap, Sustainability, NetworkStatistics |
| `/peers/all` | GET | Peers, NetworkMap |
| `/peers/suspended` | GET | Peers |
| `/peers/blacklisted` | GET | Peers |
| `/node/status` | GET | Node, NetworkStatistics |
| `/node/version` | GET | Dashboard, Node, NetworkStatistics |
| `/rewards` | GET | (reserved) |

### 8.2 DEX Matcher API

| Endpoint | Method | Used By |
|---|---|---|
| `/matcher/orderbook` | GET | DexPairs |

### 8.3 Data Service API

| Endpoint | Method | Used By |
|---|---|---|
| `/v0/pairs/{amountAsset}/{priceAsset}` | GET | DexPairs |

### 8.4 Proxied Third-Party Services

| Proxy Path | Upstream | Used By |
|---|---|---|
| `/api/geo/{ip}/json` | `https://ipinfo.io/{ip}/json` | Peers, Sustainability |
| `/api/greencheck/{ip}` | `https://api.thegreenwebfoundation.org/greencheck/{ip}` | Peers, Sustainability |

---

## 9. Data Dictionary

### 9.1 Block Header

| Field | Type | Description |
|---|---|---|
| `height` | integer | Sequential block number |
| `signature` | string (Base58) | Unique block identifier / hash |
| `timestamp` | integer (Unix ms) | Block creation time |
| `generator` | string (Base58) | Address of the forging node |
| `transactionCount` | integer | Number of transactions in the block |
| `blocksize` | integer | Block size in bytes |
| `version` | integer | Block format version |
| `reference` | string (Base58) | Parent block signature |
| `reward` | integer | Block reward in smallest DC units |

### 9.2 Transaction

| Field | Type | Description |
|---|---|---|
| `id` | string (Base58) | Unique transaction identifier |
| `type` | integer | Transaction type code (1–18) |
| `version` | integer | Transaction format version |
| `timestamp` | integer (Unix ms) | Transaction creation time |
| `sender` | string (Base58) | Sender address |
| `senderPublicKey` | string (Base58) | Sender's public key |
| `fee` | integer | Fee in smallest DC units |
| `height` | integer \| undefined | Block height (undefined if unconfirmed) |
| `recipient` | string (Base58) | Recipient address (type-dependent) |
| `amount` | integer | Transfer amount in smallest units (type-dependent) |
| `assetId` | string \| null | Asset ID (null for native DCC) |

### 9.3 Asset Details

| Field | Type | Description |
|---|---|---|
| `assetId` | string (Base58) | Unique asset identifier |
| `name` | string | Human-readable asset name |
| `description` | string | Asset description text |
| `decimals` | integer (0–8) | Decimal places for display |
| `quantity` | integer | Total issued quantity in smallest units |
| `reissuable` | boolean | Whether additional units can be issued |
| `issuer` | string (Base58) | Address of the asset issuer |

### 9.4 Peer

| Field | Type | Description |
|---|---|---|
| `address` | string | IP:port of the peer |
| `declaredAddress` | string | Self-declared IP:port |
| `peerName` | string | Self-reported node name |
| `peerNonce` | integer | Unique peer session identifier |
| `applicationName` | string | Software name (e.g., "DCC") |
| `applicationVersion` | string | Software version triple |
| `lastSeen` | integer (Unix ms) | Last communication timestamp |

### 9.5 Node Status

| Field | Type | Description |
|---|---|---|
| `blockchainHeight` | integer | Current blockchain height |
| `stateHeight` | integer | Height of the state database |
| `updatedTimestamp` | integer (Unix ms) | Last state update time |
| `updatedDate` | string (ISO 8601) | Last state update date |

---

*End of Document*
