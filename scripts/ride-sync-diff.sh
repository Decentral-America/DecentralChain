#!/usr/bin/env bash
# Compares packages/ride/lang/{shared,jvm,js}/src/main with node-scala's lang at the
# commit pinned in packages/ride/NODE_SCALA_REF. node-scala is the source of truth
# (it is what the network runs). node-scala's sources are formatted with ride's own
# scalafmt config, and imports, comments and blank lines are ignored, so only code
# differences are reported.
#
# Usage: scripts/ride-sync-diff.sh <node-scala-checkout> [--list]
#   --list  print the current divergence set and exit 0
# Otherwise exits 1 when the divergence set differs from packages/ride/node-scala-sync.allow
# (a new divergence, or an allow-list entry that no longer diverges).
set -euo pipefail
node_scala="$(cd "${1:?usage: ride-sync-diff.sh <node-scala-checkout> [--list]}" && pwd)"
mode="${2:-check}"
repo="$(cd "$(dirname "$0")/.." && pwd)"
ride="$repo/packages/ride"
allow="$ride/node-scala-sync.allow"
want_ref="$(tr -d '[:space:]' < "$ride/NODE_SCALA_REF")"
have_ref="$(git -C "$node_scala" rev-parse HEAD)"
if [ "$want_ref" != "$have_ref" ]; then
  echo "ERROR: $node_scala is at $have_ref but packages/ride/NODE_SCALA_REF pins $want_ref" >&2
  exit 2
fi

work="$(mktemp -d)"; trap 'rm -rf "$work"' EXIT
rsync -a --exclude target --exclude node_modules --exclude dist "$ride/" "$work/ride/"
for d in shared jvm js; do
  rm -rf "$work/ride/lang/$d/src/main"
  cp -R "$node_scala/lang/$d/src/main" "$work/ride/lang/$d/src/main"
done
(cd "$work/ride" && sbt -batch --no-colors "lang/scalafmtAll" "langJS/scalafmtAll" >"$work/fmt.log" 2>&1) || {
  cat "$work/fmt.log" >&2; echo "ERROR: scalafmt failed" >&2; exit 2; }

norm() { grep -v -E '^[[:space:]]*(import |//|$)' "$1" || true; }
current="$work/current.txt"; : > "$current"
for d in shared jvm js; do
  a="$ride/lang/$d/src/main"; b="$work/ride/lang/$d/src/main"
  while IFS= read -r f; do
    rel="lang/$d/src/main/${f#./}"
    if [ ! -f "$b/$f" ]; then echo "only-ride $rel" >> "$current"; continue; fi
    if ! diff -q <(norm "$a/$f") <(norm "$b/$f") >/dev/null; then echo "differs $rel" >> "$current"; fi
  done < <(cd "$a" && find . -name '*.scala' | sort)
  while IFS= read -r f; do
    [ -f "$a/$f" ] || echo "only-node lang/$d/src/main/${f#./}" >> "$current"
  done < <(cd "$b" && find . -name '*.scala' | sort)
done
sort -o "$current" "$current"

if [ "$mode" = "--list" ]; then cat "$current"; exit 0; fi

expected="$work/expected.txt"
grep -v -E '^[[:space:]]*(#|$)' "$allow" | sed -E 's/[[:space:]]+#.*$//' | sort > "$expected"
if diff -u "$expected" "$current"; then
  echo "OK: packages/ride matches node-scala@${want_ref:0:10} except $(wc -l < "$expected" | tr -d ' ') reviewed entries in node-scala-sync.allow"
else
  echo "ERROR: RIDE divergence from node-scala changed (+ new divergence, - entry no longer diverges)." >&2
  echo "Port the node-scala change into packages/ride, or update node-scala-sync.allow with a reason." >&2
  exit 1
fi
