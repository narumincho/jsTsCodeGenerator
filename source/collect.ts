import * as data from "./data";

/**
 * グローバル空間とルートにある関数名の引数名、使っている外部モジュールのパスを集める
 */
export const collectCode = (code: data.Code): data.UsedNameAndModulePath => {
  const scanData: data.UsedNameAndModulePath = data.collectedDataInit();
  for (const definition of code.exportDefinitionList) {
    scanDefinition(definition, scanData);
  }
  return scanData;
};

const scanDefinition = (
  definition: data.Definition,
  scanData: data.UsedNameAndModulePath
): void => {
  switch (definition._) {
    case "TypeAlias":
      scanData.usedNameSet.add(definition.typeAlias.name);
      collectType(definition.typeAlias.type_, scanData);
      return;

    case "Function":
      scanData.usedNameSet.add(definition.function_.name);
      for (const parameter of definition.function_.parameterList) {
        scanData.usedNameSet.add(parameter.name);
        collectType(parameter.type_, scanData);
      }
      collectType(definition.function_.returnType, scanData);
      collectStatementList(definition.function_.statementList, scanData);
      return;

    case "Variable":
      scanData.usedNameSet.add(definition.variable.name);
      collectType(definition.variable.type_, scanData);
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
  expr: data.Expr,
  scanData: data.UsedNameAndModulePath
): void => {
  switch (expr._) {
    case "NumberLiteral":
    case "UnaryOperator":
    case "StringLiteral":
    case "BooleanLiteral":
    case "UndefinedLiteral":
    case "NullLiteral":
      return;

    case "ArrayLiteral":
      for (const exprElement of expr.exprList) {
        collectExpr(exprElement, scanData);
      }
      return;

    case "ObjectLiteral":
      for (const [, member] of expr.memberList) {
        collectExpr(member, scanData);
      }
      return;

    case "Lambda":
      for (const oneParameter of expr.parameterList) {
        collectType(oneParameter.type_, scanData);
      }
      collectType(expr.returnType, scanData);
      collectStatementList(expr.statementList, scanData);
      return;

    case "Variable":
      scanData.usedNameSet.add(expr.name);
      return;

    case "ImportedVariable":
      scanData.modulePathList.add(expr.moduleName);
      return;

    case "Get":
      collectExpr(expr.expr, scanData);
      collectExpr(expr.propertyName, scanData);
      return;

    case "Call":
      collectExpr(expr.expr, scanData);
      for (const parameter of expr.parameterList) {
        collectExpr(parameter, scanData);
      }
      return;

    case "New":
      collectExpr(expr.expr, scanData);
      for (const parameter of expr.parameterList) {
        collectExpr(parameter, scanData);
      }
      return;
  }
};

const collectStatementList = (
  statementList: ReadonlyArray<data.Statement>,
  scanData: data.UsedNameAndModulePath
): void => {
  for (const statement of statementList) {
    collectStatement(statement, scanData);
  }
};

const collectStatement = (
  statement: data.Statement,
  scanData: data.UsedNameAndModulePath
): void => {
  switch (statement._) {
    case "EvaluateExpr":
      collectExpr(statement.expr, scanData);
      return;

    case "Set":
      collectExpr(statement.targetObject, scanData);
      collectExpr(statement.expr, scanData);
      return;

    case "If":
      collectExpr(statement.condition, scanData);
      collectStatementList(statement.thenStatementList, scanData);
      return;

    case "ThrowError":
      collectExpr(statement.errorMessage, scanData);
      return;

    case "Return":
      collectExpr(statement.expr, scanData);
      return;

    case "ReturnVoid":
      return;

    case "Continue":
      return;

    case "VariableDefinition":
      collectExpr(statement.expr, scanData);
      collectType(statement.type_, scanData);
      return;

    case "FunctionDefinition":
      for (const parameter of statement.parameterList) {
        collectType(parameter.type_, scanData);
      }
      collectType(statement.returnType, scanData);
      collectStatementList(statement.statementList, scanData);
      return;

    case "For":
      collectExpr(statement.untilExpr, scanData);
      collectStatementList(statement.statementList, scanData);
      return;

    case "ForOf":
      collectExpr(statement.iterableExpr, scanData);
      collectStatementList(statement.statementList, scanData);
      return;

    case "WhileTrue":
      collectStatementList(statement.statementList, scanData);
      return;

    case "Switch":
      collectExpr(statement.switch_.expr, scanData);
      for (const pattern of statement.switch_.patternList) {
        collectStatementList(pattern.statementList, scanData);
        if (pattern.returnExpr !== null) {
          collectExpr(pattern.returnExpr, scanData);
        }
      }
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
 * @param type_ 型の式
 * @param scanData グローバルで使われている名前の集合などのコード全体の情報の収集データ。上書きする
 */
const collectType = (
  type_: data.Type,
  scanData: data.UsedNameAndModulePath
): void => {
  switch (type_._) {
    case "Number":
    case "String":
    case "Boolean":
    case "Null":
    case "Undefined":
      return;

    case "Object":
      for (const [, value] of type_.memberList) {
        collectType(value.type_, scanData);
      }
      return;

    case "Function":
      for (const parameter of type_.parameterList) {
        collectType(parameter, scanData);
      }
      collectType(type_.return, scanData);
      return;

    case "Union":
      for (const oneType of type_.types) {
        collectType(oneType, scanData);
      }
      return;

    case "WithTypeParameter":
      collectType(type_.type_, scanData);
      for (const parameter of type_.typeParameterList) {
        collectType(parameter, scanData);
      }
      return;

    case "ImportedType":
      scanData.modulePathList.add(type_.moduleName);
      return;

    case "GlobalType":
      scanData.usedNameSet.add(type_.name);
      return;
  }
};
