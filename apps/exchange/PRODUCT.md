# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

DecentralChain (DCC) holders of mixed skill, including CR Coin holders. Most sessions are checking balances, sending, receiving and swapping; trading on the order book is occasional. Clarity beats density.

## Product Purpose

DecentralExchange is the wallet and decentralized exchange for the DecentralChain network. It holds keys client-side, shows balances and history, sends and receives assets, swaps, trades pairs on the DCC matcher, bridges, and issues and manages tokens. Success is a holder completing a send, swap or trade without doubt about what they are signing.

## Positioning

The first-party wallet and DEX for DecentralChain: the same keys, assets and matcher the chain itself runs on, with no custodian in between.

## Operating Context

- Web app (Vite + React) and an Electron desktop build from the same code.
- Mainnet configuration from `configs/mainnet.json`; market and order book data come from the DCC data service and matcher.
- Accounts are created, imported from seed or backup, or connected through Ledger.
- Signing flows are irreversible on-chain actions.

## Capabilities and Constraints

- Wallet: portfolio, asset detail, transactions/history, leasing, aliases, messages, create token, settings, account manager.
- Trading: DEX pair view with chart, order book and limit/market orders, markets list, swap, bridge.
- Onboarding: landing, sign up, sign in, import (seed, Ledger, Keeper), restore from backup, save seed.
- Stack: React 19, MUI 7, styled-components, Emotion, react-router 8, zustand, react-query. No Tailwind; the incumbent styling system stays.
- Light and dark themes both ship.
- 17 languages via i18next; copy lengths vary.

## Brand Commitments

- Name: DecentralExchange, part of DecentralChain / DecentralAmerica.
- Real logo artwork lives in `public/brand`.

## Evidence on Hand

- No testimonials, volumes, user counts or audits are on file. Do not fabricate any.

## Product Principles

1. The user always knows what they are about to sign and what it costs.
2. Balances and prices are the truth of the screen; decoration never competes with numbers.
3. Simple paths for holders first; trading depth is available, not imposed.
4. One app across web and desktop, light and dark, every language.
