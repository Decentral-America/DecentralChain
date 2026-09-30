resolvers ++= Seq(
  Resolver.typesafeRepo("releases"),
  Resolver.sbtPluginRepo("releases")
)

// Must go before Scala.js plugins
addSbtPlugin("com.thesamet" % "sbt-protoc" % "1.0.8")

libraryDependencies += "com.thesamet.scalapb" %% "compilerplugin" % "1.0.0-alpha.6"

Seq(
  "com.github.sbt"     % "sbt-git"                  % "2.2.0",
  "com.github.sbt"     % "sbt-pgp"                  % "2.3.2",
  "org.portable-scala" % "sbt-scalajs-crossproject" % "1.4.0",
  "org.scala-js"       % "sbt-scalajs"              % "1.22.0",
  "org.scalameta"      % "sbt-scalafmt"             % "2.6.2",
  "org.scoverage"      % "sbt-scoverage"            % "2.4.4",
  "ch.epfl.scala"      % "sbt-scalafix"             % "0.14.9",
  "com.eed3si9n"       % "sbt-assembly"             % "2.5.0",
  "org.xerial.sbt"     % "sbt-sonatype"             % "3.12.2",
  // sbt-explicit-dependencies 0.3.1 — undeclared/unused dep detection for bulletproof gate
  "com.github.cb372" % "sbt-explicit-dependencies" % "0.3.1"
).map(addSbtPlugin)

// Build-time dependencies for Tasks.scala
libraryDependencies ++= Seq(
  "com.fasterxml.jackson.module" %% "jackson-module-scala" % "2.22.3.1",
  "org.hjson"                     % "hjson"                % "3.1.0"
)
