import * as data from "./data";
import * as identifer from "./identifer";

/**
 * グローバル空間とルートにある関数名の引数名、使っている外部モジュールのパスを集める
 * コードのエラーもチェックする
 * @throws コードにエラーが見つかった
 */
export const collectInCode = (
  code: data.Code
): data.UsedNameAndModulePathSet => {
  const rootScopeIdentiferSet = collectRootScopeIdentifer(
    code.exportDefinitionList
  );

  return collectList(code.exportDefinitionList, (definition) =>
    collectInDefinition(definition, rootScopeIdentiferSet)
  );
};

type RootScopeIdentiferSet = {
  rootScopeTypeNameSet: ReadonlySet<identifer.Identifer>;
  rootScopeVariableName: ReadonlySet<identifer.Identifer>;
};

/**
 * 定義の名前を収集する
 * @throws 同名の定義があった場合
 */
const collectRootScopeIdentifer = (
  definitionList: ReadonlyArray<data.Definition>
): RootScopeIdentiferSet => {
  const typeNameSet: Set<identifer.Identifer> = new Set();
  const variableNameSet: Set<identifer.Identifer> = new Set();
  for (const definition of definitionList) {
    switch (definition._) {
      case "TypeAlias":
        if (typeNameSet.has(definition.typeAlias.name)) {
          throw new Error(
            "Duplicate typeAlias name. name=" +
              (definition.typeAlias.name as string)
          );
        }
        continue;

      case "Function":
        if (variableNameSet.has(definition.function_.name)) {
          throw new Error(
            "Duplicate function name. name=" +
              (definition.function_.name as string)
          );
        }
        continue;

      case "Variable":
        if (variableNameSet.has(definition.variable.name)) {
          throw new Error(
            "Duplicate variable name. name=" +
              (definition.variable.name as string)
          );
        }
    }
  }
  return {
    rootScopeTypeNameSet: typeNameSet,
    rootScopeVariableName: variableNameSet,
  };
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
      modulePathSet: new Set(),
    },
    collectInType(typeAlias.type_, rootScopeTypeNameSet, [
      new Set(typeAlias.parameterList),
    ])
  );
};

const collectInFunctionDefinition = (
  function_: data.Function,
  rootScopeIdentiferSet: RootScopeIdentiferSet
): data.UsedNameAndModulePathSet => {
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
  }
  return concatCollectData(
    concatCollectData(
      concatCollectData(
        {
          modulePathSet: new Set(),
          usedNameSet: new Set([function_.name]),
        },
        collectList(function_.parameterList, (parameter) =>
          concatCollectData(
            {
              usedNameSet: new Set([parameter.name]),
              modulePathSet: new Set(),
            },
            collectInType(
              parameter.type_,
              rootScopeIdentiferSet.rootScopeTypeNameSet,
              [new Set(function_.typeParameterList)]
            )
          )
        )
      ),
      collectInType(
        function_.returnType,
        rootScopeIdentiferSet.rootScopeTypeNameSet,
        [new Set(function_.typeParameterList)]
      )
    ),
    collectStatementList(
      function_.statementList,
      [],
      [new Set(function_.typeParameterList)],
      rootScopeIdentiferSet,
      parameterNameSet
    )
  );
};

const collectInVariableDefinition = (
  variable: data.Variable,
  rootScopeIdentiferSet: RootScopeIdentiferSet
): data.UsedNameAndModulePathSet =>
  concatCollectData(
    concatCollectData(
      {
        modulePathSet: new Set(),
        usedNameSet: new Set([variable.name]),
      },
      collectInType(
        variable.type_,
        rootScopeIdentiferSet.rootScopeTypeNameSet,
        [new Set()]
      )
    ),
    collectInExpr(variable.expr, [], [], rootScopeIdentiferSet)
  );

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
        usedNameSet: new Set(),
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

    case "ArrayLiteral":
      return collectList(expr.itemList, (item) =>
        collectInExpr(
          item.expr,
          localVariableNameSetList,
          typeParameterSetList,
          rootScopeIdentiferSet
        )
      );

    case "ObjectLiteral":
      return collectList(expr.memberList, (member) => {
        switch (member._) {
          case "Spread":
            return collectInExpr(
              member.expr,
              localVariableNameSetList,
              typeParameterSetList,
              rootScopeIdentiferSet
            );
          case "KeyValue":
            return collectInExpr(
              member.value,
              localVariableNameSetList,
              typeParameterSetList,
              rootScopeIdentiferSet
            );
        }
      });

    case "Lambda": {
      const parameterNameSet: Set<identifer.Identifer> = new Set();
      for (const oneParameter of expr.parameterList) {
        if (parameterNameSet.has(oneParameter.name)) {
          throw new Error(
            "Duplicate lambda parameter name. parameterName=" +
              (oneParameter.name as string)
          );
        }
        parameterNameSet.add(oneParameter.name);
      }

      return concatCollectData(
        concatCollectData(
          collectList(expr.parameterList, (oneParameter) =>
            concatCollectData(
              {
                usedNameSet: new Set([oneParameter.name]),
                modulePathSet: new Set(),
              },
              collectInType(
                oneParameter.type_,
                rootScopeIdentiferSet.rootScopeTypeNameSet,
                typeParameterSetList
              )
            )
          ),
          collectInType(
            expr.returnType,
            rootScopeIdentiferSet.rootScopeTypeNameSet,
            typeParameterSetList
          )
        ),
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
        usedNameSet: new Set(),
      };

    case "GlobalObjects":
      return {
        modulePathSet: new Set(),
        usedNameSet: new Set([expr.name]),
      };

    case "ImportedVariable":
      return {
        modulePathSet: new Set([expr.moduleName]),
        usedNameSet: new Set([expr.name]),
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

    case "Call":
      return concatCollectData(
        collectInExpr(
          expr.expr,
          localVariableNameSetList,
          typeParameterSetList,
          rootScopeIdentiferSet
        ),
        collectList(expr.parameterList, (parameter) =>
          collectInExpr(
            parameter,
            localVariableNameSetList,
            typeParameterSetList,
            rootScopeIdentiferSet
          )
        )
      );

    case "New": {
      return concatCollectData(
        collectInExpr(
          expr.expr,
          localVariableNameSetList,
          typeParameterSetList,
          rootScopeIdentiferSet
        ),
        collectList(expr.parameterList, (parameter) =>
          collectInExpr(
            parameter,
            localVariableNameSetList,
            typeParameterSetList,
            rootScopeIdentiferSet
          )
        )
      );
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
  const newLocalVariableNameSetList = localVariableNameSetList.concat(
    new Set([...parameterNameSet, ...collectNameInStatement(statementList)])
  );
  return collectList(statementList, (statement) =>
    collectInStatement(
      statement,
      newLocalVariableNameSetList,
      typeParameterSetList,
      rootScopeIdentiferSet
    )
  );
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
        usedNameSet: new Set(),
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
      const parameterNameSet: Set<identifer.Identifer> = new Set();
      for (const parameter of statement.functionDefinition.parameterList) {
        if (parameterNameSet.has(parameter.name)) {
          throw new Error(
            "ローカル内での関数定義のパラメーター名が重複しています parameterName=" +
              (parameter.name as string)
          );
        }
        parameterNameSet.add(parameter.name);
      }

      return concatCollectData(
        collectList(statement.functionDefinition.parameterList, (parameter) =>
          collectInType(
            parameter.type_,
            rootScopeIdentiferSet.rootScopeTypeNameSet,
            typeParameterSetList.concat(
              new Set(statement.functionDefinition.typeParameterList)
            )
          )
        ),
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
        usedNameSet: new Set(),
      };

    case "Switch":
      return concatCollectData(
        collectInExpr(
          statement.switch_.expr,
          localVariableNameSetList,
          typeParameterSetList,
          rootScopeIdentiferSet
        ),
        collectList(statement.switch_.patternList, (pattern) =>
          collectStatementList(
            pattern.statementList,
            localVariableNameSetList,
            typeParameterSetList,
            rootScopeIdentiferSet,
            new Set()
          )
        )
      );
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
        .map((scope) => "[" + [...scope].join(",") + "]")
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
  switch (type_._) {
    case "Number":
    case "String":
    case "Boolean":
    case "Undefined":
    case "Null":
    case "Never":
    case "Void":
      return {
        modulePathSet: new Set(),
        usedNameSet: new Set(),
      };

    case "Object":
      return collectList([...type_.memberDict], ([, value]) =>
        collectInType(value.type_, rootScopeTypeNameSet, typeParameterSetList)
      );

    case "Function":
      return concatCollectData(
        collectList(type_.parameterList, (parameter) =>
          collectInType(parameter, rootScopeTypeNameSet, typeParameterSetList)
        ),
        collectInType(type_.return, rootScopeTypeNameSet, typeParameterSetList)
      );

    case "WithTypeParameter":
      return concatCollectData(
        collectInType(type_.type_, rootScopeTypeNameSet, typeParameterSetList),
        collectList(type_.typeParameterList, (parameter) =>
          collectInType(parameter, rootScopeTypeNameSet, typeParameterSetList)
        )
      );

    case "Union":
      return collectList(type_.types, (oneType) =>
        collectInType(oneType, rootScopeTypeNameSet, typeParameterSetList)
      );

    case "Intersection":
      return concatCollectData(
        collectInType(type_.left, rootScopeTypeNameSet, typeParameterSetList),
        collectInType(type_.right, rootScopeTypeNameSet, typeParameterSetList)
      );

    case "ImportedType":
      return {
        modulePathSet: new Set([type_.moduleName]),
        usedNameSet: new Set([type_.name]),
      };

    case "ScopeInFile":
      checkTypeIsDefinedOrThrow(
        rootScopeTypeNameSet,
        typeParameterSetList,
        type_.name
      );
      return {
        modulePathSet: new Set(),
        usedNameSet: new Set([type_.name]),
      };

    case "ScopeInGlobal":
      return {
        modulePathSet: new Set(),
        usedNameSet: new Set([type_.name]),
      };

    case "StringLiteral":
      return {
        modulePathSet: new Set(),
        usedNameSet: new Set(),
      };
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
        .map((scope) => "[ " + [...scope].join(",") + " ]")
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
      ...collectDataB.modulePathSet,
    ]),
    usedNameSet: new Set([
      ...collectDataA.usedNameSet,
      ...collectDataB.usedNameSet,
    ]),
  };
};

const collectList = <element>(
  list: ReadonlyArray<element>,
  collectFunc: (element: element) => data.UsedNameAndModulePathSet
): data.UsedNameAndModulePathSet => {
  const modulePathSet: Set<string> = new Set();
  const usedNameSet: Set<identifer.Identifer> = new Set();
  for (const element of list) {
    const result = collectFunc(element);
    for (const path of result.modulePathSet) {
      modulePathSet.add(path);
    }
    for (const name of result.usedNameSet) {
      usedNameSet.add(name);
    }
  }
  return {
    modulePathSet,
    usedNameSet,
  };
};
