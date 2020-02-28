import * as identifer from "./identifer";
import * as type from "./type";

/**
 * 出力するコードの種類
 */
export const enum CodeType {
  /** Enumの値は数値リテラルとして展開される. 型情報が出力されない */
  JavaScript,
  /** 型情報も出力される */
  TypeScript
}

/**
 * コードを文字列にする
 */
export const toString = (
  code: type.Code,
  collectedData: type.CollectedData,
  codeType: CodeType
): string => {
  const importCode =
    [...collectedData.importedModuleNameIdentiferMap.entries()]
      .map(
        ([name, identifer]) =>
          "import * as " + (identifer as string) + ' from "' + name + '";'
      )
      .join("\n") + "\n";

  const definitionCode =
    code.exportDefinition
      .map(definition =>
        definitionToString(definition, collectedData, codeType)
      )
      .join("") + "\n";

  const statementCode = statementListToString(
    code.statementList,
    0,
    collectedData,
    codeType
  );

  if (code.statementList.length === 0) {
    return importCode + definitionCode;
  }
  return importCode + definitionCode + statementCode;
};

const definitionToString = (
  definition: type.Definition,
  collectedData: type.CollectedData,
  codeType: CodeType
): string => {
  switch (definition._) {
    case type.Definition_.TypeAlias:
      if (codeType === CodeType.JavaScript) {
        return "";
      }
      return typeAliasToString(definition.typeAlias, collectedData);

    case type.Definition_.Enum:
      if (codeType === CodeType.JavaScript) {
        return "";
      }
      return enumToString(definition.enum_);

    case type.Definition_.Function:
      return functionToString(definition.function_, collectedData, codeType);

    case type.Definition_.Variable:
      return variableToString(definition.variable, collectedData, codeType);
  }
};

const typeAliasToString = (
  typeAlias: type.TypeAlias,
  collectedData: type.CollectedData
): string => {
  return (
    documentToString(typeAlias.document) +
    "export type " +
    (typeAlias.name as string) +
    " = " +
    typeExprToString(typeAlias.typeExpr, collectedData) +
    ";\n\n"
  );
};

const enumToString = (enum_: type.Enum): string => {
  return (
    documentToString(enum_.document) +
    "export const enum" +
    " {\n" +
    enum_.tagList
      .map(tag => documentToString(tag.document) + "  " + (tag.name as string))
      .join(",\n") +
    "\n}\n\n"
  );
};

const functionToString = (
  function_: type.Function,
  collectedData: type.CollectedData,
  codeType: CodeType
): string => {
  return (
    documentToString(
      function_.document +
        "\n" +
        parameterListToDocument(function_.parameterList)
    ) +
    "export const " +
    (function_.name as string) +
    " = (" +
    function_.parameterList
      .map(
        parameter =>
          (parameter.name as string) +
          ": " +
          typeExprToString(parameter.typeExpr, collectedData)
      )
      .join(", ") +
    "): " +
    typeExprToString(function_.returnType, collectedData) +
    " => " +
    lambdaBodyToString(function_.statementList, 0, collectedData, codeType) +
    ";\n\n"
  );
};

const variableToString = (
  variable: type.Variable,
  collectedData: type.CollectedData,
  codeType: CodeType
): string => {
  return (
    documentToString(variable.document) +
    "export const " +
    (variable.name as string) +
    ": " +
    typeExprToString(variable.typeExpr, collectedData) +
    " = " +
    exprToString(variable.expr, 0, collectedData, codeType) +
    ";\n\n"
  );
};

const documentToString = (document: string): string =>
  document === ""
    ? ""
    : "/**\n" +
      document
        .split("\n")
        .map(line => (line === "" ? " *" : " * " + line))
        .join("\n") +
      "\n */\n";

const parameterListToDocument = (
  parameterList: ReadonlyArray<type.ParameterWithDocument>
): string =>
  parameterList
    .map(parameter =>
      parameter.document === "" ? "" : "@param " + parameter.document + "\n"
    )
    .join("");

/**
 * ラムダ式の本体 文が1つでreturn exprだった場合、returnを省略する形にする
 * @param statementList
 * @param indent
 */
export const lambdaBodyToString = (
  statementList: ReadonlyArray<type.Statement>,
  indent: number,
  collectedData: type.CollectedData,
  codeType: CodeType
): string => {
  if (
    statementList.length === 1 &&
    statementList[0]._ === type.Statement_.Return
  ) {
    return exprToStringWithCombineStrength(
      type.lambda([], type.typeVoid, []),
      statementList[0].expr,
      indent,
      collectedData,
      codeType
    );
  }
  return statementListToString(statementList, indent, collectedData, codeType);
};

/**
 * 式をコードに変換する
 * @param expr 式
 */
const exprToString = (
  expr: type.Expr,
  indent: number,
  collectedData: type.CollectedData,
  codeType: CodeType
): string => {
  switch (expr._) {
    case type.Expr_.NumberLiteral:
      return expr.value.toString();

    case type.Expr_.StringLiteral:
      return stringLiteralValueToString(expr.value);

    case type.Expr_.BooleanLiteral:
      return expr.value ? "true" : "false";

    case type.Expr_.UndefinedLiteral:
      return "undefined";

    case type.Expr_.NullLiteral:
      return "null";

    case type.Expr_.ArrayLiteral:
      return (
        "[" +
        expr.exprList
          .map(element =>
            exprToString(element, indent, collectedData, codeType)
          )
          .join("," + codeTypeSpace(codeType)) +
        "]"
      );

    case type.Expr_.ObjectLiteral:
      return (
        "{" +
        codeTypeSpace(codeType) +
        [...expr.memberList.entries()]
          .map(
            ([key, value]) =>
              (identifer.isIdentifer(key)
                ? key
                : stringLiteralValueToString(key)) +
              (":" + codeTypeSpace(codeType)) +
              exprToString(value, indent, collectedData, codeType)
          )
          .join(", ") +
        codeTypeSpace(codeType) +
        "}"
      );

    case type.Expr_.UnaryOperator:
      return (
        expr.operator +
        exprToStringWithCombineStrength(
          expr,
          expr.expr,
          indent,
          collectedData,
          codeType
        )
      );
    case type.Expr_.BinaryOperator:
      return binaryOperatorExprToString(
        expr.operator,
        expr.left,
        expr.right,
        indent,
        collectedData,
        codeType
      );
    case type.Expr_.ConditionalOperator:
      return (
        exprToStringWithCombineStrength(
          expr,
          expr.condition,
          indent,
          collectedData,
          codeType
        ) +
        "?" +
        exprToStringWithCombineStrength(
          expr,
          expr.thenExpr,
          indent,
          collectedData,
          codeType
        ) +
        ":" +
        exprToStringWithCombineStrength(
          expr,
          expr.elseExpr,
          indent,
          collectedData,
          codeType
        )
      );

    case type.Expr_.Lambda:
      switch (codeType) {
        case CodeType.TypeScript:
          return (
            "(" +
            expr.parameterList
              .map(
                o =>
                  (o.name as string) +
                  ": " +
                  typeExprToString(o.typeExpr, collectedData)
              )
              .join(", ") +
            "): " +
            typeExprToString(expr.returnType, collectedData) +
            "=>" +
            lambdaBodyToString(
              expr.statementList,
              indent,
              collectedData,
              codeType
            )
          );
        case CodeType.JavaScript:
          return (
            "(" +
            expr.parameterList.map(o => o.name).join(",") +
            ")=>" +
            lambdaBodyToString(
              expr.statementList,
              indent,
              collectedData,
              codeType
            )
          );
      }
      break;

    case type.Expr_.Variable:
      return expr.name;

    case type.Expr_.ImportedVariable: {
      const nameSpaceIdentifer = collectedData.importedModuleNameIdentiferMap.get(
        expr.moduleName
      );
      if (nameSpaceIdentifer === undefined) {
        throw Error(
          "収集されなかった, モジュールがある moduleName=" + expr.moduleName
        );
      }
      return (nameSpaceIdentifer as string) + "." + expr.name;
    }

    case type.Expr_.Get:
      return (
        exprToStringWithCombineStrength(
          expr,
          expr.expr,
          indent,
          collectedData,
          codeType
        ) +
        (expr.propertyName._ === type.Expr_.StringLiteral &&
        identifer.isIdentifer(expr.propertyName.value)
          ? "." + expr.propertyName.value
          : "[" +
            exprToString(expr.propertyName, indent, collectedData, codeType) +
            "]")
      );

    case type.Expr_.Call:
      return (
        exprToStringWithCombineStrength(
          expr,
          expr.expr,
          indent,
          collectedData,
          codeType
        ) +
        "(" +
        expr.parameterList
          .map(e => exprToString(e, indent, collectedData, codeType))
          .join("," + codeTypeSpace(codeType)) +
        ")"
      );

    case type.Expr_.New:
      return (
        "new " +
        exprToStringWithCombineStrength(
          expr,
          expr.expr,
          indent,
          collectedData,
          codeType
        ) +
        "(" +
        expr.parameterList
          .map(e => exprToString(e, indent, collectedData, codeType))
          .join("," + codeTypeSpace(codeType)) +
        ")"
      );

    case type.Expr_.EnumTag:
      switch (codeType) {
        case CodeType.JavaScript: {
          const tagList = collectedData.enumTagListMap.get(expr.typeName);
          if (tagList === undefined) {
            throw new Error(
              "Enumの型を収集できなかった enum type name =" +
                (expr.typeName as string)
            );
          }
          return (
            tagList.indexOf(expr.tagName).toString() +
            "/* " +
            (expr.tagName as string) +
            " */"
          );
        }
        case CodeType.TypeScript:
          return (expr.typeName as string) + "." + (expr.tagName as string);
      }
      break;

    case type.Expr_.BuiltIn:
      return builtInToString(expr.builtIn);
  }
};

const codeTypeSpace = (codeType: CodeType): string =>
  codeType === CodeType.TypeScript ? " " : "";

const stringLiteralValueToString = (value: string): string => {
  return (
    '"' +
    value
      .replace(/\\/gu, "\\\\")
      .replace(/"/gu, '\\"')
      .replace(/\r\n|\n/gu, "\\n") +
    '"'
  );
};

const enum Associativity {
  LeftToRight,
  RightToLeft
}

const binaryOperatorAssociativity = (
  binaryOperator: type.BinaryOperator
): Associativity => {
  switch (binaryOperator) {
    case "**":
      return Associativity.RightToLeft;
    case "*":
    case "/":
    case "%":
    case "+":
    case "-":
    case "<<":
    case ">>":
    case ">>>":
    case "<":
    case "<=":
    case "===":
    case "!==":
    case "&":
    case "^":
    case "|":
    case "&&":
    case "||":
      return Associativity.LeftToRight;
  }
};

const binaryOperatorExprToString = (
  operator: type.BinaryOperator,
  left: type.Expr,
  right: type.Expr,
  indent: number,
  collectedData: type.CollectedData,
  codeType: CodeType
): string => {
  const operatorExprCombineStrength = exprCombineStrength({
    _: type.Expr_.BinaryOperator,
    operator,
    left,
    right
  });
  const leftExprCombineStrength = exprCombineStrength(left);
  const rightExprCombineStrength = exprCombineStrength(right);
  const associativity = binaryOperatorAssociativity(operator);

  return (
    (operatorExprCombineStrength > leftExprCombineStrength ||
    (operatorExprCombineStrength === leftExprCombineStrength &&
      associativity === Associativity.RightToLeft)
      ? "(" + exprToString(left, indent, collectedData, codeType) + ")"
      : exprToString(left, indent, collectedData, codeType)) +
    (codeType === CodeType.TypeScript ? " " + operator + " " : operator) +
    (operatorExprCombineStrength > rightExprCombineStrength ||
    (operatorExprCombineStrength === rightExprCombineStrength &&
      associativity === Associativity.LeftToRight)
      ? "(" + exprToString(right, indent, collectedData, codeType) + ")"
      : exprToString(right, indent, collectedData, codeType))
  );
};

const exprToStringWithCombineStrength = (
  expr: type.Expr,
  target: type.Expr,
  indent: number,
  collectedData: type.CollectedData,
  codeType: CodeType
): string => {
  if (exprCombineStrength(expr) > exprCombineStrength(target)) {
    return "(" + exprToString(target, indent, collectedData, codeType) + ")";
  }
  return exprToString(target, indent, collectedData, codeType);
};

const exprCombineStrength = (expr: type.Expr): number => {
  switch (expr._) {
    case type.Expr_.NumberLiteral:
    case type.Expr_.StringLiteral:
    case type.Expr_.BooleanLiteral:
    case type.Expr_.NullLiteral:
    case type.Expr_.UndefinedLiteral:
    case type.Expr_.ArrayLiteral:
    case type.Expr_.Variable:
    case type.Expr_.ImportedVariable:
    case type.Expr_.BuiltIn:
      return 23;
    case type.Expr_.Lambda:
      return 22;
    case type.Expr_.ObjectLiteral:
      return 21;
    case type.Expr_.Get:
    case type.Expr_.Call:
    case type.Expr_.New:
    case type.Expr_.EnumTag:
      return 20;
    case type.Expr_.UnaryOperator:
      return 17;
    case type.Expr_.BinaryOperator:
      return binaryOperatorCombineStrength(expr.operator);
    case type.Expr_.ConditionalOperator:
      return 4;
  }
};

const binaryOperatorCombineStrength = (
  binaryOperator: type.BinaryOperator
): number => {
  switch (binaryOperator) {
    case "**":
      return 16;
    case "*":
    case "/":
    case "%":
      return 15;
    case "+":
    case "-":
      return 14;
    case "<<":
    case ">>":
    case ">>>":
      return 13;
    case "<":
    case "<=":
      return 12;
    case "===":
    case "!==":
      return 11;
    case "&":
      return 10;
    case "^":
      return 9;
    case "|":
      return 8;
    case "&&":
      return 6;
    case "||":
      return 5;
  }
};

export const statementListToString = (
  statementList: ReadonlyArray<type.Statement>,
  indent: number,
  collectedData: type.CollectedData,
  codeType: CodeType
): string =>
  "{\n" +
  statementList
    .map(statement =>
      statementToTypeScriptCodeAsString(
        statement,
        indent + 1,
        collectedData,
        codeType
      )
    )
    .join("\n") +
  "\n" +
  "  ".repeat(indent) +
  "}";

/**
 * 文をTypeScriptのコードに変換する
 * @param statement 文
 */
const statementToTypeScriptCodeAsString = (
  statement: type.Statement,
  indent: number,
  collectedData: type.CollectedData,
  codeType: CodeType
): string => {
  const indentString = "  ".repeat(indent);
  switch (statement._) {
    case type.Statement_.EvaluateExpr:
      return (
        indentString +
        exprToString(statement.expr, indent, collectedData, codeType) +
        ";"
      );

    case type.Statement_.Set:
      return (
        indentString +
        exprToString(statement.targetObject, indent, collectedData, codeType) +
        codeTypeSpace(codeType) +
        (statement.operator === null ? "" : statement.operator) +
        "=" +
        codeTypeSpace(codeType) +
        exprToString(statement.expr, indent, collectedData, codeType) +
        ";"
      );

    case type.Statement_.If:
      return (
        indentString +
        "if (" +
        exprToString(statement.condition, indent, collectedData, codeType) +
        ") " +
        statementListToString(
          statement.thenStatementList,
          indent,
          collectedData,
          codeType
        )
      );

    case type.Statement_.ThrowError:
      return (
        indentString +
        "throw new Error(" +
        exprToString(statement.errorMessage, indent, collectedData, codeType) +
        ");"
      );

    case type.Statement_.Return:
      return (
        indentString +
        "return " +
        exprToString(statement.expr, indent, collectedData, codeType) +
        ";"
      );

    case type.Statement_.ReturnVoid:
      return indentString + "return;";

    case type.Statement_.Continue:
      return indentString + "continue;";

    case type.Statement_.VariableDefinition:
      switch (codeType) {
        case CodeType.TypeScript:
          return (
            indentString +
            (statement.isConst ? "const" : "let") +
            " " +
            (statement.name as string) +
            ": " +
            typeExprToString(statement.typeExpr, collectedData) +
            " = " +
            exprToString(statement.expr, indent, collectedData, codeType) +
            ";"
          );
        case CodeType.JavaScript:
          return (
            indentString +
            (statement.isConst ? "const" : "let") +
            " " +
            statement.name +
            "=" +
            exprToString(statement.expr, indent, collectedData, codeType) +
            ";"
          );
      }
      break;

    case type.Statement_.FunctionDefinition:
      switch (codeType) {
        case CodeType.TypeScript:
          return (
            indentString +
            "const " +
            (statement.name as string) +
            " = (" +
            statement.parameterList
              .map(
                parameter =>
                  (parameter.name as string) +
                  ": " +
                  typeExprToString(parameter.typeExpr, collectedData)
              )
              .join(", ") +
            "): " +
            typeExprToString(statement.returnType, collectedData) +
            "=>" +
            lambdaBodyToString(
              statement.statementList,
              indent,
              collectedData,
              codeType
            ) +
            ";"
          );
        case CodeType.JavaScript:
          return (
            indentString +
            "const " +
            statement.name +
            "=(" +
            statement.parameterList.map(parameter => parameter.name).join(",") +
            ")=>" +
            lambdaBodyToString(
              statement.statementList,
              indent,
              collectedData,
              codeType
            ) +
            ";"
          );
      }
      break;

    case type.Statement_.For:
      return (
        indentString +
        "for (let " +
        statement.counterVariableName +
        " = 0; " +
        statement.counterVariableName +
        " < " +
        exprToString(statement.untilExpr, indent, collectedData, codeType) +
        ";" +
        statement.counterVariableName +
        "+= 1)" +
        statementListToString(
          statement.statementList,
          indent,
          collectedData,
          codeType
        )
      );

    case type.Statement_.ForOf:
      return (
        indentString +
        "for (const " +
        statement.elementVariableName +
        " of " +
        exprToString(statement.iterableExpr, indent, collectedData, codeType) +
        ")" +
        statementListToString(
          statement.statementList,
          indent,
          collectedData,
          codeType
        )
      );

    case type.Statement_.WhileTrue:
      return (
        indentString +
        "while (true) " +
        statementListToString(
          statement.statementList,
          indent,
          collectedData,
          codeType
        )
      );

    case type.Statement_.Break:
      return indentString + "break;";
  }
};

export const builtInToString = (
  builtInObjects: type.BuiltInVariable
): string => {
  switch (builtInObjects) {
    case type.BuiltInVariable.Object:
      return "Object";

    case type.BuiltInVariable.Number:
      return "Number";

    case type.BuiltInVariable.Math:
      return "Math";

    case type.BuiltInVariable.Date:
      return "Date";

    case type.BuiltInVariable.Uint8Array:
      return "Uint8Array";

    case type.BuiltInVariable.Map:
      return "Map";

    case type.BuiltInVariable.Set:
      return "Set";

    case type.BuiltInVariable.console:
      return "console";
  }
};

/** 関数の引数と戻り値の型を文字列にする */
const functionTypeToString = (
  parameterTypeList: ReadonlyArray<type.TypeExpr>,
  returnType: type.TypeExpr,
  collectedData: type.CollectedData
): string => {
  let index = identifer.initialIdentiferIndex;
  const parameterList: Array<{
    name: string;
    typeExpr: type.TypeExpr;
  }> = [];
  for (const parameter of parameterTypeList) {
    const indexAndIdentifer = identifer.createIdentifer(index, new Set());
    index = indexAndIdentifer.nextIdentiferIndex;
    parameterList.push({
      name: indexAndIdentifer.identifer,
      typeExpr: parameter
    });
  }

  return (
    "(" +
    parameterList
      .map(
        parameter =>
          parameter.name +
          ": " +
          typeExprToString(parameter.typeExpr, collectedData)
      )
      .join(", ") +
    ") => " +
    typeExprToString(returnType, collectedData)
  );
};
/**
 * 型の式をコードに変換する
 * @param typeExpr 型の式
 */
export const typeExprToString = (
  typeExpr: type.TypeExpr,
  collectedData: type.CollectedData
): string => {
  switch (typeExpr._) {
    case type.TypeExpr_.Number:
      return "number";

    case type.TypeExpr_.String:
      return "string";

    case type.TypeExpr_.Boolean:
      return "boolean";

    case type.TypeExpr_.Null:
      return "null";

    case type.TypeExpr_.Never:
      return "never";

    case type.TypeExpr_.Void:
      return "void";

    case type.TypeExpr_.Undefined:
      return "undefined";

    case type.TypeExpr_.Object:
      return (
        "{ " +
        [...typeExpr.memberList.entries()]
          .map(
            ([name, typeAndDocument]) =>
              name +
              ": " +
              typeExprToString(typeAndDocument.typeExpr, collectedData)
          )
          .join("; ") +
        " }"
      );

    case type.TypeExpr_.Function:
      return functionTypeToString(
        typeExpr.parameterList,
        typeExpr.return,
        collectedData
      );

    case type.TypeExpr_.EnumTagLiteral:
      return typeExpr.typeName + "." + typeExpr.tagName;

    case type.TypeExpr_.Union:
      return typeExpr.types
        .map(typeExpr => typeExprToString(typeExpr, collectedData))
        .join(" | ");

    case type.TypeExpr_.WithTypeParameter:
      return (
        typeExprToString(typeExpr.typeExpr, collectedData) +
        "<" +
        typeExpr.typeParameterList
          .map(type_ => typeExprToString(type_, collectedData))
          .join(", ") +
        ">"
      );

    case type.TypeExpr_.GlobalType:
      return typeExpr.name;

    case type.TypeExpr_.ImportedType: {
      const nameSpaceIdentifer = collectedData.importedModuleNameIdentiferMap.get(
        typeExpr.moduleName
      );
      if (nameSpaceIdentifer === undefined) {
        throw Error(
          "収集されなかった, モジュールがある moduleName=" + typeExpr.moduleName
        );
      }

      return (nameSpaceIdentifer as string) + "." + typeExpr.name;
    }

    case type.TypeExpr_.BuiltIn:
      return builtInTypeToString(typeExpr.builtIn);
  }
};

const builtInTypeToString = (builtInType: type.BuiltInType): string => {
  switch (builtInType) {
    case type.BuiltInType.Array:
      return "Array";
    case type.BuiltInType.ReadonlyArray:
      return "ReadonlyArray";
    case type.BuiltInType.Uint8Array:
      return "Uint8Array";
    case type.BuiltInType.Promise:
      return "Promise";
    case type.BuiltInType.Date:
      return "Date";
    case type.BuiltInType.Map:
      return "Map";
    case type.BuiltInType.ReadonlyMap:
      return "ReadonlyMap";
    case type.BuiltInType.Set:
      return "Set";
    case type.BuiltInType.ReadonlySet:
      return "ReadonlySet";
  }
};