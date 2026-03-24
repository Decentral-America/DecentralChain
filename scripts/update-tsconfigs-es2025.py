#!/usr/bin/env python3
"""Update all SDK package tsconfigs: ES2024 -> ES2025, remove DOM.Iterable (merged into DOM in TS 6.0)."""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
changes = []

for pkg in os.listdir(os.path.join(ROOT, 'packages')):
    tsconfig_path = os.path.join(ROOT, 'packages', pkg, 'tsconfig.json')
    if not os.path.exists(tsconfig_path):
        continue
    with open(tsconfig_path) as f:
        content = f.read()

    original = content
    content = content.replace('"ES2024"', '"ES2025"')
    content = re.sub(r',\s*"DOM\.Iterable"', '', content)
    content = re.sub(r'"DOM\.Iterable",\s*', '', content)
    content = re.sub(r',\s*"DOM\.AsyncIterable"', '', content)
    content = re.sub(r'"DOM\.AsyncIterable",\s*', '', content)

    if content != original:
        with open(tsconfig_path, 'w') as f:
            f.write(content)
        changes.append(pkg)

print(f"Updated {len(changes)} package tsconfigs: {', '.join(sorted(changes))}")
