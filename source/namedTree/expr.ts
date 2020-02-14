import * as typeExpr from "./typeExpr";
import * as identifer from "../identifer";

export type Expr =
  | { _: Expr_.NumberLiteral; value: number }
  | {
      _: Expr_.StringLiteral;
      value: string;
    }
  | {
      _: Expr_.BooleanLiteral;
      value: boolean;
    }
  | {
      _: Expr_.NullLiteral;
    }
  | {
      _: Expr_.UndefinedLiteral;
    }
  | {
      _: Expr_.UnaryOperator;
      operator: UnaryOperator;
      expr: Expr;
    }
  | {
      _: Expr_.BinaryOperator;
      operator: BinaryOperator;
      left: Expr;
      right: Expr;
    }
  | {
      _: Expr_.ConditionalOperator;
      condition: Expr;
      thenExpr: Expr;
      elseExpr: Expr;
    }
  | {
      _: Expr_.ArrayLiteral;
      exprList: ReadonlyArray<Expr>;
    }
  | {
      _: Expr_.ObjectLiteral;
      memberList: Map<string, Expr>;
    }
  | {
      _: Expr_.LambdaWithReturn;
      parameterList: ReadonlyArray<{
        name: string;
        typeExpr: typeExpr.TypeExpr;
      }>;
      returnType: typeExpr.TypeExpr;
      statementList: ReadonlyArray<Statement>;
    }
  | {
      _: Expr_.LambdaReturnVoid;
      parameterList: ReadonlyArray<{
        name: string;
        typeExpr: typeExpr.TypeExpr;
      }>;
      statementList: ReadonlyArray<Statement>;
    }
  | {
      _: Expr_.GlobalVariable;
      name: string;
    }
  | {
      _: Expr_.ImportedVariable;
      nameSpaceIdentifer: string;
      name: string;
    }
  | {
      _: Expr_.Argument;
      name: string;
    }
  | {
      _: Expr_.Get;
      expr: Expr;
      propertyName: Expr;
    }
  | {
      _: Expr_.Call;
      expr: Expr;
      parameterList: ReadonlyArray<Expr>;
    }
  | {
      _: Expr_.New;
      expr: Expr;
      parameterList: ReadonlyArray<Expr>;
    }
  | {
      _: Expr_.LocalVariable;
      name: string;
    };

export const enum Expr_ {
  NumberLiteral,
  StringLiteral,
  BooleanLiteral,
  UndefinedLiteral,
  NullLiteral,
  ArrayLiteral,
  ObjectLiteral,
  UnaryOperator,
  BinaryOperator,
  ConditionalOperator,
  LambdaWithReturn,
  LambdaReturnVoid,
  GlobalVariable,
  ImportedVariable,
  Argument,
  Get,
  Call,
  IfWithVoidReturn,
  New,
  LocalVariable
}

type UnaryOperator = "-" | "~" | "!";

type BinaryOperator =
  | "**"
  | "*"
  | "/"
  | "%"
  | "+"
  | "-"
  | "<<"
  | ">>"
  | ">>>"
  | "<"
  | "<="
  | "==="
  | "!=="
  | "&"
  | "^"
  | "|"
  | "&&"
  | "||";

export type Statement =
  | {
      _: Statement_.EvaluateExpr;
      expr: Expr;
    }
  | {
      _: Statement_.Set;
      targetObject: Expr;
      targetPropertyName: Expr;
      expr: Expr;
    }
  | {
      _: Statement_.If;
      condition: Expr;
      thenStatementList: ReadonlyArray<Statement>;
    }
  | {
      _: Statement_.ThrowError;
      errorMessage: string;
    }
  | {
      _: Statement_.Return;
      expr: Expr;
    }
  | {
      _: Statement_.ReturnVoid;
    }
  | {
      _: Statement_.Continue;
    }
  | {
      _: Statement_.VariableDefinition;
      name: string;
      expr: Expr;
      typeExpr: typeExpr.TypeExpr;
    }
  | {
      _: Statement_.FunctionWithReturnValueVariableDefinition;
      name: string;
      parameterList: ReadonlyArray<{
        name: string;
        typeExpr: typeExpr.TypeExpr;
      }>;
      returnType: typeExpr.TypeExpr;
      statementList: ReadonlyArray<Statement>;
    }
  | {
      _: Statement_.ReturnVoidFunctionVariableDefinition;
      name: string;
      parameterList: ReadonlyArray<{
        name: string;
        typeExpr: typeExpr.TypeExpr;
      }>;
      statementList: ReadonlyArray<Statement>;
    }
  | {
      _: Statement_.For;
      counterVariableName: string;
      untilExpr: Expr;
      statementList: ReadonlyArray<Statement>;
    }
  | {
      _: Statement_.WhileTrue;
      statementList: ReadonlyArray<Statement>;
    }
  | {
      _: Statement_.Break;
    };

export const enum Statement_ {
  EvaluateExpr,
  Set,
  If,
  ThrowError,
  Return,
  ReturnVoid,
  Continue,
  VariableDefinition,
  FunctionWithReturnValueVariableDefinition,
  ReturnVoidFunctionVariableDefinition,
  For,
  WhileTrue,
  Break
}

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
  statementList: ReadonlyArray<Statement>,
  indent: number,
  codeType: CodeType
): string => {
  if (statementList.length === 1 && statementList[0]._ === Statement_.Return) {
    return exprToStringWithCombineStrength(
      {
        _: Expr_.LambdaReturnVoid,
        parameterList: [],
        statementList: []
      },
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
  expr: Expr,
  indent: number,
  codeType: CodeType
): string => {
  switch (expr._) {
    case Expr_.NumberLiteral:
      return expr.value.toString();

    case Expr_.StringLiteral:
      return stringLiteralValueToString(expr.value);

    case Expr_.BooleanLiteral:
      return expr.value ? "true" : "false";

    case Expr_.UndefinedLiteral:
      return "undefined";

    case Expr_.NullLiteral:
      return "null";

    case Expr_.ArrayLiteral:
      return (
        "[" +
        expr.exprList
          .map(element => exprToCodeAsString(element, indent, codeType))
          .join(codeType === CodeType.TypeScript ? ", " : ",") +
        "]"
      );

    case Expr_.ObjectLiteral:
      return (
        "{" +
        [...expr.memberList.entries()]
          .map(
            ([key, value]) =>
              (identifer.isIdentifer(key)
                ? key
                : stringLiteralValueToString(key)) +
              ":" +
              exprToCodeAsString(value, indent, codeType)
          )
          .join(", ") +
        "}"
      );

    case Expr_.UnaryOperator:
      return (
        expr.operator +
        exprToStringWithCombineStrength(expr, expr.expr, indent, codeType)
      );
    case Expr_.BinaryOperator:
      return binaryOperatorExprToString(
        expr.operator,
        expr.left,
        expr.right,
        indent,
        codeType
      );
    case Expr_.ConditionalOperator:
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

    case Expr_.LambdaWithReturn:
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
            expr.parameterList.map(o => o.name).join(", ") +
            ")=>" +
            lambdaBodyToString(expr.statementList, indent, codeType)
          );
      }
      break;

    case Expr_.LambdaReturnVoid:
      switch (codeType) {
        case CodeType.TypeScript:
          return (
            "(" +
            expr.parameterList
              .map(o => o.name + ": " + typeExpr.typeExprToString(o.typeExpr))
              .join(", ") +
            "): void=>" +
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

    case Expr_.GlobalVariable:
      return expr.name;

    case Expr_.ImportedVariable:
      return expr.nameSpaceIdentifer + "." + expr.name;

    case Expr_.Argument:
      return expr.name;

    case Expr_.Get:
      return (
        exprToStringWithCombineStrength(expr, expr.expr, indent, codeType) +
        (expr.propertyName._ === Expr_.StringLiteral &&
        identifer.isIdentifer(expr.propertyName.value)
          ? "." + expr.propertyName.value
          : "[" + exprToCodeAsString(expr.propertyName, indent, codeType) + "]")
      );

    case Expr_.Call:
      return (
        exprToStringWithCombineStrength(expr, expr.expr, indent, codeType) +
        "(" +
        expr.parameterList
          .map(e => exprToCodeAsString(e, indent, codeType))
          .join(", ") +
        ")"
      );

    case Expr_.New:
      return (
        "new " +
        exprToStringWithCombineStrength(expr, expr.expr, indent, codeType) +
        "(" +
        expr.parameterList
          .map(e => exprToCodeAsString(e, indent, codeType))
          .join(", ") +
        ")"
      );

    case Expr_.LocalVariable:
      return expr.name;
  }
};

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
  binaryOperator: BinaryOperator
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
  operator: BinaryOperator,
  left: Expr,
  right: Expr,
  indent: number,
  codeType: CodeType
): string => {
  const operatorExprCombineStrength = exprCombineStrength({
    _: Expr_.BinaryOperator,
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
  expr: Expr,
  target: Expr,
  indent: number,
  codeType: CodeType
): string => {
  if (exprCombineStrength(expr) > exprCombineStrength(target)) {
    return "(" + exprToCodeAsString(target, indent, codeType) + ")";
  }
  return exprToCodeAsString(target, indent, codeType);
};

const exprCombineStrength = (expr: Expr): number => {
  switch (expr._) {
    case Expr_.NumberLiteral:
    case Expr_.StringLiteral:
    case Expr_.BooleanLiteral:
    case Expr_.NullLiteral:
    case Expr_.UndefinedLiteral:
    case Expr_.ArrayLiteral:
    case Expr_.ObjectLiteral:
    case Expr_.GlobalVariable:
    case Expr_.ImportedVariable:
    case Expr_.Argument:
    case Expr_.LocalVariable:
      return 21;
    case Expr_.Get:
    case Expr_.Call:
    case Expr_.New:
      return 20;
    case Expr_.UnaryOperator:
      return 17;
    case Expr_.BinaryOperator:
      return binaryOperatorCombineStrength(expr.operator);
    case Expr_.ConditionalOperator:
    case Expr_.LambdaWithReturn:
    case Expr_.LambdaReturnVoid:
      return 4;
  }
};

const binaryOperatorCombineStrength = (
  binaryOperator: BinaryOperator
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
  statementList: ReadonlyArray<Statement>,
  indent: number,
  codeType: CodeType
): string =>
  "{\n" +
  statementList
    .map(statement =>
      statementToTypeScriptCodeAsString(statement, indent, codeType)
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
  statement: Statement,
  indent: number,
  codeType: CodeType
): string => {
  const indentString = "  ".repeat(indent);
  switch (statement._) {
    case Statement_.EvaluateExpr:
      return (
        indentString +
        exprToCodeAsString(statement.expr, indent, codeType) +
        ";"
      );

    case Statement_.Set:
      return (
        indentString +
        exprToCodeAsString(statement.targetObject, indent, codeType) +
        (statement.targetPropertyName._ === Expr_.StringLiteral &&
        identifer.isIdentifer(statement.targetPropertyName.value)
          ? "." + statement.targetPropertyName.value
          : "[" +
            exprToCodeAsString(statement.targetPropertyName, indent, codeType) +
            "]") +
        " = " +
        exprToCodeAsString(statement.expr, indent, codeType) +
        ";"
      );

    case Statement_.If:
      return (
        indentString +
        "if (" +
        exprToCodeAsString(statement.condition, indent, codeType) +
        ") " +
        statementListToString(statement.thenStatementList, indent + 1, codeType)
      );

    case Statement_.ThrowError:
      return (
        indentString +
        "throw new Error(" +
        stringLiteralValueToString(statement.errorMessage) +
        ");"
      );

    case Statement_.Return:
      return (
        indentString +
        "return" +
        exprToCodeAsString(statement.expr, indent, codeType) +
        ";"
      );

    case Statement_.ReturnVoid:
      return indentString + "return;";

    case Statement_.Continue:
      return indentString + "continue;";

    case Statement_.VariableDefinition:
      switch (codeType) {
        case CodeType.TypeScript:
          return (
            indentString +
            "const " +
            statement.name +
            ":" +
            typeExpr.typeExprToString(statement.typeExpr) +
            " = " +
            exprToCodeAsString(statement.expr, indent, codeType) +
            ";"
          );
        case CodeType.JavaScript:
          return (
            indentString +
            "const " +
            statement.name +
            "=" +
            exprToCodeAsString(statement.expr, indent, codeType) +
            ";"
          );
      }
      break;

    case Statement_.FunctionWithReturnValueVariableDefinition:
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
                  ":" +
                  typeExpr.typeExprToString(parameter.typeExpr)
              )
              .join(", ") +
            "): " +
            typeExpr.typeExprToString(statement.returnType) +
            "=>" +
            lambdaBodyToString(statement.statementList, indent + 1, codeType) +
            ";"
          );
        case CodeType.JavaScript:
          return (
            indentString +
            "const " +
            statement.name +
            " = (" +
            statement.parameterList.map(parameter => parameter.name).join(",") +
            ")=>" +
            lambdaBodyToString(statement.statementList, indent + 1, codeType) +
            ";"
          );
      }
      break;

    case Statement_.ReturnVoidFunctionVariableDefinition:
      switch (codeType) {
        case CodeType.TypeScript:
          return (
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
            "): void =>" +
            lambdaBodyToString(statement.statementList, indent + 1, codeType) +
            ";"
          );
        case CodeType.JavaScript:
          return (
            "const " +
            statement.name +
            " = (" +
            statement.parameterList.map(parameter => parameter.name).join(",") +
            ")=>" +
            lambdaBodyToString(statement.statementList, indent + 1, codeType) +
            ";"
          );
      }
      break;

    case Statement_.For:
      return (
        "for (let " +
        statement.counterVariableName +
        " = 0; " +
        statement.counterVariableName +
        " < " +
        exprToCodeAsString(statement.untilExpr, indent, codeType) +
        ";" +
        statement.counterVariableName +
        "+= 1)" +
        statementListToString(statement.statementList, indent + 1, codeType)
      );

    case Statement_.WhileTrue:
      return (
        "while (true) " +
        statementListToString(statement.statementList, indent + 1, codeType)
      );

    case Statement_.Break:
      return "break;";
  }
};
