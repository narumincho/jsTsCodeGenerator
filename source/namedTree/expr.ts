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

/**
 * ラムダ式の本体 文が1つでreturn exprだった場合、returnを省略する形にする
 * @param statementList
 * @param indent
 */
export const lambdaBodyToString = (
  statementList: ReadonlyArray<Statement>,
  indent: number
): string => {
  if (statementList.length === 1 && statementList[0]._ === Statement_.Return) {
    return "(" + exprToString(statementList[0].expr, indent) + ")";
  }
  return statementListToString(statementList, indent);
};

/**
 * 式をコードに変換する
 * @param expr 式
 */
export const exprToString = (expr: Expr, indent: number): string => {
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

    case Expr_.ObjectLiteral:
      return (
        "{" +
        [...expr.memberList.entries()]
          .map(([key, value]) => key + ":" + exprToString(value, indent))
          .join(", ") +
        "}"
      );

    case Expr_.UnaryOperator:
      return expr.operator + "(" + exprToString(expr.expr, indent) + ")";
    case Expr_.BinaryOperator:
      return (
        "(" +
        exprToString(expr.left, indent) +
        ")" +
        expr.operator +
        "(" +
        exprToString(expr.right, indent) +
        ")"
      );
    case Expr_.ConditionalOperator:
      return (
        "(" +
        exprToString(expr.condition, indent) +
        ")?(" +
        exprToString(expr.thenExpr, indent) +
        "):(" +
        exprToString(expr.elseExpr, indent) +
        ")"
      );

    case Expr_.LambdaWithReturn:
      return (
        "(" +
        expr.parameterList
          .map(o => o.name + ": " + typeExpr.typeExprToString(o.typeExpr))
          .join(", ") +
        "): " +
        typeExpr.typeExprToString(expr.returnType) +
        "=>" +
        lambdaBodyToString(expr.statementList, indent)
      );

    case Expr_.LambdaReturnVoid:
      return (
        "(" +
        expr.parameterList
          .map(o => o.name + ": " + typeExpr.typeExprToString(o.typeExpr))
          .join(",") +
        "): void=>" +
        lambdaBodyToString(expr.statementList, indent)
      );

    case Expr_.GlobalVariable:
      return expr.name;

    case Expr_.ImportedVariable:
      return expr.nameSpaceIdentifer + "." + expr.name;

    case Expr_.Argument:
      return expr.name;

    case Expr_.Get:
      return (
        "(" +
        exprToString(expr.expr, indent) +
        ")" +
        (expr.propertyName._ === Expr_.StringLiteral &&
        identifer.isIdentifer(expr.propertyName.value)
          ? "." + expr.propertyName.value
          : "[" + exprToString(expr.propertyName, indent) + "]")
      );

    case Expr_.Call:
      return (
        exprToString(expr.expr, indent) +
        "(" +
        expr.parameterList.map(e => exprToString(e, indent)).join(", ") +
        ")"
      );

    case Expr_.New:
      return (
        "new (" +
        exprToString(expr.expr, indent) +
        ")(" +
        expr.parameterList.map(e => exprToString(e, indent)).join(", ") +
        ")"
      );

    case Expr_.LocalVariable:
      return expr.name;
  }
};

const stringLiteralValueToString = (value: string): string => {
  return '"' + value.replace(/"/gu, '\\"').replace(/\n/gu, "\\n") + '"';
};

export const statementListToString = (
  statementList: ReadonlyArray<Statement>,
  indent: number
): string =>
  "{\n" +
  statementList
    .map(statement => statementToString(statement, indent))
    .join("\n") +
  "\n" +
  "  ".repeat(indent) +
  "}";

/**
 * 文をコードに変換する
 * @param statement 文
 */
export const statementToString = (
  statement: Statement,
  indent: number
): string => {
  const indentString = "  ".repeat(indent);
  switch (statement._) {
    case Statement_.EvaluateExpr:
      return indentString + exprToString(statement.expr, indent) + ";";

    case Statement_.If:
      return (
        indentString +
        "if (" +
        exprToString(statement.condition, indent) +
        ") " +
        statementListToString(statement.thenStatementList, indent + 1)
      );

    case Statement_.ThrowError:
      return (
        indentString + 'throw new Error("' + statement.errorMessage + '");'
      );

    case Statement_.Return:
      return (
        indentString + "return" + exprToString(statement.expr, indent) + ";"
      );

    case Statement_.ReturnVoid:
      return indentString + "return;";

    case Statement_.Continue:
      return indentString + "continue;";

    case Statement_.VariableDefinition:
      return (
        indentString +
        "const " +
        statement.name +
        ":" +
        typeExpr.typeExprToString(statement.typeExpr) +
        " = " +
        exprToString(statement.expr, indent) +
        ";"
      );

    case Statement_.FunctionWithReturnValueVariableDefinition:
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
          .join(",") +
        "):" +
        typeExpr.typeExprToString(statement.returnType) +
        "=>" +
        lambdaBodyToString(statement.statementList, indent + 1) +
        ";"
      );

    case Statement_.ReturnVoidFunctionVariableDefinition:
      return (
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
          .join(",") +
        "): void =>" +
        lambdaBodyToString(statement.statementList, indent + 1) +
        ";"
      );

    case Statement_.For:
      return (
        "for (let " +
        statement.counterVariableName +
        " = 0; " +
        statement.counterVariableName +
        " < " +
        exprToString(statement.untilExpr, indent) +
        ";" +
        statement.counterVariableName +
        "+= 1)" +
        statementListToString(statement.statementList, indent + 1)
      );

    case Statement_.WhileTrue:
      return (
        "while (true) " +
        statementListToString(statement.statementList, indent + 1)
      );

    case Statement_.Break:
      return "break;";
  }
};
