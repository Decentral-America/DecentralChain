scalaJSLinkerConfig ~= {
  _.withModuleKind(ModuleKind.ESModule)
}

Compile / fullOptJS / artifactPath := baseDirectory.value / "dist" / "lang.js"
