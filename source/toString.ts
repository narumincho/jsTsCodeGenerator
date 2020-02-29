import * as identifer from "./identifer";
import * as data from "./data";

/**
 * コードを文字列にする
 */
export const toString = (
  code: data.Code,
  collectedData: data.CollectedData,
  codeType: data.CodeType
): string => {
  const importCode =
    [...collectedData.importedModuleNameIdentiferMap.entries()]
      .map(
        ([name, identifer]) =>
          "import * as " + (identifer as string) + ' from "' + name + '";'
      )
      .join("\n") + "\n";

  const definitionCode =
    code.exportDefinitionList
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
  definition: data.Definition,
  collectedData: data.CollectedData,
  codeType: data.CodeType
): string => {
  switch (definition._) {
    case data.Definition_.TypeAlias:
      if (codeType === data.CodeType.JavaScript) {
        return "";
      }
      return typeAliasToString(definition.typeAlias, collectedData);

    case data.Definition_.Enum:
      if (codeType === data.CodeType.JavaScript) {
        return "";
      }
      return enumToString(definition.enum_);

    case data.Definition_.Function:
      return functionToString(definition.function_, collectedData, codeType);

    case data.Definition_.Variable:
      return variableToString(definition.variable, collectedData, codeType);
  }
};

const typeAliasToString = (
  typeAlias: data.TypeAlias,
  collectedData: data.CollectedData
): string => {
  return (
    documentToString(typeAlias.document) +
    "export type " +
    (typeAlias.name as string) +
    " = " +
    typeToString(typeAlias.type_, collectedData) +
    ";\n\n"
  );
};

const enumToString = (enum_: data.Enum): string => {
  return (
    documentToString(enum_.document) +
    "export const enum " +
    (enum_.name as string) +
    " {\n" +
    enum_.tagList
      .map(tag => documentToString(tag.document) + "  " + (tag.name as string))
      .join(",\n") +
    "\n}\n\n"
  );
};

const functionToString = (
  function_: data.Function,
  collectedData: data.CollectedData,
  codeType: data.CodeType
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
          typeToString(parameter.type_, collectedData)
      )
      .join(", ") +
    "): " +
    typeToString(function_.returnType, collectedData) +
    " => " +
    lambdaBodyToString(function_.statementList, 0, collectedData, codeType) +
    ";\n\n"
  );
};

const variableToString = (
  variable: data.Variable,
  collectedData: data.CollectedData,
  codeType: data.CodeType
): string => {
  return (
    documentToString(variable.document) +
    "export const " +
    (variable.name as string) +
    ": " +
    typeToString(variable.type_, collectedData) +
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
  parameterList: ReadonlyArray<data.ParameterWithDocument>
): string =>
  parameterList
    .map(parameter =>
      parameter.document === ""
        ? ""
        : "@param " +
          (parameter.name as string) +
          " " +
          parameter.document +
          "\n"
    )
    .join("");

/**
 * ラムダ式の本体 文が1つでreturn exprだった場合、returnを省略する形にする
 * @param statementList
 * @param indent
 */
export const lambdaBodyToString = (
  statementList: ReadonlyArray<data.Statement>,
  indent: number,
  collectedData: data.CollectedData,
  codeType: data.CodeType
): string => {
  if (
    statementList.length === 1 &&
    statementList[0]._ === data.Statement_.Return
  ) {
    return exprToStringWithCombineStrength(
      data.lambda([], data.typeVoid, []),
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
  expr: data.Expr,
  indent: number,
  collectedData: data.CollectedData,
  codeType: data.CodeType
): string => {
  switch (expr._) {
    case data.Expr_.NumberLiteral:
      return expr.value.toString();

    case data.Expr_.StringLiteral:
      return stringLiteralValueToString(expr.value);

    case data.Expr_.BooleanLiteral:
      return expr.value ? "true" : "false";

    case data.Expr_.UndefinedLiteral:
      return "undefined";

    case data.Expr_.NullLiteral:
      return "null";

    case data.Expr_.ArrayLiteral:
      return (
        "[" +
        expr.exprList
          .map(element =>
            exprToString(element, indent, collectedData, codeType)
          )
          .join("," + codeTypeSpace(codeType)) +
        "]"
      );

    case data.Expr_.ObjectLiteral:
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

    case data.Expr_.UnaryOperator:
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
    case data.Expr_.BinaryOperator:
      return binaryOperatorExprToString(
        expr.operator,
        expr.left,
        expr.right,
        indent,
        collectedData,
        codeType
      );
    case data.Expr_.ConditionalOperator:
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

    case data.Expr_.Lambda:
      switch (codeType) {
        case data.CodeType.TypeScript:
          return (
            "(" +
            expr.parameterList
              .map(
                o =>
                  (o.name as string) +
                  ": " +
                  typeToString(o.type_, collectedData)
              )
              .join(", ") +
            "): " +
            typeToString(expr.returnType, collectedData) +
            "=>" +
            lambdaBodyToString(
              expr.statementList,
              indent,
              collectedData,
              codeType
            )
          );
        case data.CodeType.JavaScript:
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

    case data.Expr_.Variable:
      return expr.name;

    case data.Expr_.ImportedVariable: {
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

    case data.Expr_.Get:
      return (
        exprToStringWithCombineStrength(
          expr,
          expr.expr,
          indent,
          collectedData,
          codeType
        ) +
        (expr.propertyName._ === data.Expr_.StringLiteral &&
        identifer.isIdentifer(expr.propertyName.value)
          ? "." + expr.propertyName.value
          : "[" +
            exprToString(expr.propertyName, indent, collectedData, codeType) +
            "]")
      );

    case data.Expr_.Call:
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

    case data.Expr_.New:
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

    case data.Expr_.EnumTag:
      switch (codeType) {
        case data.CodeType.JavaScript: {
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
        case data.CodeType.TypeScript:
          return (expr.typeName as string) + "." + (expr.tagName as string);
      }
      break;

    case data.Expr_.BuiltIn:
      return builtInToString(expr.builtIn);
  }
};

const codeTypeSpace = (codeType: data.CodeType): string =>
  codeType === data.CodeType.TypeScript ? " " : "";

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
  binaryOperator: data.BinaryOperator
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
  operator: data.BinaryOperator,
  left: data.Expr,
  right: data.Expr,
  indent: number,
  collectedData: data.CollectedData,
  codeType: data.CodeType
): string => {
  const operatorExprCombineStrength = exprCombineStrength({
    _: data.Expr_.BinaryOperator,
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
    (codeType === data.CodeType.TypeScript ? " " + operator + " " : operator) +
    (operatorExprCombineStrength > rightExprCombineStrength ||
    (operatorExprCombineStrength === rightExprCombineStrength &&
      associativity === Associativity.LeftToRight)
      ? "(" + exprToString(right, indent, collectedData, codeType) + ")"
      : exprToString(right, indent, collectedData, codeType))
  );
};

const exprToStringWithCombineStrength = (
  expr: data.Expr,
  target: data.Expr,
  indent: number,
  collectedData: data.CollectedData,
  codeType: data.CodeType
): string => {
  if (exprCombineStrength(expr) > exprCombineStrength(target)) {
    return "(" + exprToString(target, indent, collectedData, codeType) + ")";
  }
  return exprToString(target, indent, collectedData, codeType);
};

const exprCombineStrength = (expr: data.Expr): number => {
  switch (expr._) {
    case data.Expr_.NumberLiteral:
    case data.Expr_.StringLiteral:
    case data.Expr_.BooleanLiteral:
    case data.Expr_.NullLiteral:
    case data.Expr_.UndefinedLiteral:
    case data.Expr_.ArrayLiteral:
    case data.Expr_.Variable:
    case data.Expr_.ImportedVariable:
    case data.Expr_.BuiltIn:
      return 23;
    case data.Expr_.Lambda:
      return 22;
    case data.Expr_.ObjectLiteral:
      return 21;
    case data.Expr_.Get:
    case data.Expr_.Call:
    case data.Expr_.New:
    case data.Expr_.EnumTag:
      return 20;
    case data.Expr_.UnaryOperator:
      return 17;
    case data.Expr_.BinaryOperator:
      return binaryOperatorCombineStrength(expr.operator);
    case data.Expr_.ConditionalOperator:
      return 4;
  }
};

const binaryOperatorCombineStrength = (
  binaryOperator: data.BinaryOperator
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
  statementList: ReadonlyArray<data.Statement>,
  indent: number,
  collectedData: data.CollectedData,
  codeType: data.CodeType
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
  statement: data.Statement,
  indent: number,
  collectedData: data.CollectedData,
  codeType: data.CodeType
): string => {
  const indentString = "  ".repeat(indent);
  switch (statement._) {
    case data.Statement_.EvaluateExpr:
      return (
        indentString +
        exprToString(statement.expr, indent, collectedData, codeType) +
        ";"
      );

    case data.Statement_.Set:
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

    case data.Statement_.If:
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

    case data.Statement_.ThrowError:
      return (
        indentString +
        "throw new Error(" +
        exprToString(statement.errorMessage, indent, collectedData, codeType) +
        ");"
      );

    case data.Statement_.Return:
      return (
        indentString +
        "return " +
        exprToString(statement.expr, indent, collectedData, codeType) +
        ";"
      );

    case data.Statement_.ReturnVoid:
      return indentString + "return;";

    case data.Statement_.Continue:
      return indentString + "continue;";

    case data.Statement_.VariableDefinition:
      switch (codeType) {
        case data.CodeType.TypeScript:
          return (
            indentString +
            (statement.isConst ? "const" : "let") +
            " " +
            (statement.name as string) +
            ": " +
            typeToString(statement.type_, collectedData) +
            " = " +
            exprToString(statement.expr, indent, collectedData, codeType) +
            ";"
          );
        case data.CodeType.JavaScript:
          return (
            indentString +
            (statement.isConst ? "const" : "let") +
            " " +
            (statement.name as string) +
            "=" +
            exprToString(statement.expr, indent, collectedData, codeType) +
            ";"
          );
      }
      break;

    case data.Statement_.FunctionDefinition:
      switch (codeType) {
        case data.CodeType.TypeScript:
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
                  typeToString(parameter.type_, collectedData)
              )
              .join(", ") +
            "): " +
            typeToString(statement.returnType, collectedData) +
            "=>" +
            lambdaBodyToString(
              statement.statementList,
              indent,
              collectedData,
              codeType
            ) +
            ";"
          );
        case data.CodeType.JavaScript:
          return (
            indentString +
            "const " +
            (statement.name as string) +
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

    case data.Statement_.For:
      return (
        indentString +
        "for (let " +
        (statement.counterVariableName as string) +
        " = 0; " +
        (statement.counterVariableName as string) +
        " < " +
        exprToString(statement.untilExpr, indent, collectedData, codeType) +
        ";" +
        (statement.counterVariableName as string) +
        "+= 1)" +
        statementListToString(
          statement.statementList,
          indent,
          collectedData,
          codeType
        )
      );

    case data.Statement_.ForOf:
      return (
        indentString +
        "for (const " +
        (statement.elementVariableName as string) +
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

    case data.Statement_.WhileTrue:
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

    case data.Statement_.Break:
      return indentString + "break;";
  }
};

export const builtInToString = (
  builtInObjects: data.BuiltInVariable
): string => {
  switch (builtInObjects) {
    case data.BuiltInVariable.Object:
      return "Object";

    case data.BuiltInVariable.Number:
      return "Number";

    case data.BuiltInVariable.Math:
      return "Math";

    case data.BuiltInVariable.Date:
      return "Date";

    case data.BuiltInVariable.Uint8Array:
      return "Uint8Array";

    case data.BuiltInVariable.Map:
      return "Map";

    case data.BuiltInVariable.Set:
      return "Set";

    case data.BuiltInVariable.console:
      return "console";
  }
};

/** 関数の引数と戻り値の型を文字列にする */
const functionTypeToString = (
  parameterTypeList: ReadonlyArray<data.Type>,
  returnType: data.Type,
  collectedData: data.CollectedData
): string => {
  let index = identifer.initialIdentiferIndex;
  const parameterList: Array<{
    name: string;
    type_: data.Type;
  }> = [];
  for (const parameter of parameterTypeList) {
    const indexAndIdentifer = identifer.createIdentifer(index, new Set());
    index = indexAndIdentifer.nextIdentiferIndex;
    parameterList.push({
      name: indexAndIdentifer.identifer,
      type_: parameter
    });
  }

  return (
    "(" +
    parameterList
      .map(
        parameter =>
          parameter.name + ": " + typeToString(parameter.type_, collectedData)
      )
      .join(", ") +
    ") => " +
    typeToString(returnType, collectedData)
  );
};
/**
 * 型の式をコードに変換する
 * @param type_ 型の式
 */
export const typeToString = (
  type_: data.Type,
  collectedData: data.CollectedData
): string => {
  switch (type_._) {
    case data.Type_.Number:
      return "number";

    case data.Type_.String:
      return "string";

    case data.Type_.Boolean:
      return "boolean";

    case data.Type_.Null:
      return "null";

    case data.Type_.Never:
      return "never";

    case data.Type_.Void:
      return "void";

    case data.Type_.Undefined:
      return "undefined";

    case data.Type_.Object:
      return (
        "{ " +
        [...type_.memberList.entries()]
          .map(
            ([name, typeAndDocument]) =>
              name + ": " + typeToString(typeAndDocument.type_, collectedData)
          )
          .join("; ") +
        " }"
      );

    case data.Type_.Function:
      return functionTypeToString(
        type_.parameterList,
        type_.return,
        collectedData
      );

    case data.Type_.EnumTagLiteral:
      return (type_.typeName as string) + "." + (type_.tagName as string);

    case data.Type_.Union:
      return type_.types
        .map(type_ => typeToString(type_, collectedData))
        .join(" | ");

    case data.Type_.WithTypeParameter:
      return (
        typeToString(type_.type_, collectedData) +
        "<" +
        type_.typeParameterList
          .map(type_ => typeToString(type_, collectedData))
          .join(", ") +
        ">"
      );

    case data.Type_.GlobalType:
      return type_.name;

    case data.Type_.ImportedType: {
      const nameSpaceIdentifer = collectedData.importedModuleNameIdentiferMap.get(
        type_.moduleName
      );
      if (nameSpaceIdentifer === undefined) {
        throw Error(
          "収集されなかった, モジュールがある moduleName=" + type_.moduleName
        );
      }

      return (nameSpaceIdentifer as string) + "." + (type_.name as string);
    }

    case data.Type_.BuiltIn:
      return builtInTypeToString(type_.builtIn);
  }
};

const builtInTypeToString = (builtInType: data.BuiltInType): string => {
  switch (builtInType) {
    case data.BuiltInType.Array:
      return "Array";
    case data.BuiltInType.ReadonlyArray:
      return "ReadonlyArray";
    case data.BuiltInType.Uint8Array:
      return "Uint8Array";
    case data.BuiltInType.Promise:
      return "Promise";
    case data.BuiltInType.Date:
      return "Date";
    case data.BuiltInType.Map:
      return "Map";
    case data.BuiltInType.ReadonlyMap:
      return "ReadonlyMap";
    case data.BuiltInType.Set:
      return "Set";
    case data.BuiltInType.ReadonlySet:
      return "ReadonlySet";
  }
};
