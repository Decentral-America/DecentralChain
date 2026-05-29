package com.decentralchain.test.builtInFunctions.blockchain

import com.decentralchain.JsTestBase
import com.decentralchain.lang.directives.values.V3
import testHelpers.GeneratorContractsForBuiltInFunctions
import testHelpers.RandomDataGenerator.{
  randomAddressDataArrayElement,
  randomAliasDataArrayElement,
  randomDigestAlgorithmTypeArrayElement,
  randomStringArrayElement
}
import testHelpers.TestDataConstantsAndMethods.{
  actualVersionsWithoutV3,
  invalidFunctionError,
  nonMatchingTypes,
  thisVariable
}
import utest.{test, Tests}

object DccBalance extends JsTestBase {
  private val dccBalance              = "dccBalance(callerTestData)"
  private val dccBalanceArgBeforeFunc = "callerTestData.dccBalance()"
  private val invalidDccBalance       = "dccBalance()"
  private val invalidDccBalanceArg    = s"callerTestData.dccBalance(callerTestData)"

  val tests: Tests = Tests {
    test("RIDE-46. dccBalance function for version V4 and more should compile for address, alias, and 'this'") {
      for (version <- actualVersionsWithoutV3) {
        val precondition = new GeneratorContractsForBuiltInFunctions("BalanceDetails", version)
        for (
          (data, function) <- Seq(
            (randomAddressDataArrayElement, dccBalance),
            (randomAliasDataArrayElement, dccBalance),
            (thisVariable, dccBalance),
            (randomAddressDataArrayElement, dccBalanceArgBeforeFunc),
            (randomAliasDataArrayElement, dccBalanceArgBeforeFunc),
            (thisVariable, dccBalanceArgBeforeFunc)
          )
        ) {
          val script = precondition.onlyMatcherContract(data, function)
          assertCompileSuccessDApp(script, version)
        }
      }
    }

    test("RIDE-47. Negative cases for dccBalance function for version V4 and more") {
      for (version <- actualVersionsWithoutV3) {
        val precondition = new GeneratorContractsForBuiltInFunctions("BalanceDetails", version)
        for (
          (data, function, error) <- Seq(
            (randomDigestAlgorithmTypeArrayElement, dccBalance, nonMatchingTypes("Address|Alias")),
            (randomStringArrayElement, dccBalanceArgBeforeFunc, nonMatchingTypes("Address|Alias")),
            (randomAddressDataArrayElement, invalidDccBalanceArg, invalidFunctionError("dccBalance", 1)),
            (randomAliasDataArrayElement, invalidDccBalance, invalidFunctionError("dccBalance", 1))
          )
        ) {
          val script = precondition.onlyMatcherContract(data, function)
          assertCompileErrorDApp(script, version, error)
        }
      }
    }

    test("RIDE-48. Functions dccBalance for V3 compiles for address, alias and 'this'") {
      val precondition = new GeneratorContractsForBuiltInFunctions("Int", V3)
      for (
        (data, function) <- Seq(
          (randomAddressDataArrayElement, dccBalance),
          (randomAliasDataArrayElement, dccBalance),
          (thisVariable, dccBalance),
          (randomAddressDataArrayElement, dccBalanceArgBeforeFunc),
          (randomAliasDataArrayElement, dccBalanceArgBeforeFunc),
          (thisVariable, dccBalanceArgBeforeFunc)
        )
      ) {
        val script = precondition.onlyMatcherContract(data, function)
        assertCompileSuccessDApp(script, V3)
      }
    }

    test("RIDE-49. compilation error: dccBalance for V3 Non-matching type") {
      val precondition = new GeneratorContractsForBuiltInFunctions("Int", V3)
      for (
        (data, function, error) <- Seq(
          (randomDigestAlgorithmTypeArrayElement, dccBalance, nonMatchingTypes("Address|Alias")),
          (randomStringArrayElement, dccBalanceArgBeforeFunc, nonMatchingTypes("Address|Alias")),
          (randomAddressDataArrayElement, invalidDccBalanceArg, invalidFunctionError("dccBalance", 1)),
          (randomAliasDataArrayElement, invalidDccBalance, invalidFunctionError("dccBalance", 1))
        )
      ) {
        val script = precondition.onlyMatcherContract(data, function)
        assertCompileErrorDApp(script, V3, error)
      }
    }
  }
}
