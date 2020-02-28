import * as identifer from "./identifer";
import * as type from "./type";

export const enum CodeType {
  JavaScript,
  TypeScript
}

/**
 * ラムダ式の本体 文が1つでreturn exprだった場合、returnを省略する形にする
 * @param statementList
 * @param indent
 */
export const lambdaBodyToString = (
  statementList: ReadonlyArray<type.Statement>,
  indent: number,
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
      codeType
    );
  }
  return statementListToString(statementList, indent, codeType);
};

/**
 * 式をコードに変換する
 * @param expr 式
 */
const exprToCodeAsString = (
  expr: type.Expr,
  indent: number,
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
          .map(element => exprToCodeAsString(element, indent, codeType))
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
              exprToCodeAsString(value, indent, codeType)
          )
          .join(", ") +
        codeTypeSpace(codeType) +
        "}"
      );

    case type.Expr_.UnaryOperator:
      return (
        expr.operator +
        exprToStringWithCombineStrength(expr, expr.expr, indent, codeType)
      );
    case type.Expr_.BinaryOperator:
      return binaryOperatorExprToString(
        expr.operator,
        expr.left,
        expr.right,
        indent,
        codeType
      );
    case type.Expr_.ConditionalOperator:
      return (
        exprToStringWithCombineStrength(
          expr,
          expr.condition,
          indent,
          codeType
        ) +
        "?" +
        exprToStringWithCombineStrength(expr, expr.thenExpr, indent, codeType) +
        ":" +
        exprToStringWithCombineStrength(expr, expr.elseExpr, indent, codeType)
      );

    case type.Expr_.Lambda:
      switch (codeType) {
        case CodeType.TypeScript:
          return (
            "(" +
            expr.parameterList
              .map(o => o.name + ": " + typeExpr.typeExprToString(o.typeExpr))
              .join(", ") +
            "): " +
            typeExpr.typeExprToString(expr.returnType) +
            "=>" +
            lambdaBodyToString(expr.statementList, indent, codeType)
          );
        case CodeType.JavaScript:
          return (
            "(" +
            expr.parameterList.map(o => o.name).join(",") +
            ")=>" +
            lambdaBodyToString(expr.statementList, indent, codeType)
          );
      }
      break;

    case type.Expr_.Variable:
      return expr.name;

    case type.Expr_.ImportedVariable:
      return expr.nameSpaceIdentifer + "." + expr.name;

    case type.Expr_.Get:
      return (
        exprToStringWithCombineStrength(expr, expr.expr, indent, codeType) +
        (expr.propertyName._ === Expr_.StringLiteral &&
        identifer.isIdentifer(expr.propertyName.value)
          ? "." + expr.propertyName.value
          : "[" + exprToCodeAsString(expr.propertyName, indent, codeType) + "]")
      );

    case type.Expr_.Call:
      return (
        exprToStringWithCombineStrength(expr, expr.expr, indent, codeType) +
        "(" +
        expr.parameterList
          .map(e => exprToCodeAsString(e, indent, codeType))
          .join("," + codeTypeSpace(codeType)) +
        ")"
      );

    case type.Expr_.New:
      return (
        "new " +
        exprToStringWithCombineStrength(expr, expr.expr, indent, codeType) +
        "(" +
        expr.parameterList
          .map(e => exprToCodeAsString(e, indent, codeType))
          .join("," + codeTypeSpace(codeType)) +
        ")"
      );

    case type.Expr_.EnumTag:
      switch (codeType) {
        case CodeType.JavaScript:
          return expr.value.toString();
        case CodeType.TypeScript:
          return expr.typeName + "." + expr.tagName;
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
      ? "(" + exprToCodeAsString(left, indent, codeType) + ")"
      : exprToCodeAsString(left, indent, codeType)) +
    (codeType === CodeType.TypeScript ? " " + operator + " " : operator) +
    (operatorExprCombineStrength > rightExprCombineStrength ||
    (operatorExprCombineStrength === rightExprCombineStrength &&
      associativity === Associativity.LeftToRight)
      ? "(" + exprToCodeAsString(right, indent, codeType) + ")"
      : exprToCodeAsString(right, indent, codeType))
  );
};

const exprToStringWithCombineStrength = (
  expr: type.Expr,
  target: type.Expr,
  indent: number,
  codeType: CodeType
): string => {
  if (exprCombineStrength(expr) > exprCombineStrength(target)) {
    return "(" + exprToCodeAsString(target, indent, codeType) + ")";
  }
  return exprToCodeAsString(target, indent, codeType);
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
  codeType: CodeType
): string =>
  "{\n" +
  statementList
    .map(statement =>
      statementToTypeScriptCodeAsString(statement, indent + 1, codeType)
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
  codeType: CodeType
): string => {
  const indentString = "  ".repeat(indent);
  switch (statement._) {
    case type.Statement_.EvaluateExpr:
      return (
        indentString +
        exprToCodeAsString(statement.expr, indent, codeType) +
        ";"
      );

    case type.Statement_.Set:
      return (
        indentString +
        exprToCodeAsString(statement.targetObject, indent, codeType) +
        codeTypeSpace(codeType) +
        (statement.operator === null ? "" : statement.operator) +
        "=" +
        codeTypeSpace(codeType) +
        exprToCodeAsString(statement.expr, indent, codeType) +
        ";"
      );

    case type.Statement_.If:
      return (
        indentString +
        "if (" +
        exprToCodeAsString(statement.condition, indent, codeType) +
        ") " +
        statementListToString(statement.thenStatementList, indent, codeType)
      );

    case type.Statement_.ThrowError:
      return (
        indentString +
        "throw new Error(" +
        exprToCodeAsString(statement.errorMessage, indent, codeType) +
        ");"
      );

    case type.Statement_.Return:
      return (
        indentString +
        "return " +
        exprToCodeAsString(statement.expr, indent, codeType) +
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
            statement.name +
            ": " +
            typeExpr.typeExprToString(statement.typeExpr) +
            " = " +
            exprToCodeAsString(statement.expr, indent, codeType) +
            ";"
          );
        case CodeType.JavaScript:
          return (
            indentString +
            (statement.isConst ? "const" : "let") +
            " " +
            statement.name +
            "=" +
            exprToCodeAsString(statement.expr, indent, codeType) +
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
            statement.name +
            " = (" +
            statement.parameterList
              .map(
                parameter =>
                  parameter.name +
                  ": " +
                  typeExpr.typeExprToString(parameter.typeExpr)
              )
              .join(", ") +
            "): " +
            typeExpr.typeExprToString(statement.returnType) +
            "=>" +
            lambdaBodyToString(statement.statementList, indent, codeType) +
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
            lambdaBodyToString(statement.statementList, indent, codeType) +
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
        exprToCodeAsString(statement.untilExpr, indent, codeType) +
        ";" +
        statement.counterVariableName +
        "+= 1)" +
        statementListToString(statement.statementList, indent, codeType)
      );

    case type.Statement_.ForOf:
      return (
        indentString +
        "for (const " +
        statement.elementVariableName +
        " of " +
        exprToCodeAsString(statement.iterableExpr, indent, codeType) +
        ")" +
        statementListToString(statement.statementList, indent, codeType)
      );

    case type.Statement_.WhileTrue:
      return (
        indentString +
        "while (true) " +
        statementListToString(statement.statementList, indent, codeType)
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
  reserved: ReadonlySet<string>
): string => {
  let index = identifer.initialIdentiferIndex;
  const parameterList: Array<{
    name: string;
    typeExpr: type.TypeExpr;
  }> = [];
  for (const parameter of parameterTypeList) {
    const indexAndIdentifer = identifer.createIdentifer(index, reserved);
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
          parameter.name + ": " + typeExprToString(parameter.typeExpr)
      )
      .join(", ") +
    ") => " +
    typeExprToString(returnType)
  );
};
/**
 * 型の式をコードに変換する
 * @param typeExpr 型の式
 */
export const typeExprToString = (typeExpr: type.TypeExpr): string => {
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
              name + ": " + typeExprToString(typeAndDocument.typeExpr)
          )
          .join("; ") +
        " }"
      );

    case type.TypeExpr_.Function:
      return functionTypeToString(typeExpr.parameterList, typeExpr.return);

    case type.TypeExpr_.EnumTagLiteral:
      return typeExpr.typeName + "." + typeExpr.tagName;

    case type.TypeExpr_.Union:
      return typeExpr.types
        .map(typeExpr => typeExprToString(typeExpr))
        .join(" | ");

    case type.TypeExpr_.WithTypeParameter:
      return (
        typeExprToString(typeExpr.typeExpr) +
        "<" +
        typeExpr.typeParameterList.map(typeExprToString).join(", ") +
        ">"
      );

    case type.TypeExpr_.GlobalType:
      return typeExpr.name;

    case type.TypeExpr_.ImportedType:
      return typeExpr.nameSpaceIdentifer + "." + typeExpr.name;

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
