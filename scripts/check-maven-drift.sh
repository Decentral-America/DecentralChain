#!/usr/bin/env bash
# Fails when a JVM package's source version is already on Maven Central but its
# direct runtime dependencies differ from the POM published at that version.
# The same coordinates must never mean two different artifacts: bump the version.
#
# Usage: scripts/check-maven-drift.sh <package-dir>    (dir containing pom.xml + mvnw)
set -euo pipefail
pkg="${1:?usage: check-maven-drift.sh <package-dir>}"
cd "$pkg"
mvn=./mvnw
q() { "$mvn" -q --batch-mode --no-transfer-progress help:evaluate -Dexpression="$1" -DforceStdout; }
group=$(q project.groupId); artifact=$(q project.artifactId); version=$(q project.version)
url="https://repo1.maven.org/maven2/${group//.//}/${artifact}/${version}/${artifact}-${version}.pom"
code=$(curl -s -o /dev/null -w '%{http_code}' "$url")
if [ "$code" = "404" ]; then echo "SKIP ${group}:${artifact}:${version} is not on Maven Central"; exit 0; fi
[ "$code" = "200" ] || { echo "ERROR: Maven Central returned HTTP $code for $url" >&2; exit 2; }
tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
curl -sf "$url" -o "$tmp/pom.xml"
deps() {
  "$mvn" -q --batch-mode --no-transfer-progress -f "$1" dependency:list \
    -DexcludeTransitive=true -DincludeScope=runtime -DoutputFile="$2" -DappendOutput=false >/dev/null
  { grep -E '^[[:space:]]+[A-Za-z0-9_.-]+:[A-Za-z0-9_.-]+:' "$2" | sed -E 's/^[[:space:]]+//; s/ -- .*//' || true; } | sort -u > "$2.sorted"
}
deps pom.xml "$tmp/source.txt"
deps "$tmp/pom.xml" "$tmp/central.txt"
if diff -u "$tmp/central.txt.sorted" "$tmp/source.txt.sorted"; then
  echo "OK ${group}:${artifact}:${version} source dependencies match Maven Central"
else
  echo "DRIFT ${group}:${artifact}:${version}: source POM dependencies differ from the POM already published at this version. Bump the version before releasing." >&2
  exit 1
fi
