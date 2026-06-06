// ──────────────────────────────────────────────────────────────────────────────
// packages/ride — Standalone sbt build for the RIDE language compiler and REPL
//
// Subprojects:
//   lang        — RIDE compiler (JVM + Scala.js cross-compiled)
//   lang-jvm    — lang JVM target
//   lang-js     — lang Scala.js target (emits packages/ride/lang/js/dist/lang.js)
//   lang-testkit — test helpers for lang consumers
//   lang-tests  — unit tests (JVM)
//   lang-tests-js — unit tests (Scala.js)
//   repl        — RIDE REPL (JVM + Scala.js cross-compiled)
//   repl-jvm    — repl JVM target
//   repl-js     — repl Scala.js target (emits packages/ride/repl/js/dist/repl.js)
//
// Run `sbt fullLinkJS` to produce JS binaries consumed by packages/ride/ts/.
// ──────────────────────────────────────────────────────────────────────────────

Global / onChangedBuildSource := ReloadOnSourceChanges

enablePlugins(GitVersioning)

git.uncommittedSignifier       := Some("DIRTY")
ThisBuild / git.useGitDescribe := true
// Reject tags containing '/' (e.g. upstream-node-scala/v1.2.18) — only plain
// semver tags like v1.6.2 should drive the version number.
ThisBuild / git.gitTagToVersionNumber := { ver =>
  if (ver.contains('/')) None
  else if (ver.startsWith("v")) Some(ver.drop(1))
  else None
}
// Suppress gitDescribedVersion entirely for all subprojects: the monorepo
// contains upstream tags like upstream-node-scala/v1.2.18 whose '/' makes
// them invalid Ivy version strings. Fall back to git.formattedShaVersion.
ThisBuild / git.gitDescribedVersion := None
// Include ~/.m2/repository so locally-built io.decentralchain JARs resolve.
// REMOVE after DCC-269 Phase 3: once all io.decentralchain artifacts are
// published to Maven Central, this resolver and the CI mvn install chain
// become unnecessary.
ThisBuild / resolvers += Resolver.mavenLocal
ThisBuild / PB.protocVersion := Dependencies.gProtoVersion

// ── scalafix / semanticdb ─────────────────────────────────────────────────────
// semanticdb is built into the Scala 3 compiler; enabling it lets scalafix run
// semantic rules (OrganizeImports, RemoveUnused) on JVM subprojects.
// Scala.js subprojects use .scalafix-js.conf (syntactic rules only) via jsSettings.
ThisBuild / semanticdbEnabled := true
ThisBuild / semanticdbVersion := scalafixSemanticdb.revision

ThisBuild / dependencyOverrides ++= Dependencies.overrides.value

ThisBuild / pomIncludeRepository   := { _ => false }
ThisBuild / publishMavenStyle      := true
ThisBuild / sonatypeCredentialHost := xerial.sbt.Sonatype.sonatypeCentralHost
ThisBuild / publishTo              := sonatypePublishToBundle.value
ThisBuild / pgpPassphrase          := sys.env.get("MAVEN_GPG_PASSPHRASE").map(_.toCharArray)
ThisBuild / sonatypeDeploymentName := s"ride-${(ThisBuild / version).value}"

inScope(Global)(
  Seq(
    scalaVersion         := "3.8.3",
    organization         := "io.decentralchain",
    organizationName     := "DecentralChain",
    organizationHomepage := Some(url("https://decentralchain.io")),
    homepage             := Some(url("https://github.com/Decentral-America/DecentralChain")),
    developers           := List(
      Developer(
        "decentral-america",
        "Decentral America",
        "dev@decentralchain.io",
        url("https://github.com/Decentral-America")
      )
    ),
    scmInfo := Some(
      ScmInfo(
        url("https://github.com/Decentral-America/DecentralChain"),
        "scm:git:https://github.com/Decentral-America/DecentralChain.git"
      )
    ),
    licenses := Seq(
      ("MIT", url("https://github.com/Decentral-America/DecentralChain/blob/main/packages/ride/LICENSE"))
    ),
    publish / skip := true,
    scalacOptions ++= Seq(
      "-feature",
      "-deprecation",
      "-unchecked",
      "-language:higherKinds",
      "-language:implicitConversions",
      "-language:postfixOps",
      "-Xmax-inlines",
      "50",
      "-Wunused:all",
      "-Wconf:cat=deprecation&origin=io.decentralchain.protobuf.transaction.InvokeScriptResult.*:s",
      "-Wconf:cat=deprecation&origin=com.decentralchain.state.InvokeScriptResult.*:s",
      "-Wconf:cat=deprecation&origin=com\\.decentralchain\\.(lang\\..*|JsApiUtils)&origin=com\\.decentralchain\\.lang\\.v1\\.compiler\\.Terms\\.LET_BLOCK:s",
      "-Wconf:src=src_managed/.*:s"
    ),
    crossPaths        := false,
    cancelable        := true,
    parallelExecution := true,
    testOptions += Tests.Argument("-oDF"),
    testOptions += Tests.Argument(TestFrameworks.ScalaTest, "-u", "target/test-reports")
  )
)

// ── lang ─────────────────────────────────────────────────────────────────────

lazy val lang =
  crossProject(JSPlatform, JVMPlatform)
    .withoutSuffixFor(JVMPlatform)
    .crossType(CrossType.Full)
    .in(file("lang"))
    // Semantic scalafix rules require semanticdb which Scala.js cannot produce.
    // JS platform uses .scalafix-js.conf (syntactic rules only).
    .jsSettings(scalafixConfig := Some(file(".scalafix-js.conf")))
    .settings(
      // Parser.scala uses `{ implicit (c: P[Any]) => }` syntax that scalameta
      // (scalafix's parser) cannot handle — exclude it from scalafix processing.
      Compile / scalafix / unmanagedSources ~= { _.filterNot(_.getName == "Parser.scala") },
      assembly / test := {},
      libraryDependencies ++= Dependencies.lang.value ++ Dependencies.test,
      inConfig(Compile)(
        Seq(
          sourceGenerators += Tasks.docSource,
          PB.targets += scalapb.gen(flatPackage = true) -> sourceManaged.value,
          PB.protoSources += PB.externalIncludePath.value,
          PB.generate / includeFilter := { (f: File) =>
            (** / "dcc" / "lang" / "*.proto").matches(f.toPath)
          },
          PB.deleteTargetDirectory := false
        )
      )
    )

lazy val `lang-jvm` = lang.jvm
  .enablePlugins(PublishedModule)
  .settings(
    name           := "RIDE Compiler",
    normalizedName := "lang",
    description    := "The RIDE smart contract language compiler",
    // The evaluator tree is excluded from instrumentation (sbt-scoverage 2.4.4 +
    // Scala 3.8.3 miscompiles context-passing closures — see KNOWN_ISSUES KNOWN-3).
    // 40 % threshold covers parser, compiler, estimator, and scripting-type code.
    coverageMinimumStmtTotal := 40,
    libraryDependencies ++= Seq(
      "org.scala-js" %% "scalajs-stubs" % "1.1.0" % Provided,
      Dependencies.logback,
      Dependencies.scalaLogging,
      Dependencies.gProto,
      Dependencies.gProto % "protobuf"
    )
  )

lazy val `lang-js` = lang.js
  .enablePlugins(VersionObject)
  .settings(
    V.scalaPackage := "com.decentralchain.lang",
    libraryDependencies ++= Dependencies.scalapbRuntimeJS.value,
    coverageEnabled := false // Scala.js — coverage not applicable
  )

lazy val `lang-testkit` = project
  .in(file("lang/testkit"))
  .dependsOn(`lang-jvm`)
  .enablePlugins(PublishedModule)
  .settings(
    libraryDependencies ++=
      Dependencies.test.map(_.withConfigurations(Some("compile"))) ++
        Dependencies.logDeps :+
        Dependencies.scalaLogging
  )

lazy val `lang-tests` = project
  .in(file("lang/tests"))
  .dependsOn(`lang-testkit`)

lazy val `lang-tests-js` = project
  .in(file("lang/tests-js"))
  .enablePlugins(ScalaJSPlugin)
  .dependsOn(`lang-js`)
  .settings(
    libraryDependencies += Dependencies.scalaJsTest.value,
    testFrameworks += new TestFramework("utest.runner.Framework"),
    // Semantic scalafix rules require semanticdb which Scala.js cannot produce.
    scalafixConfig := Some(file(".scalafix-js.conf"))
  )

// ── repl ─────────────────────────────────────────────────────────────────────

lazy val repl = crossProject(JSPlatform, JVMPlatform)
  .withoutSuffixFor(JVMPlatform)
  .crossType(CrossType.Full)
  .in(file("repl"))
  // Semantic scalafix rules require semanticdb which Scala.js cannot produce.
  // JS platform uses .scalafix-js.conf (syntactic rules only).
  .jsSettings(scalafixConfig := Some(file(".scalafix-js.conf")))
  .settings(
    libraryDependencies ++= Dependencies.scalapbRuntimeJS.value ++ Dependencies.circe.value ++ Seq(
      Dependencies.protoSchemasLib % "protobuf"
    ),
    inConfig(Compile)(
      Seq(
        PB.targets += scalapb.gen(flatPackage = true) -> sourceManaged.value,
        PB.protoSources += PB.externalIncludePath.value,
        PB.generate / includeFilter := { (f: File) =>
          (** / "dcc" / "*.proto").matches(f.toPath)
        },
        PB.deleteTargetDirectory := false
      )
    )
  )

lazy val `repl-jvm` = repl.jvm
  .dependsOn(`lang-jvm`, `lang-testkit`)
  .settings(
    // Blockchain evaluation paths require a live node to exercise fully.
    // 40 % threshold covers pure repl logic; evaluator calls are excluded from
    // instrumentation (sbt-scoverage 2.4.4 + Scala 3.8.3 bug — see KNOWN_ISSUES KNOWN-3).
    coverageMinimumStmtTotal := 40,
    libraryDependencies ++= Seq(
      "org.scala-js" %% "scalajs-stubs" % "1.1.0" % Provided,
      Dependencies.sttp3
    )
  )

lazy val `repl-js` = repl.js
  .dependsOn(`lang-js`)
  .settings(
    coverageEnabled := false, // Scala.js — coverage not applicable
    libraryDependencies ++= Dependencies.scalapbRuntimeJS.value ++ Seq(
      "org.scala-js" %%% "scala-js-macrotask-executor" % "1.1.1"
    )
  )

// ── aggregate root ───────────────────────────────────────────────────────────

lazy val `dcc-ride` = (project in file("."))
  .aggregate(
    `lang-js`,
    `lang-jvm`,
    `lang-tests`,
    `lang-tests-js`,
    `lang-testkit`,
    `repl-js`,
    `repl-jvm`
  )

// ── coverage ─────────────────────────────────────────────────────────────────

ThisBuild / coverageEnabled := false // enable per-run: sbt coverage test
// Default global minimum is 0; each production JVM sub-project sets its own floor.
// lang-jvm: 40 % (evaluator tree excluded — see KNOWN_ISSUES KNOWN-3)
// repl-jvm: 40 % (blockchain eval paths untestable in isolation — see KNOWN_ISSUES KNOWN-3)
// Scala.js builds and test-only projects: coverageEnabled := false / no floor
ThisBuild / coverageMinimumStmtTotal := 0
ThisBuild / coverageFailOnMinimum    := true
// Exclude generated protobuf sources and the ENTIRE evaluator tree.
// sbt-scoverage 2.4.4 miscompiles context-passing closures under Scala 3.8.3:
// ALL files in the evaluator package (including ctx/, ctx/impl/) are affected.
// The scoverage instrumentation causes NativeFunction closures to return BoxedUnit
// instead of their declared type, producing ClassCastExceptions at runtime.
// Correctness of the evaluator is verified by the un-instrumented Phase-1 `test`.
// ctx/impl coverage would ideally be measured; tracked in KNOWN_ISSUES KNOWN-3.
ThisBuild / coverageExcludedFiles :=
  ".*/src_managed/.*" +
    ";.*/lang/v1/evaluator/.*"
ThisBuild / coverageExcludedPackages := "<empty>;.*\\.protobuf\\..*"

// ── Bulletproof quality gate ──────────────────────────────────────────────────
// Two-phase gate: (1) full correctness — ALL tests must pass; (2) coverage — JVM
// projects only with the evaluator package excluded (see coverageExcludedFiles).
//
// Why two phases?
//   sbt-scoverage 2.4.4 miscompiles the evaluator package under Scala 3.8.3:
//   context-passing closures return BoxedUnit instead of their declared type when
//   instrumented. Correctness is verified by the un-instrumented `test` command.
//   Coverage is measured over the compiler, parser, and other instrumentation-safe code.
//   See KNOWN_ISSUES.md → KNOWN-3 for details.
addCommandAlias(
  "bulletproof",
  "; scalafmtCheckAll" +
    "; scalafixAll --check" +
    "; undeclaredCompileDependencies" +
    "; unusedCompileDependencies" +
    // Phase 1: full correctness gate (all platforms, no instrumentation)
    "; test" +
    // Phase 2: coverage gate — JVM only, evaluator tree excluded from instrumentation
    // Per-project thresholds: lang ≥ 40 %, repl ≥ 40 %  (JS builds excluded entirely)
    "; coverage" +
    "; lang-tests/test" +
    "; repl/test" +
    "; lang/coverageReport" +
    "; repl/coverageReport" +
    "; set ThisBuild/coverageEnabled := false"
)
