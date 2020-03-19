import * as data from "./data";
import * as identifer from "./identifer";

/**
 * グローバル空間とルートにある関数名の引数名、使っている外部モジュールのパスを集める
 */
export const collectInCode = (
  code: data.Code
): data.UsedNameAndModulePathSet => {
  const rootScopeIdentiferSet = code.exportDefinitionList.reduce<
    RootScopeIdentiferSet
  >(collectDefinitionNameInDefinition, {
    rootScopeTypeNameSet: new Set(),
    rootScopeVariableName: new Set()
  });

  let scanData: data.UsedNameAndModulePathSet = {
    usedNameSet: new Set(),
    modulePathSet: new Set()
  };
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
      return collectInFunctionDefinition(
        definition.function_,
        rootScopeIdentiferSet
      );

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
    collectInType(typeAlias.type_, rootScopeTypeNameSet, [
      new Set(typeAlias.parameterList)
    ])
  );
};

const collectInFunctionDefinition = (
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
          [new Set(function_.typeParameterList)]
        )
      )
    );
  }
  collectData = concatCollectData(
    collectData,
    collectInType(
      function_.returnType,
      rootScopeIdentiferSet.rootScopeTypeNameSet,
      [new Set(function_.typeParameterList)]
    )
  );
  collectData = concatCollectData(
    collectData,
    collectStatementList(
      function_.statementList,
      [],
      [new Set(function_.typeParameterList)],
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
    collectInType(variable.type_, rootScopeIdentiferSet.rootScopeTypeNameSet, [
      new Set()
    ])
  );
  return concatCollectData(
    collectData,
    collectInExpr(variable.expr, [], [], rootScopeIdentiferSet)
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
  typeParameterSetList: ReadonlyArray<ReadonlySet<identifer.Identifer>>,
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
        typeParameterSetList,
        rootScopeIdentiferSet
      );

    case "BinaryOperator":
      return concatCollectData(
        collectInExpr(
          expr.left,
          localVariableNameSetList,
          typeParameterSetList,
          rootScopeIdentiferSet
        ),
        collectInExpr(
          expr.right,
          localVariableNameSetList,
          typeParameterSetList,
          rootScopeIdentiferSet
        )
      );
    case "ConditionalOperator":
      return concatCollectData(
        collectInExpr(
          expr.condition,
          localVariableNameSetList,
          typeParameterSetList,
          rootScopeIdentiferSet
        ),
        concatCollectData(
          collectInExpr(
            expr.thenExpr,
            localVariableNameSetList,
            typeParameterSetList,
            rootScopeIdentiferSet
          ),
          collectInExpr(
            expr.elseExpr,
            localVariableNameSetList,
            typeParameterSetList,
            rootScopeIdentiferSet
          )
        )
      );

    case "ArrayLiteral": {
      let data: data.UsedNameAndModulePathSet = {
        modulePathSet: new Set(),
        usedNameSet: new Set()
      };
      for (const { expr: item } of expr.itemList) {
        data = concatCollectData(
          data,
          collectInExpr(
            item,
            localVariableNameSetList,
            typeParameterSetList,
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
      for (const member of expr.memberList) {
        switch (member._) {
          case "Spread":
            data = concatCollectData(
              data,
              collectInExpr(
                member.expr,
                localVariableNameSetList,
                typeParameterSetList,
                rootScopeIdentiferSet
              )
            );
            break;
          case "KeyValue":
            data = concatCollectData(
              data,
              collectInExpr(
                member.value,
                localVariableNameSetList,
                typeParameterSetList,
                rootScopeIdentiferSet
              )
            );
        }
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
            typeParameterSetList
          )
        );
      }
      data = concatCollectData(
        data,
        collectInType(
          expr.returnType,
          rootScopeIdentiferSet.rootScopeTypeNameSet,
          typeParameterSetList
        )
      );
      return concatCollectData(
        data,
        collectStatementList(
          expr.statementList,
          localVariableNameSetList,
          typeParameterSetList,
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
          typeParameterSetList,
          rootScopeIdentiferSet
        ),
        collectInExpr(
          expr.propertyName,
          localVariableNameSetList,
          typeParameterSetList,
          rootScopeIdentiferSet
        )
      );

    case "Call": {
      let data: data.UsedNameAndModulePathSet = collectInExpr(
        expr.expr,
        localVariableNameSetList,
        typeParameterSetList,
        rootScopeIdentiferSet
      );
      for (const parameter of expr.parameterList) {
        data = concatCollectData(
          data,
          collectInExpr(
            parameter,
            localVariableNameSetList,
            typeParameterSetList,
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
        typeParameterSetList,
        rootScopeIdentiferSet
      );
      for (const parameter of expr.parameterList) {
        data = concatCollectData(
          data,
          collectInExpr(
            parameter,
            localVariableNameSetList,
            typeParameterSetList,
            rootScopeIdentiferSet
          )
        );
      }
      return data;
    }

    case "TypeAssertion":
      return concatCollectData(
        collectInExpr(
          expr.expr,
          localVariableNameSetList,
          typeParameterSetList,
          rootScopeIdentiferSet
        ),
        collectInType(
          expr.type_,
          rootScopeIdentiferSet.rootScopeTypeNameSet,
          typeParameterSetList
        )
      );
  }
};

const collectStatementList = (
  statementList: ReadonlyArray<data.Statement>,
  localVariableNameSetList: ReadonlyArray<ReadonlySet<identifer.Identifer>>,
  typeParameterSetList: ReadonlyArray<ReadonlySet<identifer.Identifer>>,
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
        typeParameterSetList,
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
  typeParameterSetList: ReadonlyArray<ReadonlySet<identifer.Identifer>>,
  rootScopeIdentiferSet: RootScopeIdentiferSet
): data.UsedNameAndModulePathSet => {
  switch (statement._) {
    case "EvaluateExpr":
      return collectInExpr(
        statement.expr,
        localVariableNameSetList,
        typeParameterSetList,
        rootScopeIdentiferSet
      );

    case "Set":
      return concatCollectData(
        collectInExpr(
          statement.targetObject,
          localVariableNameSetList,
          typeParameterSetList,
          rootScopeIdentiferSet
        ),
        collectInExpr(
          statement.expr,
          localVariableNameSetList,
          typeParameterSetList,
          rootScopeIdentiferSet
        )
      );

    case "If":
      return concatCollectData(
        collectInExpr(
          statement.condition,
          localVariableNameSetList,
          typeParameterSetList,
          rootScopeIdentiferSet
        ),
        collectStatementList(
          statement.thenStatementList,
          localVariableNameSetList,
          typeParameterSetList,
          rootScopeIdentiferSet,
          new Set()
        )
      );

    case "ThrowError":
      return collectInExpr(
        statement.errorMessage,
        localVariableNameSetList,
        typeParameterSetList,
        rootScopeIdentiferSet
      );

    case "Return":
      return collectInExpr(
        statement.expr,
        localVariableNameSetList,
        typeParameterSetList,
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
          typeParameterSetList,
          rootScopeIdentiferSet
        ),
        collectInType(
          statement.type_,
          rootScopeIdentiferSet.rootScopeTypeNameSet,
          typeParameterSetList
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
            typeParameterSetList.concat(
              new Set(statement.functionDefinition.typeParameterList)
            )
          )
        );
      }

      return concatCollectData(
        data,
        concatCollectData(
          collectInType(
            statement.functionDefinition.returnType,
            rootScopeIdentiferSet.rootScopeTypeNameSet,
            typeParameterSetList.concat(
              new Set(statement.functionDefinition.typeParameterList)
            )
          ),
          collectStatementList(
            statement.functionDefinition.statementList,
            localVariableNameSetList,
            typeParameterSetList.concat(
              new Set(statement.functionDefinition.typeParameterList)
            ),
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
          typeParameterSetList,
          rootScopeIdentiferSet
        ),
        collectStatementList(
          statement.statementList,
          localVariableNameSetList,
          typeParameterSetList,
          rootScopeIdentiferSet,
          new Set([statement.counterVariableName])
        )
      );

    case "ForOf":
      return concatCollectData(
        collectInExpr(
          statement.iterableExpr,
          localVariableNameSetList,
          typeParameterSetList,
          rootScopeIdentiferSet
        ),
        collectStatementList(
          statement.statementList,
          localVariableNameSetList,
          typeParameterSetList,
          rootScopeIdentiferSet,
          new Set([statement.elementVariableName])
        )
      );

    case "WhileTrue":
      return collectStatementList(
        statement.statementList,
        localVariableNameSetList,
        typeParameterSetList,
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
        typeParameterSetList,
        rootScopeIdentiferSet
      );
      for (const pattern of statement.switch_.patternList) {
        data = concatCollectData(
          data,
          collectStatementList(
            pattern.statementList,
            localVariableNameSetList,
            typeParameterSetList,
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
      " スコープ内に存在している変数 =[ " +
      localVariableNameSetList
        .map(scope => "[" + [...scope].join(",") + "]")
        .join(",") +
      " ]" +
      "ファイルの直下に存在している変数 =" +
      "[" +
      [...rootScopeNameSet].join(",") +
      "]"
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
  typeParameterSetList: ReadonlyArray<ReadonlySet<identifer.Identifer>>
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
        collectInType(value.type_, rootScopeTypeNameSet, typeParameterSetList);
      }
      return data;

    case "Function":
      for (const parameter of type_.parameterList) {
        data = concatCollectData(
          data,
          collectInType(parameter, rootScopeTypeNameSet, typeParameterSetList)
        );
      }
      data = concatCollectData(
        data,
        collectInType(type_.return, rootScopeTypeNameSet, typeParameterSetList)
      );
      return data;

    case "WithTypeParameter":
      data = concatCollectData(
        data,
        collectInType(type_.type_, rootScopeTypeNameSet, typeParameterSetList)
      );
      for (const parameter of type_.typeParameterList) {
        data = concatCollectData(
          data,
          collectInType(parameter, rootScopeTypeNameSet, typeParameterSetList)
        );
      }
      return data;

    case "Union":
      for (const oneType of type_.types) {
        data = concatCollectData(
          data,
          collectInType(oneType, rootScopeTypeNameSet, typeParameterSetList)
        );
      }
      return data;

    case "Intersection":
      return concatCollectData(
        collectInType(type_.left, rootScopeTypeNameSet, typeParameterSetList),
        collectInType(type_.right, rootScopeTypeNameSet, typeParameterSetList)
      );

    case "ImportedType":
      return {
        modulePathSet: new Set([type_.moduleName]),
        usedNameSet: new Set([type_.name])
      };

    case "ScopeInFile":
      checkTypeIsDefinedOrThrow(
        rootScopeTypeNameSet,
        typeParameterSetList,
        type_.name
      );
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

const checkTypeIsDefinedOrThrow = (
  rootScopeTypeNameSet: ReadonlySet<identifer.Identifer>,
  typeParameterSetList: ReadonlyArray<ReadonlySet<identifer.Identifer>>,
  typeName: identifer.Identifer
): void => {
  for (let i = 0; i < typeParameterSetList.length; i++) {
    if (
      typeParameterSetList[typeParameterSetList.length - 1 - i].has(typeName)
    ) {
      return;
    }
  }
  if (rootScopeTypeNameSet.has(typeName)) {
    return;
  }
  throw new Error(
    "存在しない型変数を指定されました typeName=" +
      (typeName as string) +
      " 存在している変数 =[ " +
      typeParameterSetList
        .map(scope => "[ " + [...scope].join(",") + " ]")
        .join(",") +
      "]" +
      "ファイルの直下に存在している型 =[ " +
      [...rootScopeTypeNameSet].join(",") +
      " ]"
  );
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
