import * as identifer from "./identifer";
import * as type from "./type";

/**
 * グローバル空間とルートにある関数名の引数名、使っている外部モジュールのパスを集める
 */
export const collectCode = (code: type.Code): type.UsedNameAndModulePath => {
  const scanData: type.UsedNameAndModulePath = type.init;
  for (const definition of code.exportDefinition) {
    scanDefinition(definition, scanData);
  }
  return scanData;
};

const scanDefinition = (
  definition: type.Definition,
  scanData: type.UsedNameAndModulePath
): void => {
  switch (definition._) {
    case type.Definition_.TypeAlias:
      scanData.usedNameSet.add(definition.typeAlias.name);
      collectType(definition.typeAlias.typeExpr, scanData);
      return;

    case type.Definition_.Enum:
      scanData.enumTagListMap.set(
        definition.enum_.name,
        definition.enum_.tagList.map(tag => tag.name)
      );
      return;

    case type.Definition_.Function:
      scanData.usedNameSet.add(definition.function_.name);
      for (const parameter of definition.function_.parameterList) {
        scanData.usedNameSet.add(parameter.name);
        collectType(parameter.typeExpr, scanData);
      }
      collectType(definition.function_.returnType, scanData);
      collectStatementList(definition.function_.statementList, scanData);
      return;

    case type.Definition_.Variable:
      scanData.usedNameSet.add(definition.variable.name);
      collectType(definition.variable.typeExpr, scanData);
      collectExpr(definition.variable.expr, scanData);
      return;
  }
};

/**
 * グローバルで使われているものを収集したり、インポートしているものを収集する
 * @param expr 式
 * @param scanData グローバルで使われている名前の集合などのコード全体の情報の収集データ。上書きする
 */
const collectExpr = (
  expr: type.Expr,
  scanData: type.UsedNameAndModulePath
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
        collectExpr(exprElement, scanData);
      }
      return;

    case type.Expr_.ObjectLiteral:
      for (const [, member] of expr.memberList) {
        collectExpr(member, scanData);
      }
      return;

    case type.Expr_.Lambda:
      for (const oneParameter of expr.parameterList) {
        collectType(oneParameter.typeExpr, scanData);
      }
      collectType(expr.returnType, scanData);
      collectStatementList(expr.statementList, scanData);
      return;

    case type.Expr_.Variable:
      scanData.usedNameSet.add(expr.name);
      return;

    case type.Expr_.ImportedVariable:
      scanData.modulePathList.add(expr.moduleName);
      return;

    case type.Expr_.Get:
      collectExpr(expr.expr, scanData);
      collectExpr(expr.propertyName, scanData);
      return;

    case type.Expr_.Call:
      collectExpr(expr.expr, scanData);
      for (const parameter of expr.parameterList) {
        collectExpr(parameter, scanData);
      }
      return;

    case type.Expr_.New:
      collectExpr(expr.expr, scanData);
      for (const parameter of expr.parameterList) {
        collectExpr(parameter, scanData);
      }
      return;
  }
};

const collectStatementList = (
  statementList: ReadonlyArray<type.Statement>,
  scanData: type.UsedNameAndModulePath
): void => {
  for (const statement of statementList) {
    collectStatement(statement, scanData);
  }
};

const collectStatement = (
  statement: type.Statement,
  scanData: type.UsedNameAndModulePath
): void => {
  switch (statement._) {
    case type.Statement_.EvaluateExpr:
      collectExpr(statement.expr, scanData);
      return;

    case type.Statement_.Set:
      collectExpr(statement.targetObject, scanData);
      collectExpr(statement.expr, scanData);
      return;

    case type.Statement_.If:
      collectExpr(statement.condition, scanData);
      collectStatementList(statement.thenStatementList, scanData);
      return;

    case type.Statement_.ThrowError:
      collectExpr(statement.errorMessage, scanData);
      return;

    case type.Statement_.Return:
      collectExpr(statement.expr, scanData);
      return;

    case type.Statement_.ReturnVoid:
      return;

    case type.Statement_.Continue:
      return;

    case type.Statement_.VariableDefinition:
      collectExpr(statement.expr, scanData);
      collectType(statement.typeExpr, scanData);
      return;

    case type.Statement_.FunctionDefinition:
      for (const parameter of statement.parameterList) {
        collectType(parameter.typeExpr, scanData);
      }
      collectType(statement.returnType, scanData);
      collectStatementList(statement.statementList, scanData);
      return;

    case type.Statement_.For:
      collectExpr(statement.untilExpr, scanData);
      collectStatementList(statement.statementList, scanData);
      return;

    case type.Statement_.ForOf:
      collectExpr(statement.iterableExpr, scanData);
      collectStatementList(statement.statementList, scanData);
      return;

    case type.Statement_.WhileTrue:
      collectStatementList(statement.statementList, scanData);
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
const collectType = (
  typeExpr: type.TypeExpr,
  scanData: type.UsedNameAndModulePath
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
        collectType(value.typeExpr, scanData);
      }
      return;

    case type.TypeExpr_.Function:
      for (const parameter of typeExpr.parameterList) {
        collectType(parameter, scanData);
      }
      collectType(typeExpr.return, scanData);
      return;

    case type.TypeExpr_.Union:
      for (const oneType of typeExpr.types) {
        collectType(oneType, scanData);
      }
      return;

    case type.TypeExpr_.WithTypeParameter:
      collectType(typeExpr.typeExpr, scanData);
      for (const parameter of typeExpr.typeParameterList) {
        collectType(parameter, scanData);
      }
      return;

    case type.TypeExpr_.ImportedType:
      scanData.modulePathList.add(typeExpr.moduleName);
      return;

    case type.TypeExpr_.GlobalType:
      scanData.usedNameSet.add(typeExpr.name);
      return;
  }
};
