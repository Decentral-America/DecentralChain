package com.decentralchain.test.builtInFunctions.string

import com.decentralchain.JsTestBase
import testHelpers.GeneratorContractsForBuiltInFunctions
import testHelpers.RandomDataGenerator.{
  randomAddressDataArrayElement,
  randomInt,
  randomStringArrayElement,
  randomUnionArrayElement
}
import testHelpers.TestDataConstantsAndMethods.{
  actualVersions,
  rideV3Result,
  CANT_FIND_A_FUNCTION_OVERLOAD,
  GreaterV3ResultStringEntry
}
import utest.{test, Tests}

object DropRight extends JsTestBase {
  private val dropRight                     = s"dropRight(callerTestData, $randomInt)"
  private val dropRightArgBeforeFunction    = s"callerTestData.dropRight($randomInt)"
  private val invalidDropRight              = s"dropRight(callerTestData)"
  private val invalidDropRightArgBeforeFunc = s"callerTestData.dropRight(callerTestData, $randomInt)"

  val tests: Tests = Tests {
    test("RIDE-213. function dropRight should compile for valid data") {
      for (version <- actualVersions) {
        val precondition = new GeneratorContractsForBuiltInFunctions("", version)
        for (
          (data, function) <- Seq(
            (randomStringArrayElement, dropRight),
            (randomStringArrayElement, dropRightArgBeforeFunction)
          )
        ) {
          val script = precondition.codeWithoutMatcher(data, function, rideV3Result, GreaterV3ResultStringEntry)
          assertCompileSuccessDApp(script, version)
        }
      }
    }

    test("RIDE-214. function dropRight throw a compilation error for invalid data") {
      for (version <- actualVersions) {
        val precondition = new GeneratorContractsForBuiltInFunctions("", version)
        for (
          (data, function) <- Seq(
            (randomAddressDataArrayElement, dropRight),
            (randomUnionArrayElement, dropRightArgBeforeFunction),
            (randomStringArrayElement, invalidDropRight),
            (randomStringArrayElement, invalidDropRightArgBeforeFunc)
          )
        ) {
          val script = precondition.codeWithoutMatcher(data, function, rideV3Result, GreaterV3ResultStringEntry)
          assertCompileErrorDApp(script, version, CANT_FIND_A_FUNCTION_OVERLOAD)
        }
      }
    }
  }
}
