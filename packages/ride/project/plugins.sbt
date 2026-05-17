resolvers ++= Seq(
  Resolver.typesafeRepo("releases"),
  Resolver.sbtPluginRepo("releases")
)

// Must go before Scala.js plugins
addSbtPlugin("com.thesamet" % "sbt-protoc" % "1.0.8")

libraryDependencies += "com.thesamet.scalapb" %% "compilerplugin" % "1.0.0-alpha.3"

Seq(
  "com.github.sbt"     % "sbt-git"                  % "2.1.0",
  "org.portable-scala" % "sbt-scalajs-crossproject" % "1.3.2",
  "org.scala-js"       % "sbt-scalajs"              % "1.21.0",
  "org.scalameta"      % "sbt-scalafmt"             % "2.6.1",
  "org.scoverage"      % "sbt-scoverage"            % "2.4.4",
  "ch.epfl.scala"      % "sbt-scalafix"             % "0.14.6",
  "com.eed3si9n"       % "sbt-assembly"             % "2.3.1"
).map(addSbtPlugin)

// Build-time dependencies for Tasks.scala
libraryDependencies ++= Seq(
  "com.fasterxml.jackson.module" %% "jackson-module-scala" % "2.21.0",
  "org.hjson"                     % "hjson"                % "3.1.0"
)
