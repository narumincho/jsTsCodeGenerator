import * as identifer from "./identifer";
import * as type from "./type";

/**
 * グローバルで使われているものを収集したり、インポートしているものを収集する
 * @param expr 式
 * @param scanData グローバルで使われている名前の集合などのコード全体の情報の収集データ。上書きする
 */
export const scanExpr = (
  expr: type.Expr,
  scanData: type.GlobalNameData
): void => {
  switch (expr._) {
    case type.Expr_.NumberLiteral:
    case type.Expr_.UnaryOperator:
    case type.Expr_.StringLiteral:
    case type.Expr_.BooleanLiteral:
    case type.Expr_.UndefinedLiteral:
    case type.Expr_.NullLiteral:
    case type.Expr_.EnumTag:
      return;

    case type.Expr_.ArrayLiteral:
      for (const exprElement of expr.exprList) {
        scanExpr(exprElement, scanData);
      }
      return;

    case type.Expr_.ObjectLiteral:
      for (const [, member] of expr.memberList) {
        scanExpr(member, scanData);
      }
      return;

    case type.Expr_.Lambda:
      for (const oneParameter of expr.parameterList) {
        scanType(oneParameter.typeExpr, scanData);
      }
      scanType(expr.returnType, scanData);
      scanStatementList(expr.statementList, scanData);
      return;

    case type.Expr_.Variable:
      identifer.checkIdentiferThrow("global variable name", expr.name);
      scanData.globalNameSet.add(expr.name);
      return;

    case type.Expr_.ImportedVariable:
      identifer.checkIdentiferThrow("imported variable name", expr.name);
      scanData.importedModulePath.add(expr.path);
      return;

    case type.Expr_.Get:
      scanExpr(expr.expr, scanData);
      scanExpr(expr.propertyName, scanData);
      return;

    case type.Expr_.Call:
      scanExpr(expr.expr, scanData);
      for (const parameter of expr.parameterList) {
        scanExpr(parameter, scanData);
      }
      return;

    case type.Expr_.New:
      scanExpr(expr.expr, scanData);
      for (const parameter of expr.parameterList) {
        scanExpr(parameter, scanData);
      }
      return;
  }
};

export const scanStatementList = (
  statementList: ReadonlyArray<type.Statement>,
  scanData: type.GlobalNameData
): void => {
  for (const statement of statementList) {
    scanStatement(statement, scanData);
  }
};

export const scanStatement = (
  statement: type.Statement,
  scanData: type.GlobalNameData
): void => {
  switch (statement._) {
    case type.Statement_.EvaluateExpr:
      scanExpr(statement.expr, scanData);
      return;

    case type.Statement_.Set:
      scanExpr(statement.targetObject, scanData);
      scanExpr(statement.expr, scanData);
      return;

    case type.Statement_.If:
      scanExpr(statement.condition, scanData);
      scanStatementList(statement.thenStatementList, scanData);
      return;

    case type.Statement_.ThrowError:
      scanExpr(statement.errorMessage, scanData);
      return;

    case type.Statement_.Return:
      scanExpr(statement.expr, scanData);
      return;

    case type.Statement_.ReturnVoid:
      return;

    case type.Statement_.Continue:
      return;

    case type.Statement_.VariableDefinition:
      scanExpr(statement.expr, scanData);
      scanType(statement.typeExpr, scanData);
      return;

    case type.Statement_.FunctionDefinition:
      for (const parameter of statement.parameterList) {
        scanType(parameter.typeExpr, scanData);
      }
      scanType(statement.returnType, scanData);
      scanStatementList(statement.statementList, scanData);
      return;

    case type.Statement_.For:
      scanExpr(statement.untilExpr, scanData);
      scanStatementList(statement.statementList, scanData);
      return;

    case type.Statement_.ForOf:
      scanExpr(statement.iterableExpr, scanData);
      scanStatementList(statement.statementList, scanData);
      return;

    case type.Statement_.WhileTrue:
      scanStatementList(statement.statementList, scanData);
  }
};

const searchName = (
  localVariableNameMapList: ReadonlyArray<ReadonlyMap<string, string>>,
  oldName: string
): string => {
  for (let i = 0; i < localVariableNameMapList.length; i++) {
    const variable = localVariableNameMapList[
      localVariableNameMapList.length - 1 - i
    ].get(oldName);
    if (variable !== undefined) {
      return variable;
    }
  }
  throw new Error(
    "存在しない変数を指定されました name=" +
      oldName +
      " 存在している変数 =" +
      [...localVariableNameMapList.entries()]
        .map(scope => "[" + scope.join(",") + "]")
        .join(",")
  );
};

/**
 * グローバル空間(グローバル変数、直下の関数の引数名)に出ている型の名前を集める
 * @param typeExpr 型の式
 * @param scanData グローバルで使われている名前の集合などのコード全体の情報の収集データ。上書きする
 */
export const scanType = (
  typeExpr: type.TypeExpr,
  scanData: type.GlobalNameData
): void => {
  switch (typeExpr._) {
    case type.TypeExpr_.Number:
    case type.TypeExpr_.String:
    case type.TypeExpr_.Boolean:
    case type.TypeExpr_.Null:
    case type.TypeExpr_.Undefined:
    case type.TypeExpr_.EnumTagLiteral:
      return;

    case type.TypeExpr_.Object:
      for (const [, value] of typeExpr.memberList) {
        scanType(value.typeExpr, scanData);
      }
      return;

    case type.TypeExpr_.Function:
      for (const parameter of typeExpr.parameterList) {
        scanType(parameter, scanData);
      }
      scanType(typeExpr.return, scanData);
      return;

    case type.TypeExpr_.Union:
      for (const oneType of typeExpr.types) {
        scanType(oneType, scanData);
      }
      return;

    case type.TypeExpr_.WithTypeParameter:
      scanType(typeExpr.typeExpr, scanData);
      for (const parameter of typeExpr.typeParameterList) {
        scanType(parameter, scanData);
      }
      return;

    case type.TypeExpr_.ImportedType:
      scanData.importedModulePath.add(typeExpr.path);
      return;

    case type.TypeExpr_.GlobalType:
      scanData.globalNameSet.add(typeExpr.name);
      return;
  }
};
