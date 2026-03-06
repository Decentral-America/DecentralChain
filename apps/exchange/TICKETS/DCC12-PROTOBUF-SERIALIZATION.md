# Audit & Migrate Protobuf Serialization Library to DecentralChain

## Assigned to: _Unassigned_

**Priority:** High  
**Type:** Task  
**Labels:** `tech-debt`, `migration`, `sdk`, `serialization`  
**Sprint:** Current  
**Story Points:** 3

---

## Summary

Audit and migrate the `@waves/protobuf-serialization` npm package from the Waves blockchain ecosystem into a clean DecentralChain library published as `@decentralchain/protobuf-serialization` with **zero** Waves references remaining. This package provides Protocol Buffer (protobuf) encoding/decoding for blockchain transactions and is a transitive dependency used by `@decentralchain/waves-transactions` (DCC-15).

---

## Background

### What is this library?

`protobuf-serialization` is a **Protocol Buffers serialization library** for blockchain transactions. Starting from Waves node version 1.2 (Ride v4), transactions can be serialized using Protocol Buffers instead of the custom binary format. This library:

- Defines `.proto` schema files for all transaction types
- Generates TypeScript/JavaScript code from those schemas
- Provides `serialize()` and `deserialize()` methods for converting between transaction objects and protobuf binary format
- Handles both legacy (binary) and modern (protobuf) transaction formats

### Where did it come from?

This package was created by the Waves blockchain team as part of the node protocol upgrade to protobuf. The source likely lives at `wavesplatform/protobuf-serialization` or may be part of a larger monorepo.

### Why does this matter?

Protobuf serialization is required for **all transaction types introduced after Waves v1.2**. If the DCC node supports protobuf (which it likely does as a Waves fork), this library must correctly serialize transactions with:

- Chain ID 'L' (76) for DCC mainnet instead of 'W' (87) for Waves mainnet
- Correct field mappings in the proto schemas
- Proper generated code with DCC references

### Why is an AUDIT required?

The `.proto` files may contain:

1. **Waves-specific chain ID default values**
2. **Package names** like `waves.` in the protobuf namespace
3. **Comments** referencing Waves protocol documentation
4. **Generated code** that was compiled from Waves-specific proto files

The generated code must be regenerated from updated proto files — simply find-and-replace on generated code is fragile and error-prone.

### Blocking Dependencies

| Dependency      | Status  | Notes                                         |
| --------------- | ------- | --------------------------------------------- |
| **Needs audit** | Unknown | May depend on Phase 1 packages — verify first |

---

## Current State of the Repo

| Field                         | Value                                                          |
| ----------------------------- | -------------------------------------------------------------- |
| **npm package**               | `@waves/protobuf-serialization`                                |
| **Current GitHub repo**       | Needs research — likely `wavesplatform/protobuf-serialization` |
| **Fork in Decentral-America** | ❌ **Needs to be forked** (or repo found)                      |
| **Language**                  | TypeScript + Protocol Buffers (.proto files)                   |
| **License**                   | MIT (expected)                                                 |
| **`@waves/*` dependencies**   | **Needs audit** — unclear until inspected                      |
| **Runtime dependencies**      | `protobufjs`, `long`, possibly others                          |
| **Used by**                   | `@decentralchain/waves-transactions` (DCC-15, Phase 3)         |
| **Last published to npm**     | Needs research                                                 |

### Expected File Structure

```
protobuf-serialization/
├── proto/
│   ├── waves/                # ⚠️ Waves-namespaced proto files
│   │   ├── transaction.proto # ⚠️ Transaction schemas
│   │   ├── block.proto       # ⚠️ Block schemas
│   │   ├── amount.proto      # Amount schemas
│   │   ├── order.proto       # DEX order schemas
│   │   └── ...
├── src/
│   ├── index.ts              # Main entry
│   ├── generated/            # ⚠️ Auto-generated from proto files
│   │   └── waves.ts          # ⚠️ Generated protobuf classes
│   ├── serialize.ts          # Serialization logic
│   └── deserialize.ts        # Deserialization logic
├── scripts/
│   └── generate.sh           # ⚠️ Proto code generation script
├── package.json              # ⚠️ Contains @waves scope
├── tsconfig.json
├── README.md                 # ⚠️ References Waves
└── ...
```

---

## Known Waves Contamination

### 1. Proto File Namespaces

Proto files use namespaced package declarations:

```protobuf
// BEFORE:
syntax = "proto3";
package waves;

message SignedTransaction {
  bytes chain_id = 1;
  ...
}

// AFTER:
syntax = "proto3";
package decentralchain;

message SignedTransaction {
  bytes chain_id = 1;
  ...
}
```

> **⚠ CRITICAL DECISION:** Changing the proto package name changes the wire format namespace. This is **only safe** if DCC nodes also use the updated proto namespace. If DCC nodes expect the `waves` package name in protobuf payloads (because the node is a minimally-changed Waves fork), then the proto package name **must stay `waves`**.
>
> **Ask the team lead:** Does the DCC node expect `package waves;` or `package decentralchain;` in protobuf messages?

### 2. package.json

- `name` is `@waves/protobuf-serialization` — must be `@decentralchain/protobuf-serialization`
- Check `dependencies` for `@waves/*` packages
- `repository.url` — update to DA org

### 3. Generated Code

If there's a `src/generated/` directory:

- The generated code contains namespace references from the proto files
- **Do NOT manually edit generated code** — update the proto files and regenerate
- The generation script (if any) must be updated to output the correct namespaces

### 4. Proto File Directory Structure

The proto files may be in a `proto/waves/` directory. If renaming:

```
proto/waves/transaction.proto → proto/decentralchain/transaction.proto
```

But **only if the wire format should change** (see Decision above).

### 5. Chain ID Default Values

Proto files may specify default chain IDs:

```protobuf
// Look for:
optional bytes chain_id = X [default = "W"];
optional int32 chain_id = X [default = 87];
```

### 6. Source Code Comments

```typescript
// Look for:
/** Waves protobuf serialization */
// Must become:
/** DecentralChain protobuf serialization */
```

### 7. Node Compatibility

The serialized protobuf bytes must be accepted by the **DCC node**. This means:

- Field numbers must match what the node expects
- Package name must match what the node expects
- Chain ID in the serialized bytes must be 'L' (76) for DCC mainnet

---

## Step-by-Step Instructions

### Prerequisites

Before starting, make sure you have:

- **Git** installed
- **Node.js** v16+ installed
- **npm** installed
- **protoc** (Protocol Buffers compiler) installed, or `protobufjs` CLI
- A **GitHub account**
- A **code editor** (VS Code recommended)
- **Confirmation from team lead** on proto package namespace

---

### Step 1: Find the Repository

```bash
# Try the obvious URL
curl -s -o /dev/null -w "%{http_code}" https://github.com/wavesplatform/protobuf-serialization

# If not found, search npm
npm view @waves/protobuf-serialization repository.url

# Search GitHub
# https://github.com/wavesplatform?q=protobuf
```

---

### Step 2: Create Your Workspace

```bash
mkdir ~/dcc-migration
cd ~/dcc-migration
```

---

### Step 3: Clone the Repository

```bash
git clone <REPO_URL> waves-protobuf-original
cp -r waves-protobuf-original dcc-protobuf-migrated
cd dcc-protobuf-migrated
rm -rf .git
git init
```

---

### Step 4: Create Your New Repository on GitHub

1. Go to https://github.com/new
2. Fill in:
   - **Repository name:** `protobuf-serialization`
   - **Description:** `Protocol Buffer serialization for DecentralChain blockchain transactions`
   - **Visibility:** Public
   - **Initialize:** Do NOT add README, .gitignore, or license
3. Click **Create repository**
4. Connect it:

```bash
git remote add origin https://github.com/YOUR_USERNAME/protobuf-serialization.git
```

---

### Step 5: Audit the Dependencies

```bash
cat package.json | python3 -m json.tool | grep -E '"name"|"@waves"|"protobuf"'

echo "--- All dependencies ---"
cat package.json | python3 -m json.tool | grep -A1 '"dependencies"' | head -20
cat package.json | python3 -m json.tool | grep -A1 '"devDependencies"' | head -20
```

---

### Step 6: Run the Full Waves Audit

```bash
echo "=== Full Waves Audit ==="

echo "--- @waves references ---"
grep -rn "@waves" . --include="*.ts" --include="*.js" --include="*.json" --include="*.proto" | grep -v node_modules | grep -v .git | grep -v dist

echo "--- waves namespace in proto files ---"
grep -rn "package waves" . --include="*.proto" | grep -v node_modules | grep -v .git

echo "--- waves word references ---"
grep -rni "waves" . --include="*.ts" --include="*.js" --include="*.json" --include="*.md" --include="*.proto" | grep -v node_modules | grep -v .git | grep -v dist

echo "--- wavesplatform references ---"
grep -rni "wavesplatform" . | grep -v node_modules | grep -v .git | grep -v dist

echo "--- Chain ID 'W' references ---"
grep -rn "'W'" . --include="*.ts" --include="*.js" --include="*.proto" | grep -v node_modules | grep -v .git | grep -v dist

echo "--- Generated code check ---"
find . -path "*generated*" -name "*.ts" -o -path "*generated*" -name "*.js" | grep -v node_modules | grep -v .git
```

---

### Step 7: Determine Proto Namespace Strategy

**⚠ STOP and consult the team lead:**

> "The protobuf-serialization library uses `package waves;` in its .proto files. Does the DCC node expect `package waves;` or `package decentralchain;`? If the DCC node is a minimally modified Waves fork, the proto namespace probably needs to stay `waves` for wire compatibility."

Based on the answer:

- **If `waves` namespace must stay:** Only rename the npm package, imports, comments, and README. Leave `.proto` files and generated code alone.
- **If `decentralchain` namespace is needed:** Update proto files, regenerate code, and verify node compatibility.

---

### Step 8: Fix Waves References

#### 8a. Fix package.json

```json
{
  "name": "@decentralchain/protobuf-serialization"
}
```

Remove any `@waves/*` from dependencies, replace with `@decentralchain/*`.

#### 8b. Fix Proto Files (IF namespace changes — see Step 7)

```protobuf
// IF changing namespace:
// BEFORE:
package waves;
// AFTER:
package decentralchain;
```

#### 8c. Regenerate Code (IF proto files changed)

```bash
# Find the generation script
cat scripts/generate.sh || cat Makefile | grep proto

# Run the generation
npm run generate || npx pbjs ...
```

#### 8d. Fix Source Code Imports

```typescript
// BEFORE:
import { ... } from '@waves/some-package';
// AFTER:
import { ... } from '@decentralchain/some-package';
```

#### 8e. Fix Comments and JSDoc

```typescript
// BEFORE:
/** Waves protobuf transaction serialization */
// AFTER:
/** DecentralChain protobuf transaction serialization */
```

#### 8f. Fix README.md

````markdown
# @decentralchain/protobuf-serialization

Protocol Buffer serialization/deserialization for DecentralChain blockchain transactions.

Provides efficient binary encoding for transaction types using Protocol Buffers, compatible with DecentralChain node API.

## Installation

```bash
npm install @decentralchain/protobuf-serialization
```
````

## License

MIT

````

---

### Step 9: Run the Audit Again

```bash
grep -rni "waves" . --include="*.ts" --include="*.js" --include="*.json" --include="*.md" --include="*.yml" --include="*.yaml" --include="*.proto" | grep -v node_modules | grep -v .git | grep -v dist
````

**Target: ZERO results** (unless proto namespace intentionally kept as `waves` for node compat — document this).

---

### Step 10: Rebuild and Test

```bash
rm -rf node_modules dist
npm install
npm run build
npm test
```

---

### Step 11: Verify Serialization Compatibility

If possible, verify that serialized output is accepted by a DCC node:

```bash
# Create a simple test that serializes a transaction and checks the bytes
node -e "
const pb = require('./dist');
// Create a minimal transaction, serialize it, check for correct chain_id byte
// chain_id should be 76 ('L') for DCC mainnet
"
```

---

### Step 12: Commit and Push

```bash
git add .
git commit -m "feat: clean migration of protobuf-serialization — remove Waves references

- Renamed package to @decentralchain/protobuf-serialization
- [Updated|Preserved] proto namespace [decentralchain|waves] for node compat
- Updated all @waves/* imports to @decentralchain/*
- Updated repository URLs to Decentral-America
- Cleaned all comments and README
- Regenerated code from updated proto files (if applicable)
- All tests pass
- grep -rni waves returns zero results"

git push -u origin master
```

---

### Step 13: Notify Downstream Consumers

This package is consumed by:

1. **DCC-15** (`@decentralchain/waves-transactions`) — notify that person

---

### Step 14: Write Your Migration Summary

```
Migration Summary — protobuf-serialization

Source repo: [URL]
Files changed: [list them]
Waves references found: [number]
Waves references removed: [number]
Proto namespace: [changed to decentralchain | kept as waves for compat]
Proto files modified: [yes/no]
Code regenerated: [yes/no]
@waves/* imports updated: [number]
Tests: [pass/fail]
Build: [pass/fail]
Node compatibility verified: [yes/no]

Remaining concerns: [proto namespace decision, node compat testing]
```

---

## Acceptance Criteria

- [ ] Source repo located (wavesplatform org or elsewhere)
- [ ] Audit completed and documented
- [ ] Proto namespace strategy confirmed with team lead
- [ ] `grep -rni "waves" . | grep -v node_modules | grep -v .git | grep -v dist` returns **zero** results (or only intentional proto compat lines are documented)
- [ ] `grep -i "waves" package.json` returns **zero** results
- [ ] No `@waves/*` packages in `dependencies` or `devDependencies`
- [ ] `package.json` name is `@decentralchain/protobuf-serialization`
- [ ] Proto files updated (if namespace changed) and code regenerated
- [ ] README references DecentralChain exclusively
- [ ] `npm install` completes without errors
- [ ] `npm run build` completes without errors
- [ ] `npm test` passes
- [ ] Serialization output verified (if possible)
- [ ] DCC-15 owner notified
- [ ] Team lead notified for review

---

## AI Prompt for Assistance

```
I am migrating the npm package @waves/protobuf-serialization from the Waves
blockchain ecosystem to @decentralchain/protobuf-serialization.

This package provides Protocol Buffer serialization for blockchain transactions.
It contains .proto schema files and auto-generated TypeScript code.

KEY QUESTION: The proto files use `package waves;` as the protobuf namespace.
The DCC node is a fork of the Waves node. Should the proto namespace change
to `package decentralchain;` or stay as `waves` for wire compatibility?

If the namespace changes:
- All .proto files need updating
- Generated code must be regenerated
- Node compatibility must be verified

If the namespace stays:
- Only the npm package name, imports, comments, and README need updating
- Document WHY the proto namespace retained "waves"

The target npm scope is @decentralchain.
The target GitHub org is Decentral-America.

Please help me audit this file: [paste file contents here]
```

---

## Estimated Time

**2–4 hours** — Medium complexity. Time depends heavily on the proto namespace decision. If the namespace stays `waves`, this is a quick rename. If it changes, code regeneration and node compatibility testing add time.

---

## Questions?

Reach out to the team lead. Key decisions:

1. **Proto namespace:** `package waves;` or `package decentralchain;`? This affects wire format compatibility with DCC nodes.
2. **Code generation tools:** Does the project use `protoc`, `pbjs`, or `ts-proto`? Need the correct tool version installed.
3. **Node compatibility testing:** Is there a DCC testnet node available for verifying serialized bytes?
