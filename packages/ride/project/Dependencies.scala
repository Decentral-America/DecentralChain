import org.portablescala.sbtplatformdeps.PlatformDepsPlugin.autoImport.*
import sbt.Keys.scalaVersion
import sbt.{Def, *}
import scalapb.compiler.Version.scalapbVersion

// Trimmed Dependencies for the standalone packages/ride build.
// Only includes dependencies needed by lang/ and repl/ subprojects.
object Dependencies {

  val gProtoVersion = "4.34.1"
  val gProto        = "com.google.protobuf" % "protobuf-java" % gProtoVersion

  val overrides = Def.setting(
    Seq(
      "org.scala-lang" %% "scala3-library" % scalaVersion.value,
      gProto
    )
  )

  // DecentralChain protobuf schemas (wire-format compatibility with Waves protocol)
  lazy val protoSchemasLib =
    ("io.decentralchain" % "protobuf-schemas" % "1.6.1").classifier("protobuf-src").intransitive(())

  private def web3jModule(module: String) = "org.web3j" % module % "5.0.2"

  def monixModule(module: String): Def.Initialize[ModuleID] =
    Def.setting("io.monix" %%% s"monix-$module" % "3.4.1")

  val googleGuava = "com.google.guava"  % "guava"           % "33.6.0-jre"
  val logback     = "ch.qos.logback"    % "logback-classic" % "1.5.32"
  val curve25519  = "io.decentralchain" % "curve25519-java" % "0.6.6"

  val scalaLogging: ModuleID = "com.typesafe.scala-logging" %% "scala-logging" % "3.9.6"

  val scalaTest   = "org.scalatest" %% "scalatest" % "3.2.19" % Test
  val scalaJsTest = Def.setting("com.lihaoyi" %%% "utest" % "0.9.5" % Test)

  private def sttp3Module(module: String) = "com.softwaremill.sttp.client3" %% module % "3.11.0"
  val sttp3                               = sttp3Module("core")

  lazy val circe: Def.Initialize[Seq[ModuleID]] = Def.setting {
    val circeVersion = "0.14.15"
    Seq(
      "io.circe" %%% "circe-core",
      "io.circe" %%% "circe-parser"
    ).map(_ % circeVersion)
  }

  def amazonCorretto(c: String): ModuleID =
    ("software.amazon.cryptools" % "AmazonCorrettoCryptoProvider" % "2.5.0").classifier(c)

  val cryptoProviders = Seq(
    "org.conscrypt" % "conscrypt-openjdk-uber" % "2.5.2",
    amazonCorretto("osx-aarch_64"),
    "org.bouncycastle" % "bcprov-jdk18on" % "1.84"
  )

  val lang = Def.setting(
    Seq(
      monixModule("eval").value,
      "org.typelevel" %%% "cats-core" % "2.13.0",
      "com.lihaoyi"   %%% "fastparse" % "3.1.1",
      "org.typelevel" %%% "cats-mtl"  % "1.6.0",
      "ch.obermuhlner"  % "big-math"  % "2.3.2",
      googleGuava,
      curve25519,
      "io.decentralchain" % "zwaves" % "0.2.1.0",
      web3jModule("crypto").excludeAll(ExclusionRule("org.bouncycastle", "bcprov-jdk15on")),
      protoSchemasLib % "protobuf"
    ) ++ cryptoProviders
  )

  lazy val scalapbRuntimeJS = Def.setting(
    Seq(
      "com.thesamet.scalapb" %%% "scalapb-runtime" % scalapbVersion,
      "com.thesamet.scalapb" %%% "scalapb-runtime" % scalapbVersion % "protobuf"
    )
  )

  lazy val test: Seq[ModuleID] = scalaTest +: Seq(
    logback,
    "org.scalatestplus" %% "scalacheck-1-18" % "3.2.19.0",
    "org.scalacheck"    %% "scalacheck"      % "1.19.0",
    "org.mockito"        % "mockito-core"    % "5.23.0",
    "org.scalamock"     %% "scalamock"       % "7.5.5"
  ).map(_ % Test)

  lazy val logDeps: Seq[ModuleID] = Seq(logback % Runtime)
}
