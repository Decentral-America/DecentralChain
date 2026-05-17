package com.decentralchain.test.builtInFunctions.string

import com.decentralchain.JsTestBase
import testHelpers.GeneratorContractsForBuiltInFunctions
import testHelpers.RandomDataGenerator.{randomInt, randomStringArrayElement}
import testHelpers.TestDataConstantsAndMethods.{actualVersions, intList, stringList, CANT_FIND_A_FUNCTION_OVERLOAD}
import utest.{test, Tests}

object LastIndexOf extends JsTestBase {
  private val lastIndexOf                        = "lastIndexOf(bar, foo)"
  private val lastIndexOfWithOffset              = s"lastIndexOf(bar, foo, $randomInt)"
  private val lastIndexOfArgBeforeFunc           = "bar.lastIndexOf(foo)"
  private val lastIndexOfWithOffsetArgBeforeFunc = s"bar.lastIndexOf(foo, $randomInt)"
  private val invalidLastIndexOf                 = "lastIndexOf()"

  val tests: Tests = Tests {
    test("RIDE-217. function lastIndexOf should compile for valid data") {
      for (version <- actualVersions) {
        val precondition = new GeneratorContractsForBuiltInFunctions("", version)
        for (
          (firstData, secondData, function) <- Seq(
            (randomStringArrayElement, randomStringArrayElement, lastIndexOf),
            (randomStringArrayElement, randomStringArrayElement, lastIndexOfWithOffset),
            (randomStringArrayElement, randomStringArrayElement, lastIndexOfArgBeforeFunc),
            (randomStringArrayElement, randomStringArrayElement, lastIndexOfWithOffsetArgBeforeFunc)
          )
        ) {
          val script = precondition.simpleRideCode(firstData, secondData, function)
          assertCompileSuccessDApp(script, version)
        }
      }
    }

    test("RIDE-218. function lastIndexOf - Non-matching types - Can't find a function overload") {
      for (version <- actualVersions) {
        val precondition = new GeneratorContractsForBuiltInFunctions("", version)
        for (
          (firstData, secondData, function) <- Seq(
            (stringList, randomStringArrayElement, lastIndexOf),
            (randomInt.toString, randomStringArrayElement, lastIndexOfArgBeforeFunc),
            (stringList, randomStringArrayElement, lastIndexOfWithOffset),
            (randomInt.toString, randomStringArrayElement, lastIndexOfWithOffsetArgBeforeFunc),
            (randomInt.toString, intList, invalidLastIndexOf)
          )
        ) {
          val script = precondition.simpleRideCode(firstData, secondData, function)
          assertCompileErrorDApp(script, version, CANT_FIND_A_FUNCTION_OVERLOAD)
        }
      }
    }
  }
}
