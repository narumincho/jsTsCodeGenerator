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
    collectInType(
      typeAlias.type_,
      rootScopeTypeNameSet,
      new Set(typeAlias.parameterList)
    )
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
  const parameterNameSet: Set<identifer.Identifer> = new Set();
  for (const parameter of function_.parameterList) {
    if (parameterNameSet.has(parameter.name)) {
      throw new Error(
        "外部に公開する関数のパラメーター名が重複しています parameterName=" +
          (parameter.name as string) +
          " exportFunctionName=" +
          (function_.name as string)
      );
    }
    parameterNameSet.add(parameter.name);
    collectData = concatCollectData(
      collectData,
      concatCollectData(
        {
          usedNameSet: new Set([parameter.name]),
          modulePathSet: new Set()
        },
        collectInType(
          parameter.type_,
          rootScopeIdentiferSet.rootScopeTypeNameSet,
          new Set(function_.typeParameterList)
        )
      )
    );
  }
  collectData = concatCollectData(
    collectData,
    collectInType(
      function_.returnType,
      rootScopeIdentiferSet.rootScopeTypeNameSet,
      new Set(function_.typeParameterList)
    )
  );
  collectData = concatCollectData(
    collectData,
    collectStatementList(
      function_.statementList,
      [],
      rootScopeIdentiferSet,
      parameterNameSet
    )
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
    collectInType(
      variable.type_,
      rootScopeIdentiferSet.rootScopeTypeNameSet,
      new Set()
    )
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
    case "StringLiteral":
    case "BooleanLiteral":
    case "NullLiteral":
    case "UndefinedLiteral":
      return {
        modulePathSet: new Set(),
        usedNameSet: new Set()
      };

    case "UnaryOperator":
      return collectInExpr(
        expr.expr,
        localVariableNameSetList,
        rootScopeIdentiferSet
      );

    case "BinaryOperator":
      return concatCollectData(
        collectInExpr(
          expr.left,
          localVariableNameSetList,
          rootScopeIdentiferSet
        ),
        collectInExpr(
          expr.right,
          localVariableNameSetList,
          rootScopeIdentiferSet
        )
      );
    case "ConditionalOperator":
      return concatCollectData(
        collectInExpr(
          expr.condition,
          localVariableNameSetList,
          rootScopeIdentiferSet
        ),
        concatCollectData(
          collectInExpr(
            expr.thenExpr,
            localVariableNameSetList,
            rootScopeIdentiferSet
          ),
          collectInExpr(
            expr.elseExpr,
            localVariableNameSetList,
            rootScopeIdentiferSet
          )
        )
      );

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
      const parameterNameSet: Set<identifer.Identifer> = new Set();
      for (const oneParameter of expr.parameterList) {
        if (parameterNameSet.has(oneParameter.name)) {
          throw new Error(
            "ラムダ式で同名のパラメーターがある parameterName=" +
              (oneParameter.name as string)
          );
        }
        parameterNameSet.add(oneParameter.name);
        data = concatCollectData(
          data,
          collectInType(
            oneParameter.type_,
            rootScopeIdentiferSet.rootScopeTypeNameSet,
            new Set()
          )
        );
      }
      data = concatCollectData(
        data,
        collectInType(
          expr.returnType,
          rootScopeIdentiferSet.rootScopeTypeNameSet,
          new Set()
        )
      );
      return concatCollectData(
        data,
        collectStatementList(
          expr.statementList,
          localVariableNameSetList,
          rootScopeIdentiferSet,
          parameterNameSet
        )
      );
    }

    case "Variable":
      checkVariableIsDefinedOrThrow(
        localVariableNameSetList,
        rootScopeIdentiferSet.rootScopeVariableName,
        expr.name
      );
      return {
        modulePathSet: new Set(),
        usedNameSet: new Set([expr.name])
      };

    case "GlobalObjects":
      return {
        modulePathSet: new Set(),
        usedNameSet: new Set()
      };

    case "ImportedVariable":
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
  statementList: ReadonlyArray<data.Statement>,
  localVariableNameSetList: ReadonlyArray<ReadonlySet<identifer.Identifer>>,
  rootScopeIdentiferSet: RootScopeIdentiferSet,
  parameterNameSet: ReadonlySet<identifer.Identifer>
): data.UsedNameAndModulePathSet => {
  let data: data.UsedNameAndModulePathSet = {
    modulePathSet: new Set(),
    usedNameSet: new Set()
  };
  const localVariableNameSet = new Set([
    ...collectNameInStatement(statementList),
    ...parameterNameSet
  ]);
  for (const statement of statementList) {
    data = concatCollectData(
      data,
      collectInStatement(
        statement,
        localVariableNameSetList.concat(localVariableNameSet),
        rootScopeIdentiferSet
      )
    );
  }
  return data;
};

const collectNameInStatement = (
  statementList: ReadonlyArray<data.Statement>
): Set<identifer.Identifer> => {
  const identiferSet: Set<identifer.Identifer> = new Set();
  for (const statement of statementList) {
    switch (statement._) {
      case "VariableDefinition":
        identiferSet.add(statement.name);
        continue;
      case "FunctionDefinition":
        identiferSet.add(statement.functionDefinition.name);
    }
  }
  return identiferSet;
};

const collectInStatement = (
  statement: data.Statement,
  localVariableNameSetList: ReadonlyArray<ReadonlySet<identifer.Identifer>>,
  rootScopeIdentiferSet: RootScopeIdentiferSet
): data.UsedNameAndModulePathSet => {
  switch (statement._) {
    case "EvaluateExpr":
      return collectInExpr(
        statement.expr,
        localVariableNameSetList,
        rootScopeIdentiferSet
      );

    case "Set":
      return concatCollectData(
        collectInExpr(
          statement.targetObject,
          localVariableNameSetList,
          rootScopeIdentiferSet
        ),
        collectInExpr(
          statement.expr,
          localVariableNameSetList,
          rootScopeIdentiferSet
        )
      );

    case "If":
      return concatCollectData(
        collectInExpr(
          statement.condition,
          localVariableNameSetList,
          rootScopeIdentiferSet
        ),
        collectStatementList(
          statement.thenStatementList,
          localVariableNameSetList,
          rootScopeIdentiferSet,
          new Set()
        )
      );

    case "ThrowError":
      return collectInExpr(
        statement.errorMessage,
        localVariableNameSetList,
        rootScopeIdentiferSet
      );

    case "Return":
      return collectInExpr(
        statement.expr,
        localVariableNameSetList,
        rootScopeIdentiferSet
      );

    case "ReturnVoid":
    case "Continue":
      return {
        modulePathSet: new Set(),
        usedNameSet: new Set()
      };

    case "VariableDefinition":
      return concatCollectData(
        collectInExpr(
          statement.expr,
          localVariableNameSetList,
          rootScopeIdentiferSet
        ),
        collectInType(
          statement.type_,
          rootScopeIdentiferSet.rootScopeTypeNameSet,
          new Set()
        )
      );

    case "FunctionDefinition": {
      let data: data.UsedNameAndModulePathSet = {
        modulePathSet: new Set(),
        usedNameSet: new Set()
      };
      const parameterNameSet: Set<identifer.Identifer> = new Set();
      for (const parameter of statement.functionDefinition.parameterList) {
        if (parameterNameSet.has(parameter.name)) {
          throw new Error(
            "ローカル内での関数定義のパラメーター名が重複しています parameterName=" +
              (parameter.name as string)
          );
        }
        parameterNameSet.add(parameter.name);
        data = concatCollectData(
          data,
          collectInType(
            parameter.type_,
            rootScopeIdentiferSet.rootScopeTypeNameSet,
            new Set(statement.functionDefinition.typeParameterList)
          )
        );
      }

      return concatCollectData(
        data,
        concatCollectData(
          collectInType(
            statement.functionDefinition.returnType,
            rootScopeIdentiferSet.rootScopeTypeNameSet,
            new Set()
          ),
          collectStatementList(
            statement.functionDefinition.statementList,
            localVariableNameSetList,
            rootScopeIdentiferSet,
            parameterNameSet
          )
        )
      );
    }

    case "For":
      return concatCollectData(
        collectInExpr(
          statement.untilExpr,
          localVariableNameSetList,
          rootScopeIdentiferSet
        ),
        collectStatementList(
          statement.statementList,
          localVariableNameSetList,
          rootScopeIdentiferSet,
          new Set([statement.counterVariableName])
        )
      );

    case "ForOf":
      return concatCollectData(
        collectInExpr(
          statement.iterableExpr,
          localVariableNameSetList,
          rootScopeIdentiferSet
        ),
        collectStatementList(
          statement.statementList,
          localVariableNameSetList,
          rootScopeIdentiferSet,
          new Set([statement.elementVariableName])
        )
      );

    case "WhileTrue":
      return collectStatementList(
        statement.statementList,
        localVariableNameSetList,
        rootScopeIdentiferSet,
        new Set()
      );
    case "Break":
      return {
        modulePathSet: new Set(),
        usedNameSet: new Set()
      };

    case "Switch": {
      let data: data.UsedNameAndModulePathSet = collectInExpr(
        statement.switch_.expr,
        localVariableNameSetList,
        rootScopeIdentiferSet
      );
      for (const pattern of statement.switch_.patternList) {
        data = concatCollectData(
          data,
          collectStatementList(
            pattern.statementList,
            localVariableNameSetList,
            rootScopeIdentiferSet,
            new Set()
          )
        );
      }
      return data;
    }
  }
};

const checkVariableIsDefinedOrThrow = (
  localVariableNameSetList: ReadonlyArray<ReadonlySet<string>>,
  rootScopeNameSet: ReadonlySet<identifer.Identifer>,
  variableName: identifer.Identifer
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
  if (rootScopeNameSet.has(variableName)) {
    return;
  }
  throw new Error(
    "存在しない変数を指定されました name=" +
      (variableName as string) +
      " 存在している変数 =" +
      localVariableNameSetList
        .map(scope => "[" + [...scope].join(",") + "]")
        .join(",")
  );
};

/**
 * グローバル空間(グローバル変数、直下の関数の引数名)に出ている型の名前を集める
 * @param type_ 型の式
 * @param scanData グローバルで使われている名前の集合などのコード全体の情報の収集データ。上書きする
 */
const collectInType = (
  type_: data.Type,
  rootScopeTypeNameSet: ReadonlySet<identifer.Identifer>,
  typeParameterSet: ReadonlySet<identifer.Identifer>
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
        collectInType(value.type_, rootScopeTypeNameSet, typeParameterSet);
      }
      return data;

    case "Function":
      for (const parameter of type_.parameterList) {
        data = concatCollectData(
          data,
          collectInType(parameter, rootScopeTypeNameSet, typeParameterSet)
        );
      }
      data = concatCollectData(
        data,
        collectInType(type_.return, rootScopeTypeNameSet, typeParameterSet)
      );
      return data;

    case "WithTypeParameter":
      data = concatCollectData(
        data,
        collectInType(type_.type_, rootScopeTypeNameSet, typeParameterSet)
      );
      for (const parameter of type_.typeParameterList) {
        data = concatCollectData(
          data,
          collectInType(parameter, rootScopeTypeNameSet, typeParameterSet)
        );
      }
      return data;

    case "Union":
      for (const oneType of type_.types) {
        data = concatCollectData(
          data,
          collectInType(oneType, rootScopeTypeNameSet, typeParameterSet)
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
        !typeParameterSet.has(type_.name)
      ) {
        throw new Error(
          "このファイルに存在しない型を指定された typeName=" +
            (type_.name as string) +
            "このファイルに存在する型=[" +
            [...rootScopeTypeNameSet].join(",") +
            "] 型変数=[" +
            [...typeParameterSet].join(",") +
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
