#!/usr/bin/env python3
"""Compare the BPS index with the node, height by height.

Run on the host that has both the node REST API and the BPS database
(the testnet main VPS), as a user that may `sudo -u postgres`:

    python3 verify_chain_parity.py --node http://127.0.0.1:6869 --db bps_testnet

For every height in [--from, --to] (default 1 .. node height - 2, so the liquid
tip is skipped) it checks:
  * the key-block id in blocks_microblocks equals the node's block id;
  * the number of transactions stored at that height (txs and every child table,
    including txs_19) equals the node header's transactionCount.

Exit status: 0 = full parity, 1 = at least one mismatch, 2 = usage/connection error.
The final line is machine-readable:
    RESULT id_mismatches=<n> count_mismatches=<n> heights=<from>-<to>
"""

import argparse
import json
import subprocess
import sys
import urllib.request

BATCH = 100  # node REST limit for /blocks/headers/seq


def node_get(base: str, path: str):
    with urllib.request.urlopen(base.rstrip("/") + path, timeout=30) as resp:
        return json.load(resp)


def psql(db: str, sql: str):
    out = subprocess.run(
        ["sudo", "-u", "postgres", "psql", "-d", db, "-v", "ON_ERROR_STOP=1",
         "-tA", "-F", "\t", "-c", sql],
        check=True, capture_output=True, text=True,
    ).stdout
    return [line.split("\t") for line in out.splitlines() if line]


def ranges(heights):
    """Collapse sorted heights into 'a-b' strings for readable output."""
    out, start, prev = [], None, None
    for h in heights:
        if start is None:
            start = prev = h
        elif h == prev + 1:
            prev = h
        else:
            out.append(f"{start}-{prev}" if start != prev else str(start))
            start = prev = h
    if start is not None:
        out.append(f"{start}-{prev}" if start != prev else str(start))
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--node", required=True, help="node REST base URL, e.g. http://127.0.0.1:6869")
    ap.add_argument("--db", required=True, help="BPS database name, e.g. bps_testnet")
    ap.add_argument("--from", dest="from_", type=int, default=1)
    ap.add_argument("--to", type=int, default=0, help="default: node height - 2")
    args = ap.parse_args()

    try:
        tip = int(node_get(args.node, "/blocks/height")["height"])
    except Exception as exc:  # noqa: BLE001 - report any connection problem the same way
        print(f"cannot read node height: {exc}", file=sys.stderr)
        return 2
    end = args.to if args.to > 0 else tip - 2
    if end < args.from_:
        print(f"nothing to compare: from={args.from_} to={end}", file=sys.stderr)
        return 2

    id_mismatch, count_mismatch, examples = [], [], []
    for start in range(args.from_, end + 1, BATCH):
        stop = min(start + BATCH - 1, end)
        headers = node_get(args.node, f"/blocks/headers/seq/{start}/{stop}")
        node = {int(h["height"]): (h["id"], int(h["transactionCount"])) for h in headers}
        ids = {int(h): i for h, i in psql(
            args.db,
            "SELECT height, id FROM blocks_microblocks "
            f"WHERE time_stamp IS NOT NULL AND height BETWEEN {start} AND {stop}")}
        counts = {int(h): int(c) for h, c in psql(
            args.db,
            f"SELECT height, count(*) FROM txs WHERE height BETWEEN {start} AND {stop} GROUP BY height")}
        for h in range(start, stop + 1):
            node_id, node_count = node[h]
            if ids.get(h) != node_id:
                id_mismatch.append(h)
                if len(examples) < 5:
                    examples.append(f"height {h}: bps={ids.get(h)} node={node_id}")
            if counts.get(h, 0) != node_count:
                count_mismatch.append(h)
                if len(examples) < 10:
                    examples.append(f"height {h}: bps_txs={counts.get(h, 0)} node_txs={node_count}")
        print(f"checked {start}-{stop}", file=sys.stderr)

    print(f"block-id mismatches: {len(id_mismatch)} {ranges(id_mismatch)[:10]}")
    print(f"tx-count mismatches: {len(count_mismatch)} {ranges(count_mismatch)[:10]}")
    for line in examples:
        print(f"  e.g. {line}")
    print(f"RESULT id_mismatches={len(id_mismatch)} count_mismatches={len(count_mismatch)} "
          f"heights={args.from_}-{end}")
    return 0 if not id_mismatch and not count_mismatch else 1


if __name__ == "__main__":
    sys.exit(main())
