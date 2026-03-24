#!/usr/bin/env python3
"""Migrate bare internal imports to #/ subpath imports (TS 6.0 / Node.js imports field)."""
import os
import re

INTERNAL = {
    '_core', 'accounts', 'assets', 'background', 'balances', 'controllers',
    'fee', 'i18n', 'icons', 'ipc', 'keystore', 'ledger', 'lib', 'messages',
    'networks', 'nfts', 'notifications', 'permissions', 'popup', 'preferences',
    'sentry', 'storage', 'store', 'swap', 'ui', 'wallets'
}

ns_pattern = '|'.join(re.escape(ns) for ns in sorted(INTERNAL, key=len, reverse=True))
pattern = re.compile(r"from '((?:" + ns_pattern + r")(?:/[^']*)?)'")

changed_files = 0
changed_imports = 0

src_root = os.path.join(os.path.dirname(__file__), '..', 'src')

for dirpath, dirs, files in os.walk(src_root):
    dirs[:] = [d for d in dirs if d != 'node_modules']
    for fname in files:
        if not (fname.endswith('.ts') or fname.endswith('.tsx')):
            continue
        fpath = os.path.join(dirpath, fname)
        with open(fpath, encoding='utf-8') as f:
            content = f.read()

        matches = pattern.findall(content)
        if not matches:
            continue

        def replace_import(m):
            original = m.group(1)
            ns = original.split('/')[0]
            if ns in INTERNAL:
                return f"from '#{original}'"
            return m.group(0)

        new_content = pattern.sub(replace_import, content)
        if new_content != content:
            changed_imports += len(matches)
            changed_files += 1
            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"  {fpath.replace(src_root, 'src')} ({len(matches)} imports)")

print(f"\nDone: {changed_files} files, {changed_imports} imports rewritten")
