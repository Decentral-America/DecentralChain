homepage := Some(url("https://docs.decentralchain.io/en/ride/"))

lazy val listComplexFunctions = inputKey[File]("List functions with complexity > 1")

listComplexFunctions := Tasks.listComplexFunctions.evaluated
