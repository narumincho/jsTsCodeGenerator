import * as identifer from "../identifer";
import * as scanType from "../scanType";
import * as typeExpr from "./typeExpr";

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
      _: Expr_.GetProperty;
      expr: Expr;
      propertyName: string;
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
  GetProperty,
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
      _: Statement_.If;
      condition: Expr;
      thenStatementList: ReadonlyArray<Statement>;
    }
  | {
      _: Statement_.Throw;
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
      returnExpr: Expr;
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
    };

const enum Statement_ {
  If,
  Throw,
  Return,
  ReturnVoid,
  Continue,
  VariableDefinition,
  FunctionWithReturnValueVariableDefinition,
  ReturnVoidFunctionVariableDefinition,
  For,
  WhileTrue
}

const lambdaBodyToString = (
  statementList: ReadonlyArray<Statement>
): string => {
  if (statementList.length === 1 && statementList[0]._ === Statement_.Return) {
    return "(" + exprToString(statementList[0].expr) + ")";
  }
  return "{\n" + statementList.map(statementToString).join(";\n") + "}";
};

/**
 * 式をコードに変換する
 * @param expr 式
 */
export const exprToString = (expr: Expr): string => {
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
          .map(([key, value]) => key + ":" + exprToString(value))
          .join(", ") +
        "}"
      );

    case Expr_.UnaryOperator:
      return expr.operator + "(" + exprToString(expr.expr) + ")";
    case Expr_.BinaryOperator:
      return (
        "(" +
        exprToString(expr.left) +
        ")" +
        expr.operator +
        "(" +
        exprToString(expr.right) +
        ")"
      );
    case Expr_.ConditionalOperator:
      return (
        "(" +
        exprToString(expr.condition) +
        ")?(" +
        exprToString(expr.thenExpr) +
        "):(" +
        exprToString(expr.elseExpr) +
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
        lambdaBodyToString(expr.statementList)
      );

    case Expr_.LambdaReturnVoid:
      return (
        "(" +
        expr.parameterList
          .map(o => o.name + ": " + typeExpr.typeExprToString(o.typeExpr))
          .join(",") +
        "): void=>" +
        lambdaBodyToString(expr.statementList)
      );

    case Expr_.GlobalVariable:
      return expr.name;

    case Expr_.ImportedVariable:
      return expr.nameSpaceIdentifer + "." + expr.name;

    case Expr_.Argument:
      return expr.name;

    case Expr_.GetProperty:
      return "(" + exprToString(expr.expr) + ")." + expr.propertyName;

    case Expr_.Call:
      return (
        exprToString(expr.expr) +
        "(" +
        expr.parameterList.map(e => exprToString(e)).join(", ") +
        ")"
      );

    case Expr_.New:
      return (
        "new (" +
        exprToString(expr.expr) +
        ")(" +
        expr.parameterList.map(e => exprToString(e)).join(", ") +
        ")"
      );

    case Expr_.LocalVariable:
      return expr.name;
  }
};

const stringLiteralValueToString = (value: string): string => {
  return '"' + value.replace(/"/gu, '\\"').replace(/\n/gu, "\\n") + '"';
};

/**
 * 文をコードに変換する
 * @param statement 文
 */
export const statementToString = (statement: Statement): string => {
  switch (statement._) {
    case Statement_.If:
      return (
        "if (" +
        exprToString(statement.condition) +
        "){\n" +
        statement.thenStatementList
          .map(s => "  " + statementToString(s))
          .join("\n") +
        "}"
      );

    case Statement_.Throw:
      return 'throw new Error("' + statement.errorMessage + '");';

    case Statement_.Return:
      return "return" + exprToString(statement.expr) + ";";

    case Statement_.ReturnVoid:
      return "return;";

    case Statement_.Continue:
      return "continue;";

    case Statement_.VariableDefinition:
      return (
        "const " +
        statement.name +
        ":" +
        typeExpr.typeExprToString(statement.typeExpr) +
        " = " +
        exprToString(statement.expr) +
        ";"
      );

    case Statement_.FunctionWithReturnValueVariableDefinition:
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
        "):" +
        typeExpr.typeExprToString(statement.returnType) +
        "=>" +
        lambdaBodyToString(statement.statementList) +
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
        lambdaBodyToString(statement.statementList) +
        ";"
      );

    case Statement_.For:
      return (
        "for (let " +
        statement.counterVariableName +
        " = 0; " +
        statement.counterVariableName +
        " < " +
        exprToString(statement.untilExpr) +
        ";" +
        statement.counterVariableName +
        "+= 1){\n" +
        statement.statementList
          .map(s => "  " + statementToString(s))
          .join(";\n") +
        "}"
      );

    case Statement_.WhileTrue:
      return (
        "while (true) {\n" +
        statement.statementList
          .map(s => "  " + statementToString(s))
          .join(";\n") +
        "}"
      );
  }
};
