import io
import subprocess
import sys
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).parent))
import verify_chain_parity as v  # noqa: E402

TIP = 7  # checks heights 1..5


def headers(start, stop):
    return [{"height": h, "id": f"id{h}", "transactionCount": h} for h in range(start, stop + 1)]


class FakeEnv:
    def __init__(self, dup=False, short=False, fail_on=None, above_tip=False):
        self.dup, self.short, self.fail_on, self.above_tip = dup, short, fail_on, above_tip
        self.calls = 0

    def node_get(self, base, path):
        if path == "/blocks/height":
            return {"height": TIP}
        _, _, _, _, a, b = path.split("/")
        hs = headers(int(a), int(b))
        return hs[:-1] if self.short else hs

    def psql(self, db, sql):
        self.calls += 1
        if self.fail_on == self.calls:
            raise subprocess.CalledProcessError(1, "psql", stderr="boom")
        if "max(height)" in sql:
            return [[str(TIP + 3 if self.above_tip else TIP)]]
        if "FROM blocks_microblocks" in sql:
            rows = [[str(h), f"id{h}"] for h in range(1, 6)]
            if self.dup:
                rows.append(["3", "id3"])
            return rows
        return [[str(h), str(h)] for h in range(1, 6)]


def run_main(env):
    out, err = io.StringIO(), io.StringIO()
    argv = ["x", "--node", "http://n", "--db", "d"]
    with mock.patch.object(v, "node_get", env.node_get), mock.patch.object(v, "psql", env.psql), \
            mock.patch.object(sys, "argv", argv), redirect_stdout(out), redirect_stderr(err):
        code = v.main()
    return code, out.getvalue(), err.getvalue()


class ParityTests(unittest.TestCase):
    def test_clean_run(self):
        code, out, _ = run_main(FakeEnv())
        self.assertEqual(code, 0)
        self.assertEqual(out.splitlines()[-1],
                         "RESULT id_mismatches=0 count_mismatches=0 heights=1-5")

    def test_duplicate_key_block_row(self):
        code, out, _ = run_main(FakeEnv(dup=True))
        self.assertEqual(code, 1)
        self.assertEqual(out.splitlines()[-1],
                         "RESULT id_mismatches=1 count_mismatches=0 heights=1-5")

    def test_short_node_response(self):
        code, _, err = run_main(FakeEnv(short=True))
        self.assertEqual(code, 2)
        self.assertIn("unexpected headers", err)

    def test_psql_failure_mid_run_exits_2(self):
        code, _, err = run_main(FakeEnv(fail_on=2))
        self.assertEqual(code, 2)
        self.assertIn("boom", err)

    def test_rows_above_tip(self):
        code, out, _ = run_main(FakeEnv(above_tip=True))
        self.assertEqual(code, 1)
        self.assertIn("id_mismatches=1 count_mismatches=1", out.splitlines()[-1])

    def test_from_must_be_positive(self):
        out, err = io.StringIO(), io.StringIO()
        with mock.patch.object(sys, "argv", ["x", "--node", "n", "--db", "d", "--from", "0"]), \
                redirect_stdout(out), redirect_stderr(err):
            self.assertEqual(v.main(), 2)


if __name__ == "__main__":
    unittest.main()
