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
// Include ~/.m2/repository so locally-installed io.decentralchain JARs resolve.
ThisBuild / resolvers += Resolver.mavenLocal
ThisBuild / PB.protocVersion   := Dependencies.gProtoVersion

ThisBuild / dependencyOverrides ++= Dependencies.overrides.value

ThisBuild / pomIncludeRepository := { _ => false }
ThisBuild / publishMavenStyle    := true
ThisBuild / publishTo := {
  val centralSnapshots = "https://central.sonatype.com/repository/maven-snapshots/"
  if (isSnapshot.value) Some("central-snapshots" at centralSnapshots)
  else localStaging.value
}

inScope(Global)(
  Seq(
    scalaVersion         := "3.8.1",
    organization         := "io.decentralchain",
    organizationName     := "DecentralChain",
    organizationHomepage := Some(url("https://decentralchain.io")),
    scmInfo := Some(
      ScmInfo(
        url("https://github.com/Decentral-America/DecentralChain"),
        "scm:git:https://github.com/Decentral-America/DecentralChain.git"
      )
    ),
    licenses        := Seq(("MIT", url("https://github.com/Decentral-America/DecentralChain/blob/main/packages/ride/LICENSE"))),
    publish / skip  := true,
    scalacOptions ++= Seq(
      "-feature",
      "-deprecation",
      "-unchecked",
      "-language:higherKinds",
      "-language:implicitConversions",
      "-language:postfixOps",
      "-Xmax-inlines", "50",
      "-Wunused:all",
      "-Wconf:cat=deprecation&origin=com.wavesplatform.protobuf.transaction.InvokeScriptResult.*:s",
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
    .settings(
      assembly / test := {},
      libraryDependencies ++= Dependencies.lang.value ++ Dependencies.test,
      inConfig(Compile)(
        Seq(
          sourceGenerators += Tasks.docSource,
          PB.targets += scalapb.gen(flatPackage = true) -> sourceManaged.value,
          PB.protoSources += PB.externalIncludePath.value,
          PB.generate / includeFilter := { (f: File) =>
            (** / "waves" / "lang" / "*.proto").matches(f.toPath)
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
    libraryDependencies ++= Dependencies.scalapbRuntimeJS.value
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
    testFrameworks += new TestFramework("utest.runner.Framework")
  )

// ── repl ─────────────────────────────────────────────────────────────────────

lazy val repl = crossProject(JSPlatform, JVMPlatform)
  .withoutSuffixFor(JVMPlatform)
  .crossType(CrossType.Full)
  .in(file("repl"))
  .settings(
    libraryDependencies ++= Dependencies.scalapbRuntimeJS.value ++ Dependencies.circe.value ++ Seq(
      Dependencies.protoSchemasLib % "protobuf"
    ),
    inConfig(Compile)(
      Seq(
        PB.targets += scalapb.gen(flatPackage = true) -> sourceManaged.value,
        PB.protoSources += PB.externalIncludePath.value,
        PB.generate / includeFilter := { (f: File) =>
          (** / "waves" / "*.proto").matches(f.toPath)
        },
        PB.deleteTargetDirectory := false
      )
    )
  )

lazy val `repl-jvm` = repl.jvm
  .dependsOn(`lang-jvm`, `lang-testkit`)
  .settings(
    libraryDependencies ++= Seq(
      "org.scala-js" %% "scalajs-stubs" % "1.1.0" % Provided,
      Dependencies.sttp3
    )
  )

lazy val `repl-js` = repl.js
  .dependsOn(`lang-js`)
  .settings(
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

ThisBuild / coverageEnabled            := false // enable per-run: sbt coverage test
ThisBuild / coverageMinimumStmtTotal   := 60
ThisBuild / coverageFailOnMinimum      := true
ThisBuild / coverageExcludedPackages   := "<empty>;.*\\.protobuf\\..*"
