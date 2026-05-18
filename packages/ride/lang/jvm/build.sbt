homepage := Some(url("https://docs.decentralchain.io/en/ride/"))

lazy val listComplexFunctions = inputKey[File]("List functions with complexity > 1")

listComplexFunctions := Tasks.listComplexFunctions.evaluated

inTask(assembly)(
  Seq(
    test                  := {},
    assemblyJarName       := s"file-compiler.jar",
    assemblyMergeStrategy := {
      case p if p.endsWith(".proto") || p.endsWith("module-info.class") || p.endsWith("io.netty.versions.properties") =>
        MergeStrategy.discard
      case "scala-collection-compat.properties" | "META-INF/versions/9/OSGI-INF/MANIFEST.MF" =>
        MergeStrategy.discard
      case p if Set("scala/util/control/compat", "scala/collection/compat").exists(p.replace('\\', '/').contains) =>
        MergeStrategy.last
      case other =>
        (assembly / assemblyMergeStrategy).value(other)
    }
  )
)
