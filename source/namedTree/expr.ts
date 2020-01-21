import * as reservedWord from "../reservedWord";
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

type Statement =
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
      _: Statement_.Continue;
    }
  | {
      _: Statement_.VariableDefinition;
      name: string;
      expr: Expr;
      typeExpr: Expr;
    }
  | {
      _: Statement_.FunctionWithReturnValueVariableDefinition;
      name: string;
      parameterList: ReadonlyArray<typeExpr.TypeExpr>;
      returnType: typeExpr.TypeExpr;
      statement: ReadonlyArray<Statement>;
      returnExpr: Expr;
    }
  | {
      _: Statement_.ReturnVoidFunctionVariableDefinition;
      name: string;
      parameterList: ReadonlyArray<typeExpr.TypeExpr>;
      statement: ReadonlyArray<Statement>;
    }
  | {
      _: Statement_.For;
      counterVariableName: string;
      untilExpr: Expr;
      statementList: ReadonlyArray<Statement>;
    }
  | {
      _: Statement_.While;
      statementList: ReadonlyArray<Statement>;
    };

const enum Statement_ {
  If,
  Throw,
  Return,
  Continue,
  VariableDefinition,
  FunctionWithReturnValueVariableDefinition,
  ReturnVoidFunctionVariableDefinition,
  For,
  While
}

/**
 * 式をコードに変換する
 * @param expr 式
 * @param importedModuleNameMap インポートされたモジュールのパスと名前空間識別子のマップ
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

    case Expr_.LambdaWithReturn:
      return (
        "(" +
        expr.parameterList
          .map(o => o.name + ": " + typeExpr.typeExprToString(o.typeExpr))
          .join(", ") +
        "): " +
        typeExpr.typeExprToString(expr.returnType) +
        "=>" +
        (expr.statementList.length === 1 &&
        expr.statementList[0]._ === Statement_.Return
          ? "(" + exprToString(expr.statementList[0].expr) + ")"
          : "{\n" + expr.statementList.map(statementToString).join(";\n") + "}")
      );

    case Expr_.LambdaReturnVoid:
      return (
        "(" +
        expr.parameterList
          .map(
            o =>
              o.name +
              ": " +
              typeExpr.typeExprToString(o.typeExpr, importedModuleNameMap)
          )
          .join(",") +
        "): void=>" +
        exprToString(expr.body, importedModuleNameMap)
      );

    case Expr_.GlobalVariable:
      return expr.name;

    case Expr_.ImportedVariable:
      return expr.nameSpaceIdentifer + "." + expr.name;

    case Expr_.Argument:
      return expr.name;

    case Expr_.GetProperty:
      return (
        "(" +
        exprToString(expr.expr, importedModuleNameMap) +
        ")." +
        expr.propertyName
      );

    case Expr_.Call:
      return (
        exprToString(expr.expr, importedModuleNameMap) +
        "(" +
        expr.parameterList
          .map(e => exprToString(e, importedModuleNameMap))
          .join(", ") +
        ")"
      );

    case Expr_.New:
      return (
        "new (" +
        exprToString(expr.expr, importedModuleNameMap) +
        ")(" +
        expr.parameterList
          .map(e => exprToString(e, importedModuleNameMap))
          .join(", ") +
        ")"
      );

    case Expr_.LocalVariable:
      return expr.name;
  }
};

const stringLiteralValueToString = (value: string): string => {
  return '"' + value.replace(/"/gu, '\\"').replace(/\n/gu, "\\n") + '"';
};

const statementToString = (statement: Statement): string => {
  switch (statement._) {
    case Statement_.If:
    case Statement_.Throw:
    case Statement_.Return:
    case Statement_.Continue:
    case Statement_.VariableDefinition:
    case Statement_.FunctionWithReturnValueVariableDefinition:
    case Statement_.ReturnVoidFunctionVariableDefinition:
    case Statement_.For:
    case Statement_.While:
  }
};
