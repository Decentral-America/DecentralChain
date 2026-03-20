import { spawnSync } from 'node:child_process';

const workspaceRoot = new URL('../../../', import.meta.url);

const auditResult = spawnSync('pnpm', ['audit', '--audit-level=high', '--json'], {
  cwd: workspaceRoot,
  encoding: 'utf8',
});

const rawOutput = auditResult.stdout || auditResult.stderr;

if (!rawOutput) {
  console.error('[scanner-audit] pnpm audit produced no output');
  process.exit(1);
}

let report;

try {
  report = JSON.parse(rawOutput);
} catch (error) {
  console.error('[scanner-audit] Failed to parse pnpm audit JSON output');
  console.error(rawOutput);
  console.error(error);
  process.exit(1);
}

const advisories = Object.values(report.advisories ?? {});
const scannerFindings = [];
let unrelatedWorkspaceFindings = 0;

for (const advisory of advisories) {
  if (!advisory || !['high', 'critical'].includes(advisory.severity)) {
    continue;
  }

  for (const finding of advisory.findings ?? []) {
    for (const path of finding.paths ?? []) {
      if (path.startsWith('apps__scanner>') || path.startsWith('scanner>')) {
        scannerFindings.push({
          path,
          severity: advisory.severity,
          title: advisory.title,
        });
      } else {
        unrelatedWorkspaceFindings += 1;
      }
    }
  }
}

if (scannerFindings.length > 0) {
  console.error(
    '[scanner-audit] High or critical vulnerabilities found in scanner dependency paths:',
  );
  for (const finding of scannerFindings) {
    console.error(`- [${finding.severity}] ${finding.title}`);
    console.error(`  path: ${finding.path}`);
  }
  process.exit(1);
}

if (unrelatedWorkspaceFindings > 0) {
  process.stdout.write(
    `[scanner-audit] Scanner dependency paths are clean. Ignored ${unrelatedWorkspaceFindings} high/critical finding(s) outside scanner.\n`,
  );
} else {
  process.stdout.write('[scanner-audit] Scanner dependency audit clean.\n');
}
