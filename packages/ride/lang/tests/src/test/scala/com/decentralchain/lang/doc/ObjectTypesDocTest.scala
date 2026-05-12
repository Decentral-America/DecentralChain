package com.decentralchain.lang.doc

import com.decentralchain.DocSource
import com.decentralchain.lang.directives.values.*
import com.decentralchain.lang.utils.*
import com.decentralchain.lang.v1.compiler.Types.CASETYPEREF
import com.decentralchain.test.*
import org.scalatest.exceptions.TestFailedException

class ObjectTypesDocTest extends PropSpec {
  private def getDocFields(typeName: String, version: StdLibVersion): List[(String, String)] =
    DocSource.typeData
      .getOrElse(
        (typeName, version.id),
        throw new Exception(s"Type $typeName not found for $version")
      )

  private def fieldsString(fields: List[(String, String)]): String =
    fields.map { case (name, t) => s"$name: $t" }.mkString("\n\n", "\n", "\n\n")

  property("all object types") {
    lazyContexts.foreach { case ((ds, _, _, _), ctx) =>
      ctx().types
        .collect { case CASETYPEREF(name, fields, _) =>
          val codeFields = fields.map { case (name, t) => (name, t.toString) }
          val docFields =
            if (ds.scriptType == Asset)
              getDocFields(name, ds.stdLibVersion).filter(_._1 != "proofs")
            else
              getDocFields(name, ds.stdLibVersion)

          if (docFields != codeFields)
            throw new TestFailedException(
              s"For type '$name' in ${ds.stdLibVersion} " +
                s"documented fields ${fieldsString(docFields)} " +
                s"differ from " +
                s"code fields ${fieldsString(codeFields)}",
              0
            )
        }
    }
  }
}
