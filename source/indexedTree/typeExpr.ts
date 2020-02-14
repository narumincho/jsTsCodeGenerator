import * as scanType from "../scanType";
import * as named from "../namedTree/typeExpr";
import * as identifer from "../identifer";

/**
 * 型を表現する式
 */
export type TypeExpr =
  | { _: TypeExpr_.Number }
  | { _: TypeExpr_.String }
  | { _: TypeExpr_.Boolean }
  | { _: TypeExpr_.Undefined }
  | { _: TypeExpr_.Null }
  | {
      _: TypeExpr_.Object;
      memberList: Map<string, { typeExpr: TypeExpr; document: string }>;
    }
  | {
      _: TypeExpr_.FunctionWithReturn;
      parameterList: ReadonlyArray<TypeExpr>;
      return: TypeExpr;
    }
  | {
      _: TypeExpr_.FunctionReturnVoid;
      parameterList: ReadonlyArray<TypeExpr>;
    }
  | {
      _: TypeExpr_.WithTypeParameter;
      typeExpr: TypeExpr;
      typeParameterList: ReadonlyArray<TypeExpr>;
    }
  | {
      _: TypeExpr_.Union;
      types: ReadonlyArray<TypeExpr>;
    }
  | {
      _: TypeExpr_.ImportedType;
      path: string;
      name: string;
    }
  | { _: TypeExpr_.GlobalType; name: string };

const enum TypeExpr_ {
  Number,
  String,
  Boolean,
  Undefined,
  Null,
  Object,
  FunctionWithReturn,
  FunctionReturnVoid,
  Union,
  WithTypeParameter,
  ImportedType,
  GlobalType
}

/**
 * プリミティブの型のnumber
 */
export const typeNumber: TypeExpr = {
  _: TypeExpr_.Number
};

/**
 * プリミティブの型のstring
 */
export const typeString: TypeExpr = {
  _: TypeExpr_.String
};

/**
 * プリミティブの型のboolean
 */
export const typeBoolean: TypeExpr = {
  _: TypeExpr_.Boolean
};

/**
 * プリミティブの型のundefined
 */
export const typeUndefined: TypeExpr = {
  _: TypeExpr_.Undefined
};

/**
 * プリミティブの型のnull
 */
export const typeNull: TypeExpr = {
  _: TypeExpr_.Null
};

/**
 * オブジェクト
 */
export const object = (
  memberList: Map<string, { typeExpr: TypeExpr; document: string }>
): TypeExpr => ({
  _: TypeExpr_.Object,
  memberList: memberList
});

/**
 * 戻り値がある関数
 */
export const functionWithReturn = (
  parameter: ReadonlyArray<TypeExpr>,
  returnType: TypeExpr
): TypeExpr => ({
  _: TypeExpr_.FunctionWithReturn,
  parameterList: parameter,
  return: returnType
});

/**
 * 戻り値がない関数
 */
export const functionReturnVoid = (
  parameter: ReadonlyArray<TypeExpr>
): TypeExpr => ({
  _: TypeExpr_.FunctionReturnVoid,
  parameterList: parameter
});

/**
 * ユニオン型 `a | b`
 * @param types 型のリスト
 */
export const union = (types: ReadonlyArray<TypeExpr>): TypeExpr => ({
  _: TypeExpr_.Union,
  types
});

/**
 * 型パラメータ付きの型 `Promise<number>` `ReadonlyArray<string>`
 */
export const withTypeParameter = (
  typeExpr: TypeExpr,
  typeParameterList: ReadonlyArray<TypeExpr>
): TypeExpr => ({
  _: TypeExpr_.WithTypeParameter,
  typeExpr,
  typeParameterList
});

/**
 * インポートされた外部の型
 * @param path インポートするモジュールのパス
 * @param name 型名
 */
export const importedType = (path: string, name: string): TypeExpr => ({
  _: TypeExpr_.ImportedType,
  path,
  name
});

/**
 * グローバル空間の型
 * @param name 型名
 */
export const globalType = (name: string): TypeExpr => ({
  _: TypeExpr_.GlobalType,
  name
});

/**
 * グローバル空間(グローバル変数、直下の関数の引数名)に出ている型の名前を集める
 * @param typeExpr 型の式
 * @param scanData グローバルで使われている名前の集合などのコード全体の情報の収集データ。上書きする
 */
export const scanGlobalVariableNameAndImportedPath = (
  typeExpr: TypeExpr,
  scanData: scanType.ScanData
): void => {
  switch (typeExpr._) {
    case TypeExpr_.Number:
    case TypeExpr_.String:
    case TypeExpr_.Boolean:
    case TypeExpr_.Null:
    case TypeExpr_.Undefined:
      return;

    case TypeExpr_.Object:
      for (const [, value] of typeExpr.memberList) {
        scanGlobalVariableNameAndImportedPath(value.typeExpr, scanData);
      }
      return;

    case TypeExpr_.FunctionWithReturn:
      for (const parameter of typeExpr.parameterList) {
        scanGlobalVariableNameAndImportedPath(parameter, scanData);
      }
      scanGlobalVariableNameAndImportedPath(typeExpr.return, scanData);
      return;

    case TypeExpr_.FunctionReturnVoid:
      for (const parameter of typeExpr.parameterList) {
        scanGlobalVariableNameAndImportedPath(parameter, scanData);
      }
      return;

    case TypeExpr_.Union:
      for (const oneType of typeExpr.types) {
        scanGlobalVariableNameAndImportedPath(oneType, scanData);
      }
      return;

    case TypeExpr_.WithTypeParameter:
      scanGlobalVariableNameAndImportedPath(typeExpr.typeExpr, scanData);
      for (const parameter of typeExpr.typeParameterList) {
        scanGlobalVariableNameAndImportedPath(parameter, scanData);
      }
      return;

    case TypeExpr_.ImportedType:
      scanData.importedModulePath.add(typeExpr.path);
      return;

    case TypeExpr_.GlobalType:
      scanData.globalNameSet.add(typeExpr.name);
      return;
  }
};

export const toNamed = (
  typeExpr: TypeExpr,
  reservedWord: ReadonlySet<string>,
  importModuleMap: ReadonlyMap<string, string>
): named.TypeExpr => {
  switch (typeExpr._) {
    case TypeExpr_.Number:
      return {
        _: named.TypeExpr_.Number
      };
    case TypeExpr_.String:
      return {
        _: named.TypeExpr_.String
      };
    case TypeExpr_.Boolean:
      return {
        _: named.TypeExpr_.Boolean
      };
    case TypeExpr_.Null:
      return {
        _: named.TypeExpr_.Number
      };
    case TypeExpr_.Undefined:
      return {
        _: named.TypeExpr_.Undefined
      };

    case TypeExpr_.Object:
      return {
        _: named.TypeExpr_.Object,
        memberList: new Map(
          [...typeExpr.memberList].map(([memberName, member]) => [
            memberName,
            {
              typeExpr: toNamed(member.typeExpr, reservedWord, importModuleMap),
              document: member.document
            }
          ])
        )
      };

    case TypeExpr_.FunctionWithReturn: {
      const parameterList: Array<{
        name: string;
        typeExpr: named.TypeExpr;
      }> = [];
      let identiferIndex = identifer.initialIdentiferIndex;
      for (const parameterType of typeExpr.parameterList) {
        const identiferAndNextIndex = identifer.createIdentifer(
          identiferIndex,
          reservedWord
        );
        identiferIndex = identiferAndNextIndex.nextIdentiferIndex;
        parameterList.push({
          name: identiferAndNextIndex.identifer,
          typeExpr: toNamed(parameterType, reservedWord, importModuleMap)
        });
      }
      return {
        _: named.TypeExpr_.FunctionWithReturn,
        parameterList: parameterList,
        return: toNamed(typeExpr.return, reservedWord, importModuleMap)
      };
    }

    case TypeExpr_.FunctionReturnVoid: {
      const parameterList: Array<{
        name: string;
        typeExpr: named.TypeExpr;
      }> = [];
      let identiferIndex = identifer.initialIdentiferIndex;
      for (const parameterType of typeExpr.parameterList) {
        const identiferAndNextIndex = identifer.createIdentifer(
          identiferIndex,
          reservedWord
        );
        identiferIndex = identiferAndNextIndex.nextIdentiferIndex;
        parameterList.push({
          name: identiferAndNextIndex.identifer,
          typeExpr: toNamed(parameterType, reservedWord, importModuleMap)
        });
      }
      return {
        _: named.TypeExpr_.FunctionReturnVoid,
        parameterList: parameterList
      };
    }

    case TypeExpr_.Union:
      return {
        _: named.TypeExpr_.Union,
        types: typeExpr.types.map(t =>
          toNamed(t, reservedWord, importModuleMap)
        )
      };
    case TypeExpr_.WithTypeParameter:
      return {
        _: named.TypeExpr_.WithTypeParameter,
        typeExpr: toNamed(typeExpr.typeExpr, reservedWord, importModuleMap),
        typeParameterList: typeExpr.typeParameterList.map(t =>
          toNamed(t, reservedWord, importModuleMap)
        )
      };

    case TypeExpr_.ImportedType: {
      const nameSpaceIdentifer = importModuleMap.get(typeExpr.path);
      if (nameSpaceIdentifer === undefined) {
        throw new Error(
          `認識されていない外部モジュールの名前空間識別子を発見した in typeExpr (${typeExpr.path})`
        );
      }
      return {
        _: named.TypeExpr_.ImportedType,
        name: typeExpr.name,
        nameSpaceIdentifer
      };
    }

    case TypeExpr_.GlobalType:
      return {
        _: named.TypeExpr_.GlobalType,
        name: typeExpr.name
      };
  }
};
