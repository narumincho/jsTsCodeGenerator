import * as identifer from "../identifer";
import * as type from "../type";
import * as typeExpr from "./typeExpr";
import * as namedExpr from "../namedTree/expr";
import * as namedTypeExpr from "../namedTree/typeExpr";
import * as util from "../util";

/**
 * グローバルで使われているものを収集したり、インポートしているものを収集する
 * @param expr 式
 * @param scanData グローバルで使われている名前の集合などのコード全体の情報の収集データ。上書きする
 */
export const scanExpr = (expr: Expr, scanData: type.GlobalNameData): void => {
  switch (expr._) {
    case Expr_.NumberLiteral:
    case Expr_.UnaryOperator:
    case Expr_.StringLiteral:
    case Expr_.BooleanLiteral:
    case Expr_.UndefinedLiteral:
    case Expr_.NullLiteral:
    case Expr_.EnumTag:
      return;

    case Expr_.ArrayLiteral:
      for (const exprElement of expr.exprList) {
        scanExpr(exprElement, scanData);
      }
      return;

    case Expr_.ObjectLiteral:
      for (const [, member] of expr.memberList) {
        scanExpr(member, scanData);
      }
      return;

    case Expr_.LambdaWithReturn:
      for (const oneParameter of expr.parameterList) {
        typeExpr.scan(oneParameter.typeExpr, scanData);
      }
      typeExpr.scan(expr.returnType, scanData);
      scanStatementList(expr.statementList, scanData);
      return;

    case Expr_.LambdaReturnVoid:
      for (const oneParameter of expr.parameterList) {
        typeExpr.scan(oneParameter.typeExpr, scanData);
      }
      scanStatementList(expr.statementList, scanData);
      return;

    case Expr_.GlobalVariable:
      identifer.checkIdentiferThrow("global variable name", expr.name);
      scanData.globalNameSet.add(expr.name);
      return;

    case Expr_.ImportedVariable:
      identifer.checkIdentiferThrow("imported variable name", expr.name);
      scanData.importedModulePath.add(expr.path);
      return;

    case Expr_.Get:
      scanExpr(expr.expr, scanData);
      scanExpr(expr.propertyName, scanData);
      return;

    case Expr_.Call:
      scanExpr(expr.expr, scanData);
      for (const parameter of expr.parameterList) {
        scanExpr(parameter, scanData);
      }
      return;

    case Expr_.New:
      scanExpr(expr.expr, scanData);
      for (const parameter of expr.parameterList) {
        scanExpr(parameter, scanData);
      }
      return;
  }
};

export const scanStatementList = (
  statementList: ReadonlyArray<Statement>,
  scanData: type.GlobalNameData
): void => {
  for (const statement of statementList) {
    scanStatement(statement, scanData);
  }
};

export const scanStatement = (
  statement: Statement,
  scanData: type.GlobalNameData
): void => {
  switch (statement._) {
    case Statement_.EvaluateExpr:
      scanExpr(statement.expr, scanData);
      return;

    case Statement_.Set:
      scanExpr(statement.targetObject, scanData);
      scanExpr(statement.expr, scanData);
      return;

    case Statement_.If:
      scanExpr(statement.condition, scanData);
      scanStatementList(statement.thenStatementList, scanData);
      return;

    case Statement_.ThrowError:
      scanExpr(statement.errorMessage, scanData);
      return;

    case Statement_.Return:
      scanExpr(statement.expr, scanData);
      return;

    case Statement_.ReturnVoid:
      return;

    case Statement_.Continue:
      return;

    case Statement_.VariableDefinition:
      scanExpr(statement.expr, scanData);
      typeExpr.scan(statement.typeExpr, scanData);
      return;

    case Statement_.FunctionWithReturnValueVariableDefinition:
      for (const parameter of statement.parameterList) {
        typeExpr.scan(parameter.typeExpr, scanData);
      }
      typeExpr.scan(statement.returnType, scanData);
      scanStatementList(statement.statementList, scanData);
      return;

    case Statement_.ReturnVoidFunctionVariableDefinition:
      for (const parameter of statement.parameterList) {
        typeExpr.scan(parameter.typeExpr, scanData);
      }
      scanStatementList(statement.statementList, scanData);
      return;

    case Statement_.For:
      scanExpr(statement.untilExpr, scanData);
      scanStatementList(statement.statementList, scanData);
      return;

    case Statement_.ForOf:
      scanExpr(statement.iterableExpr, scanData);
      scanStatementList(statement.statementList, scanData);
      return;

    case Statement_.WhileTrue:
      scanStatementList(statement.statementList, scanData);
  }
};

export const toNamedExpr = (
  expr: Expr,
  globalNameAndImportPathAndIdentifer: type.GlobalNameAndImportPathAndIdentifer,
  identiferIndex: identifer.IdentiferIndex,
  localVariableNameMapList: ReadonlyArray<ReadonlyMap<string, string>>,
  enumList: ReadonlyArray<type.Enum>
): namedExpr.Expr => {
  switch (expr._) {
    case Expr_.NumberLiteral:
      return {
        _: namedExpr.Expr_.NumberLiteral,
        value: expr.value
      };
    case Expr_.StringLiteral:
      return {
        _: namedExpr.Expr_.StringLiteral,
        value: expr.value
      };
    case Expr_.BooleanLiteral:
      return {
        _: namedExpr.Expr_.BooleanLiteral,
        value: expr.value
      };
    case Expr_.UndefinedLiteral:
      return {
        _: namedExpr.Expr_.UndefinedLiteral
      };
    case Expr_.NullLiteral:
      return {
        _: namedExpr.Expr_.NullLiteral
      };
    case Expr_.ArrayLiteral:
      return {
        _: namedExpr.Expr_.ArrayLiteral,
        exprList: expr.exprList.map(expr =>
          toNamedExpr(
            expr,
            globalNameAndImportPathAndIdentifer,
            identiferIndex,
            localVariableNameMapList,
            enumList
          )
        )
      };
    case Expr_.ObjectLiteral:
      return {
        _: namedExpr.Expr_.ObjectLiteral,
        memberList: new Map(
          [...expr.memberList].map(([name, expr]) => [
            name,
            toNamedExpr(
              expr,
              globalNameAndImportPathAndIdentifer,
              identiferIndex,
              localVariableNameMapList,
              enumList
            )
          ])
        )
      };
    case Expr_.UnaryOperator:
      return {
        _: namedExpr.Expr_.UnaryOperator,
        expr: toNamedExpr(
          expr.expr,
          globalNameAndImportPathAndIdentifer,
          identiferIndex,
          localVariableNameMapList,
          enumList
        ),
        operator: expr.operator
      };
    case Expr_.BinaryOperator:
      return {
        _: namedExpr.Expr_.BinaryOperator,
        left: toNamedExpr(
          expr.left,
          globalNameAndImportPathAndIdentifer,
          identiferIndex,
          localVariableNameMapList,
          enumList
        ),
        right: toNamedExpr(
          expr.right,
          globalNameAndImportPathAndIdentifer,
          identiferIndex,
          localVariableNameMapList,
          enumList
        ),
        operator: expr.operator
      };
    case Expr_.ConditionalOperator:
      return {
        _: namedExpr.Expr_.ConditionalOperator,
        condition: toNamedExpr(
          expr,
          globalNameAndImportPathAndIdentifer,
          identiferIndex,
          localVariableNameMapList,
          enumList
        ),
        elseExpr: toNamedExpr(
          expr,
          globalNameAndImportPathAndIdentifer,
          identiferIndex,
          localVariableNameMapList,
          enumList
        ),
        thenExpr: toNamedExpr(
          expr,
          globalNameAndImportPathAndIdentifer,
          identiferIndex,
          localVariableNameMapList,
          enumList
        )
      };
    case Expr_.LambdaWithReturn: {
      const parameterNameMap: Array<{
        oldName: string;
        name: string;
        typeExpr: namedTypeExpr.TypeExpr;
      }> = [];
      let identiferIndex = identifer.initialIdentiferIndex;
      for (const parameter of expr.parameterList) {
        const identiferAndNextIndex = identifer.createIdentifer(
          identiferIndex,
          globalNameAndImportPathAndIdentifer.globalNameSet
        );
        identiferIndex = identiferAndNextIndex.nextIdentiferIndex;
        parameterNameMap.push({
          oldName: variableNameListToMapKey(parameter.name),
          name: identiferAndNextIndex.identifer,
          typeExpr: typeExpr.toNamed(
            parameter.typeExpr,
            globalNameAndImportPathAndIdentifer
          )
        });
      }
      return {
        _: namedExpr.Expr_.LambdaWithReturn,
        parameterList: parameterNameMap,
        returnType: typeExpr.toNamed(
          expr.returnType,
          globalNameAndImportPathAndIdentifer
        ),
        statementList: toNamedStatementList(
          expr.statementList,
          globalNameAndImportPathAndIdentifer,
          identiferIndex,
          localVariableNameMapList,
          new Map(
            parameterNameMap.map(parameter => [
              parameter.oldName,
              parameter.name
            ])
          ),
          enumList
        )
      };
    }
    case Expr_.LambdaReturnVoid: {
      const parameterList: Array<{
        oldName: string;
        name: string;
        typeExpr: namedTypeExpr.TypeExpr;
      }> = [];
      let identiferIndex = identifer.initialIdentiferIndex;
      for (const parameter of expr.parameterList) {
        const identiferAndNextIndex = identifer.createIdentifer(
          identiferIndex,
          globalNameAndImportPathAndIdentifer.globalNameSet
        );
        identiferIndex = identiferAndNextIndex.nextIdentiferIndex;
        parameterList.push({
          oldName: variableNameListToMapKey(parameter.name),
          name: identiferAndNextIndex.identifer,
          typeExpr: typeExpr.toNamed(
            parameter.typeExpr,
            globalNameAndImportPathAndIdentifer
          )
        });
      }
      return {
        _: namedExpr.Expr_.LambdaReturnVoid,
        parameterList,
        statementList: toNamedStatementList(
          expr.statementList,
          globalNameAndImportPathAndIdentifer,
          identiferIndex,
          localVariableNameMapList,
          new Map(
            parameterList.map(parameter => [parameter.oldName, parameter.name])
          ),
          enumList
        )
      };
    }

    case Expr_.GlobalVariable:
      return {
        _: namedExpr.Expr_.GlobalVariable,
        name: expr.name
      };

    case Expr_.ImportedVariable: {
      const nameSpaceIdentifer = globalNameAndImportPathAndIdentifer.importedModuleNameIdentiferMap.get(
        expr.path
      );
      if (nameSpaceIdentifer === undefined) {
        throw new Error(
          `認識されていない外部モジュールの名前空間識別子を発見した in expr (${expr.path})`
        );
      }
      return {
        _: namedExpr.Expr_.ImportedVariable,
        nameSpaceIdentifer: nameSpaceIdentifer,
        name: expr.name
      };
    }

    case Expr_.Get:
      return {
        _: namedExpr.Expr_.Get,
        expr: toNamedExpr(
          expr.expr,
          globalNameAndImportPathAndIdentifer,
          identiferIndex,
          localVariableNameMapList,
          enumList
        ),
        propertyName: toNamedExpr(
          expr.propertyName,
          globalNameAndImportPathAndIdentifer,
          identiferIndex,
          localVariableNameMapList,
          enumList
        )
      };

    case Expr_.Call:
      return {
        _: namedExpr.Expr_.Call,
        expr: toNamedExpr(
          expr.expr,
          globalNameAndImportPathAndIdentifer,
          identiferIndex,
          localVariableNameMapList,
          enumList
        ),
        parameterList: expr.parameterList.map(parameter =>
          toNamedExpr(
            parameter,
            globalNameAndImportPathAndIdentifer,
            identiferIndex,
            localVariableNameMapList,
            enumList
          )
        )
      };
    case Expr_.New:
      return {
        _: namedExpr.Expr_.New,
        expr: toNamedExpr(
          expr.expr,
          globalNameAndImportPathAndIdentifer,
          identiferIndex,
          localVariableNameMapList,
          enumList
        ),
        parameterList: expr.parameterList.map(parameter =>
          toNamedExpr(
            parameter,
            globalNameAndImportPathAndIdentifer,
            identiferIndex,
            localVariableNameMapList,
            enumList
          )
        )
      };
    case Expr_.LocalVariable: {
      return {
        _: namedExpr.Expr_.LocalVariable,
        name: searchName(localVariableNameMapList, expr.name)
      };
    }

    case Expr_.EnumTag: {
      const enum_ = util.getFirstElementByCondition<type.Enum>(
        enumList,
        enum_ => enum_.name === expr.typeName
      );

      if (enum_ === undefined) {
        throw new Error(
          "外部に公開していない列挙型のパターンを使おうとしている typeName=" +
            expr.typeName +
            " 公開している列挙型" +
            [...enumList.entries()].map(([name]) => name).join(",")
        );
      }
      const tagNameAndValue = util.getFirstElementByCondition<
        type.TagNameAndValue
      >(
        enum_.tagNameAndValueList,
        tagNameAndValue => tagNameAndValue.name === expr.tagName
      );
      if (tagNameAndValue === undefined) {
        throw new Error(
          "存在しないパターンを指定した typeName=" +
            expr.typeName +
            " allPattern=[" +
            [...enum_.tagNameAndValueList.keys()].join(",") +
            "] patternName=" +
            expr.tagName
        );
      }

      return {
        _: namedExpr.Expr_.ConstEnumPattern,
        tagName: expr.tagName,
        typeName: expr.typeName,
        value: tagNameAndValue.value
      };
    }

    case Expr_.BuiltIn:
      return {
        _: namedExpr.Expr_.BuiltIn,
        builtIn: expr.builtIn
      };
  }
};

const searchName = (
  localVariableNameMapList: ReadonlyArray<ReadonlyMap<string, string>>,
  oldName: ReadonlyArray<string>
): string => {
  for (let i = 0; i < localVariableNameMapList.length; i++) {
    const variable = localVariableNameMapList[
      localVariableNameMapList.length - 1 - i
    ].get(variableNameListToMapKey(oldName));
    if (variable !== undefined) {
      return variable;
    }
  }
  throw new Error(
    "存在しない変数を指定されました name=" + variableNameListToMapKey(oldName)
  );
};

export const toNamedStatementList = (
  statementList: ReadonlyArray<Statement>,
  globalNameAndImportPathAndIdentifer: type.GlobalNameAndImportPathAndIdentifer,
  identiferIndex: identifer.IdentiferIndex,
  localVariableNameMapList: ReadonlyArray<ReadonlyMap<string, string>>,
  argumentNameMap: ReadonlyMap<string, string>,
  exposedConstEnumMap: ReadonlyArray<type.Enum>
): ReadonlyArray<namedExpr.Statement> => {
  const variableNameInScopeList: Map<string, string> = new Map();

  // スコープ内にある変数定義を見て、変数名を決める
  for (const statement of statementList) {
    switch (statement._) {
      case Statement_.VariableDefinition:
      case Statement_.ReturnVoidFunctionVariableDefinition:
      case Statement_.FunctionWithReturnValueVariableDefinition: {
        const identiferAndIndex = identifer.createIdentifer(
          identiferIndex,
          globalNameAndImportPathAndIdentifer.globalNameSet
        );
        variableNameInScopeList.set(
          variableNameListToMapKey(statement.name),
          identiferAndIndex.identifer
        );
        identiferIndex = identiferAndIndex.nextIdentiferIndex;
      }
    }
  }
  const newArgumentVariableNameMapList: ReadonlyArray<ReadonlyMap<
    string,
    string
  >> = [
    ...localVariableNameMapList,
    new Map([...argumentNameMap, ...variableNameInScopeList])
  ];
  const namedStatementList: Array<namedExpr.Statement> = [];
  let variableDefinitionIndex = 0;
  for (const statement of statementList) {
    const statementAndIndex = toNamedStatement(
      statement,
      globalNameAndImportPathAndIdentifer,
      identiferIndex,
      newArgumentVariableNameMapList,
      variableDefinitionIndex,
      exposedConstEnumMap
    );
    namedStatementList.push(statementAndIndex.statement);
    variableDefinitionIndex = statementAndIndex.index;
  }
  return namedStatementList;
};

export const toNamedStatement = (
  statement: Statement,
  globalNameAndImportPathAndIdentifer: type.GlobalNameAndImportPathAndIdentifer,
  identiferIndex: identifer.IdentiferIndex,
  variableNameMapList: ReadonlyArray<ReadonlyMap<string, string>>,
  variableDefinitionIndex: number,
  enumList: ReadonlyArray<type.Enum>
): { statement: namedExpr.Statement; index: number } => {
  switch (statement._) {
    case Statement_.EvaluateExpr:
      return {
        statement: {
          _: namedExpr.Statement_.EvaluateExpr,
          expr: toNamedExpr(
            statement.expr,
            globalNameAndImportPathAndIdentifer,
            identiferIndex,
            variableNameMapList,
            enumList
          )
        },
        index: variableDefinitionIndex
      };
    case Statement_.Set:
      return {
        statement: {
          _: namedExpr.Statement_.Set,
          targetObject: toNamedExpr(
            statement.targetObject,
            globalNameAndImportPathAndIdentifer,
            identiferIndex,
            variableNameMapList,
            enumList
          ),
          operator: statement.operator,
          expr: toNamedExpr(
            statement.expr,
            globalNameAndImportPathAndIdentifer,
            identiferIndex,
            variableNameMapList,
            enumList
          )
        },
        index: variableDefinitionIndex
      };

    case Statement_.If:
      return {
        statement: {
          _: namedExpr.Statement_.If,
          condition: toNamedExpr(
            statement.condition,
            globalNameAndImportPathAndIdentifer,
            identiferIndex,
            variableNameMapList,
            enumList
          ),
          thenStatementList: toNamedStatementList(
            statement.thenStatementList,
            globalNameAndImportPathAndIdentifer,
            identiferIndex,
            variableNameMapList,
            new Map(),
            enumList
          )
        },
        index: variableDefinitionIndex
      };
    case Statement_.ThrowError:
      return {
        statement: {
          _: namedExpr.Statement_.ThrowError,
          errorMessage: toNamedExpr(
            statement.errorMessage,
            globalNameAndImportPathAndIdentifer,
            identiferIndex,
            variableNameMapList,
            enumList
          )
        },
        index: variableDefinitionIndex
      };

    case Statement_.Return:
      return {
        statement: {
          _: namedExpr.Statement_.Return,
          expr: toNamedExpr(
            statement.expr,
            globalNameAndImportPathAndIdentifer,
            identiferIndex,
            variableNameMapList,
            enumList
          )
        },
        index: variableDefinitionIndex
      };
    case Statement_.ReturnVoid:
      return {
        statement: {
          _: namedExpr.Statement_.ReturnVoid
        },
        index: variableDefinitionIndex
      };

    case Statement_.Continue:
      return {
        statement: {
          _: namedExpr.Statement_.Continue
        },
        index: variableDefinitionIndex
      };

    case Statement_.VariableDefinition:
      return {
        statement: {
          _: namedExpr.Statement_.VariableDefinition,
          expr: toNamedExpr(
            statement.expr,
            globalNameAndImportPathAndIdentifer,
            identiferIndex,
            variableNameMapList,
            enumList
          ),
          name: searchName(variableNameMapList, statement.name),
          typeExpr: typeExpr.toNamed(
            statement.typeExpr,
            globalNameAndImportPathAndIdentifer
          ),
          isConst: statement.isConst
        },
        index: variableDefinitionIndex + 1
      };
    case Statement_.FunctionWithReturnValueVariableDefinition: {
      const namedParameterList: Array<{
        oldName: string;
        name: string;
        typeExpr: namedTypeExpr.TypeExpr;
      }> = [];
      for (const parameter of statement.parameterList) {
        const identiferAndIndex = identifer.createIdentifer(
          identiferIndex,
          globalNameAndImportPathAndIdentifer.globalNameSet
        );
        namedParameterList.push({
          oldName: variableNameListToMapKey(parameter.name),
          name: identiferAndIndex.identifer,
          typeExpr: typeExpr.toNamed(
            parameter.typeExpr,
            globalNameAndImportPathAndIdentifer
          )
        });
        identiferIndex = identiferAndIndex.nextIdentiferIndex;
      }
      return {
        statement: {
          _: namedExpr.Statement_.FunctionWithReturnValueVariableDefinition,
          name: searchName(variableNameMapList, statement.name),
          parameterList: namedParameterList,
          returnType: typeExpr.toNamed(
            statement.returnType,
            globalNameAndImportPathAndIdentifer
          ),
          statementList: toNamedStatementList(
            statement.statementList,
            globalNameAndImportPathAndIdentifer,
            identiferIndex,
            variableNameMapList,
            new Map(
              namedParameterList.map(parameter => [
                parameter.oldName,
                parameter.name
              ])
            ),
            enumList
          )
        },
        index: variableDefinitionIndex + 1
      };
    }
    case Statement_.ReturnVoidFunctionVariableDefinition: {
      const namedParameterList: Array<{
        oldName: string;
        name: string;
        typeExpr: namedTypeExpr.TypeExpr;
      }> = [];
      for (const parameter of statement.parameterList) {
        const identiferAndIndex = identifer.createIdentifer(
          identiferIndex,
          globalNameAndImportPathAndIdentifer.globalNameSet
        );
        namedParameterList.push({
          oldName: variableNameListToMapKey(parameter.name),
          name: identiferAndIndex.identifer,
          typeExpr: typeExpr.toNamed(
            parameter.typeExpr,
            globalNameAndImportPathAndIdentifer
          )
        });
        identiferIndex = identiferAndIndex.nextIdentiferIndex;
      }
      return {
        statement: {
          _: namedExpr.Statement_.ReturnVoidFunctionVariableDefinition,
          name: searchName(variableNameMapList, statement.name),
          parameterList: namedParameterList,
          statementList: toNamedStatementList(
            statement.statementList,
            globalNameAndImportPathAndIdentifer,
            identiferIndex,
            variableNameMapList,
            new Map(
              namedParameterList.map(parameter => [
                parameter.oldName,
                parameter.name
              ])
            ),
            enumList
          )
        },
        index: variableDefinitionIndex + 1
      };
    }
    case Statement_.For: {
      const counterVariableNameAndIndex = identifer.createIdentifer(
        identiferIndex,
        globalNameAndImportPathAndIdentifer.globalNameSet
      );
      return {
        statement: {
          _: namedExpr.Statement_.For,
          counterVariableName: counterVariableNameAndIndex.identifer,
          statementList: toNamedStatementList(
            statement.statementList,
            globalNameAndImportPathAndIdentifer,
            counterVariableNameAndIndex.nextIdentiferIndex,
            variableNameMapList,
            new Map([
              [
                variableNameListToMapKey(statement.counterVariableName),
                counterVariableNameAndIndex.identifer
              ]
            ]),
            enumList
          ),
          untilExpr: toNamedExpr(
            statement.untilExpr,
            globalNameAndImportPathAndIdentifer,
            identiferIndex,
            variableNameMapList,
            enumList
          )
        },
        index: variableDefinitionIndex
      };
    }
    case Statement_.ForOf: {
      const elementVariableNameAndIndex = identifer.createIdentifer(
        identiferIndex,
        globalNameAndImportPathAndIdentifer.globalNameSet
      );
      return {
        statement: {
          _: namedExpr.Statement_.ForOf,
          elementVariableName: elementVariableNameAndIndex.identifer,
          statementList: toNamedStatementList(
            statement.statementList,
            globalNameAndImportPathAndIdentifer,
            elementVariableNameAndIndex.nextIdentiferIndex,
            variableNameMapList,
            new Map([
              [
                variableNameListToMapKey(statement.elementVariableName),
                elementVariableNameAndIndex.identifer
              ]
            ]),
            enumList
          ),
          iterableExpr: toNamedExpr(
            statement.iterableExpr,
            globalNameAndImportPathAndIdentifer,
            identiferIndex,
            variableNameMapList,
            enumList
          )
        },
        index: variableDefinitionIndex
      };
    }
    case Statement_.WhileTrue:
      return {
        statement: {
          _: namedExpr.Statement_.WhileTrue,
          statementList: toNamedStatementList(
            statement.statementList,
            globalNameAndImportPathAndIdentifer,
            identiferIndex,
            variableNameMapList,
            new Map(),
            enumList
          )
        },
        index: variableDefinitionIndex
      };
    case Statement_.Break:
      return {
        statement: {
          _: namedExpr.Statement_.Break
        },
        index: variableDefinitionIndex
      };
  }
};

/**
 * JSのMapのキーに配列を使った場合、参照でしか等しいか計算しないため、文字列に変換している
 */
const variableNameListToMapKey = (nameList: ReadonlyArray<string>): string =>
  nameList.join("!");
