import * as data from "./data";
import * as identifer from "./identifer";

/**
 * グローバル空間とルートにある関数名の引数名、使っている外部モジュールのパスを集める
 */
export const collectInCode = (
  code: data.Code
): data.UsedNameAndModulePathSet => {
  let scanData: data.UsedNameAndModulePathSet = {
    usedNameSet: new Set(),
    modulePathSet: new Set()
  };
  const rootScopeIdentiferSet = code.exportDefinitionList.reduce<
    RootScopeIdentiferSet
  >(collectDefinitionNameInDefinition, {
    rootScopeTypeNameSet: new Set(),
    rootScopeVariableName: new Set()
  });
  for (const definition of code.exportDefinitionList) {
    scanData = concatCollectData(
      scanData,
      collectInDefinition(definition, rootScopeIdentiferSet)
    );
  }
  return scanData;
};

type RootScopeIdentiferSet = {
  rootScopeTypeNameSet: ReadonlySet<identifer.Identifer>;
  rootScopeVariableName: ReadonlySet<identifer.Identifer>;
};

/**
 * 定義の名前を収集する
 * @throws 同名の定義があった場合
 */
const collectDefinitionNameInDefinition = (
  rootScopeIdentiferSet: RootScopeIdentiferSet,
  definition: data.Definition
): RootScopeIdentiferSet => {
  switch (definition._) {
    case "TypeAlias":
      if (
        rootScopeIdentiferSet.rootScopeTypeNameSet.has(
          definition.typeAlias.name
        )
      ) {
        throw new Error(
          "同名のTypeAliasがある name=" + (definition.typeAlias.name as string)
        );
      }
      return {
        rootScopeTypeNameSet: new Set([
          ...rootScopeIdentiferSet.rootScopeTypeNameSet,
          definition.typeAlias.name
        ]),
        rootScopeVariableName: rootScopeIdentiferSet.rootScopeVariableName
      };

    case "Function":
      if (
        rootScopeIdentiferSet.rootScopeVariableName.has(
          definition.function_.name
        )
      ) {
        throw new Error(
          "同名のFunctionがある name=" + (definition.function_.name as string)
        );
      }
      return {
        rootScopeTypeNameSet: rootScopeIdentiferSet.rootScopeTypeNameSet,
        rootScopeVariableName: new Set([
          ...rootScopeIdentiferSet.rootScopeVariableName,
          definition.function_.name
        ])
      };

    case "Variable":
      if (
        rootScopeIdentiferSet.rootScopeVariableName.has(
          definition.variable.name
        )
      ) {
        throw new Error(
          "同名のVariableがある name=" + (definition.variable.name as string)
        );
      }
      return {
        rootScopeTypeNameSet: rootScopeIdentiferSet.rootScopeTypeNameSet,
        rootScopeVariableName: new Set([
          ...rootScopeIdentiferSet.rootScopeVariableName,
          definition.variable.name
        ])
      };
  }
};

const collectInDefinition = (
  definition: data.Definition,
  rootScopeIdentiferSet: RootScopeIdentiferSet
): data.UsedNameAndModulePathSet => {
  switch (definition._) {
    case "TypeAlias":
      return collectInTypeAlias(
        definition.typeAlias,
        rootScopeIdentiferSet.rootScopeTypeNameSet
      );

    case "Function":
      return collectInFunction(definition.function_, rootScopeIdentiferSet);

    case "Variable":
      return collectInVariableDefinition(
        definition.variable,
        rootScopeIdentiferSet
      );
  }
};

const collectInTypeAlias = (
  typeAlias: data.TypeAlias,
  rootScopeTypeNameSet: ReadonlySet<identifer.Identifer>
): data.UsedNameAndModulePathSet => {
  return concatCollectData(
    {
      usedNameSet: new Set([typeAlias.name]),
      modulePathSet: new Set()
    },
    collectType(typeAlias.type_, rootScopeTypeNameSet, typeAlias.parameterList)
  );
};

const collectInFunction = (
  function_: data.Function,
  rootScopeIdentiferSet: RootScopeIdentiferSet
): data.UsedNameAndModulePathSet => {
  let collectData: data.UsedNameAndModulePathSet = {
    modulePathSet: new Set(),
    usedNameSet: new Set([function_.name])
  };
  for (const parameter of function_.parameterList) {
    collectData = concatCollectData(collectData, {
      usedNameSet: new Set([parameter.name]),
      modulePathSet: new Set()
    });
    collectData = concatCollectData(
      collectData,
      collectType(
        parameter.type_,
        rootScopeIdentiferSet.rootScopeTypeNameSet,
        function_.typeParameterList
      )
    );
  }
  collectData = concatCollectData(
    collectData,
    collectType(
      function_.returnType,
      rootScopeIdentiferSet.rootScopeTypeNameSet,
      function_.typeParameterList
    )
  );
  collectData = concatCollectData(
    collectData,
    collectStatementList(function_.statementList)
  );
  return collectData;
};

const collectInVariableDefinition = (
  variable: data.Variable,
  rootScopeIdentiferSet: RootScopeIdentiferSet
): data.UsedNameAndModulePathSet => {
  let collectData: data.UsedNameAndModulePathSet = {
    modulePathSet: new Set(),
    usedNameSet: new Set([variable.name])
  };
  collectData = concatCollectData(
    collectData,
    collectType(variable.type_, rootScopeIdentiferSet.rootScopeTypeNameSet, [])
  );
  return concatCollectData(
    collectData,
    collectInExpr(variable.expr, [], rootScopeIdentiferSet)
  );
};

/**
 * グローバルで使われているものを収集したり、インポートしているものを収集する
 * @param expr 式
 * @param scanData グローバルで使われている名前の集合などのコード全体の情報の収集データ。上書きする
 */
const collectInExpr = (
  expr: data.Expr,
  localVariableNameSetList: ReadonlyArray<ReadonlySet<identifer.Identifer>>,
  rootScopeIdentiferSet: RootScopeIdentiferSet
): data.UsedNameAndModulePathSet => {
  switch (expr._) {
    case "NumberLiteral":
    case "UnaryOperator":
    case "StringLiteral":
    case "BooleanLiteral":
    case "UndefinedLiteral":
    case "NullLiteral":
      return {
        modulePathSet: new Set(),
        usedNameSet: new Set()
      };

    case "ArrayLiteral": {
      let data: data.UsedNameAndModulePathSet = {
        modulePathSet: new Set(),
        usedNameSet: new Set()
      };
      for (const element of expr.exprList) {
        data = concatCollectData(
          data,
          collectInExpr(
            element,
            localVariableNameSetList,
            rootScopeIdentiferSet
          )
        );
      }
      return data;
    }

    case "ObjectLiteral": {
      let data: data.UsedNameAndModulePathSet = {
        modulePathSet: new Set(),
        usedNameSet: new Set()
      };
      for (const [, member] of expr.memberList) {
        data = concatCollectData(
          data,
          collectInExpr(member, localVariableNameSetList, rootScopeIdentiferSet)
        );
      }
      return data;
    }

    case "Lambda": {
      let data: data.UsedNameAndModulePathSet = {
        modulePathSet: new Set(),
        usedNameSet: new Set()
      };
      for (const oneParameter of expr.parameterList) {
        data = concatCollectData(
          data,
          collectType(
            oneParameter.type_,
            rootScopeIdentiferSet.rootScopeTypeNameSet,
            []
          )
        );
      }
      data = concatCollectData(
        data,
        collectType(
          expr.returnType,
          rootScopeIdentiferSet.rootScopeTypeNameSet,
          []
        )
      );
      return concatCollectData(data, collectStatementList(expr.statementList));
    }

    case "Variable":
      searchIdentiferOrThrow(localVariableNameSetList, expr.name);
      return {
        modulePathSet: new Set(),
        usedNameSet: new Set([expr.name])
      };

    case "ImportedVariable":
      searchIdentiferOrThrow(localVariableNameSetList, expr.name);
      return {
        modulePathSet: new Set([expr.moduleName]),
        usedNameSet: new Set([expr.name])
      };

    case "Get":
      return concatCollectData(
        collectInExpr(
          expr.expr,
          localVariableNameSetList,
          rootScopeIdentiferSet
        ),
        collectInExpr(
          expr.propertyName,
          localVariableNameSetList,
          rootScopeIdentiferSet
        )
      );

    case "Call": {
      let data: data.UsedNameAndModulePathSet = collectInExpr(
        expr.expr,
        localVariableNameSetList,
        rootScopeIdentiferSet
      );
      for (const parameter of expr.parameterList) {
        data = concatCollectData(
          data,
          collectInExpr(
            parameter,
            localVariableNameSetList,
            rootScopeIdentiferSet
          )
        );
      }
      return data;
    }

    case "New": {
      let data: data.UsedNameAndModulePathSet = collectInExpr(
        expr.expr,
        localVariableNameSetList,
        rootScopeIdentiferSet
      );
      for (const parameter of expr.parameterList) {
        data = concatCollectData(
          data,
          collectInExpr(
            parameter,
            localVariableNameSetList,
            rootScopeIdentiferSet
          )
        );
      }
      return data;
    }
  }
};

const collectStatementList = (
  statementList: ReadonlyArray<data.Statement>
): data.UsedNameAndModulePathSet => {
  for (const statement of statementList) {
    collectStatement(statement, scanData);
  }
};

const collectStatement = (
  statement: data.Statement
): data.UsedNameAndModulePathSet => {
  switch (statement._) {
    case "EvaluateExpr":
      collectInExpr(statement.expr, scanData);
      return;

    case "Set":
      collectInExpr(statement.targetObject, scanData);
      collectInExpr(statement.expr, scanData);
      return;

    case "If":
      collectInExpr(statement.condition, scanData);
      collectStatementList(statement.thenStatementList, scanData);
      return;

    case "ThrowError":
      collectInExpr(statement.errorMessage, scanData);
      return;

    case "Return":
      collectInExpr(statement.expr, scanData);
      return;

    case "ReturnVoid":
      return;

    case "Continue":
      return;

    case "VariableDefinition":
      collectInExpr(statement.expr, scanData);
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
      collectInExpr(statement.untilExpr, scanData);
      collectStatementList(statement.statementList, scanData);
      return;

    case "ForOf":
      collectInExpr(statement.iterableExpr, scanData);
      collectStatementList(statement.statementList, scanData);
      return;

    case "WhileTrue":
      collectStatementList(statement.statementList, scanData);
      return;

    case "Switch":
      collectInExpr(statement.switch_.expr, scanData);
      for (const pattern of statement.switch_.patternList) {
        collectStatementList(pattern.statementList, scanData);
        if (pattern.returnExpr !== null) {
          collectInExpr(pattern.returnExpr, scanData);
        }
      }
  }
};

const searchIdentiferOrThrow = (
  localVariableNameSetList: ReadonlyArray<ReadonlySet<string>>,
  variableName: string
): void => {
  for (let i = 0; i < localVariableNameSetList.length; i++) {
    if (
      localVariableNameSetList[localVariableNameSetList.length - 1 - i].has(
        variableName
      )
    ) {
      return;
    }
  }
  throw new Error(
    "存在しない変数を指定されました name=" +
      variableName +
      " 存在している変数 =" +
      [...localVariableNameSetList.entries()]
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
  rootScopeTypeNameSet: ReadonlySet<identifer.Identifer>,
  typeParameterList: ReadonlyArray<identifer.Identifer>
): data.UsedNameAndModulePathSet => {
  let data: data.UsedNameAndModulePathSet = {
    modulePathSet: new Set(),
    usedNameSet: new Set()
  };
  switch (type_._) {
    case "Number":
    case "String":
    case "Boolean":
    case "Undefined":
    case "Null":
    case "Never":
    case "Void":
      return data;

    case "Object":
      for (const [, value] of type_.memberList) {
        collectType(value.type_, rootScopeTypeNameSet, typeParameterList);
      }
      return data;

    case "Function":
      for (const parameter of type_.parameterList) {
        data = concatCollectData(
          data,
          collectType(parameter, rootScopeTypeNameSet, typeParameterList)
        );
      }
      data = concatCollectData(
        data,
        collectType(type_.return, rootScopeTypeNameSet, typeParameterList)
      );
      return data;

    case "WithTypeParameter":
      data = concatCollectData(
        data,
        collectType(type_.type_, rootScopeTypeNameSet, typeParameterList)
      );
      for (const parameter of type_.typeParameterList) {
        data = concatCollectData(
          data,
          collectType(parameter, rootScopeTypeNameSet, typeParameterList)
        );
      }
      return data;

    case "Union":
      for (const oneType of type_.types) {
        data = concatCollectData(
          data,
          collectType(oneType, rootScopeTypeNameSet, typeParameterList)
        );
      }
      return data;

    case "ImportedType":
      return {
        modulePathSet: new Set([type_.moduleName]),
        usedNameSet: new Set([type_.name])
      };

    case "ScopeInFile":
      if (
        !rootScopeTypeNameSet.has(type_.name) &&
        !typeParameterList.includes(type_.name)
      ) {
        throw new Error(
          "このファイルに存在しない型を指定された typeName=" +
            (type_.name as string) +
            "このファイルに存在する型=[" +
            [...rootScopeTypeNameSet].join(",") +
            "] 型変数=[" +
            typeParameterList.join(",") +
            "]"
        );
      }
      return {
        modulePathSet: new Set(),
        usedNameSet: new Set([type_.name])
      };
    case "ScopeInGlobal":
      return {
        modulePathSet: new Set(),
        usedNameSet: new Set([type_.name])
      };

    case "StringLiteral":
      return data;
  }
};

const concatCollectData = (
  collectDataA: data.UsedNameAndModulePathSet,
  collectDataB: data.UsedNameAndModulePathSet
): data.UsedNameAndModulePathSet => {
  return {
    modulePathSet: new Set([
      ...collectDataA.modulePathSet,
      ...collectDataB.modulePathSet
    ]),
    usedNameSet: new Set([
      ...collectDataA.usedNameSet,
      ...collectDataB.usedNameSet
    ])
  };
};
