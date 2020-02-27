import * as type from "../type";
import * as named from "../namedTree/typeExpr";
import * as identifer from "../identifer";
import { ValueOf } from "../valueOf";
import * as builtIn from "../builtIn";

/**
 * 型を表現する式
 */
export type TypeExpr =
  | { _: TypeExpr_.Number }
  | { _: TypeExpr_.String }
  | { _: TypeExpr_.Boolean }
  | { _: TypeExpr_.Undefined }
  | { _: TypeExpr_.Null }
  | { _: TypeExpr_.Never }
  | { _: TypeExpr_.Void }
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
      _: TypeExpr_.EnumTagLiteral;
      typeName: string;
      tagName: string;
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
  | { _: TypeExpr_.GlobalType; name: string }
  | { _: TypeExpr_.BuiltIn; builtIn: builtIn.Type };

const enum TypeExpr_ {
  Number,
  String,
  Boolean,
  Undefined,
  Null,
  Never,
  Void,
  Object,
  FunctionWithReturn,
  FunctionReturnVoid,
  EnumTagLiteral,
  Union,
  WithTypeParameter,
  ImportedType,
  GlobalType,
  BuiltIn
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
 * never型
 */
export const typeNever: TypeExpr = {
  _: TypeExpr_.Never
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
 * Enumのリテラル型 `Color.Red`
 * @param typeName 型の名前 `Color`
 * @param tagName タグの名前 `Red`
 */
export const enumTagLiteral = (
  typeName: string,
  tagName: string
): TypeExpr => ({
  _: TypeExpr_.EnumTagLiteral,
  typeName,
  tagName: tagName
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
 * 外部のモジュールの型
 * ```ts
 * importedTypeList("express", ["Request", "Response"] as const).Response
 * ```
 *
 * @param path モジュール名かパス
 * @param typeList 型の名前の一覧
 */
export const importedTypeList = <typeList extends ReadonlyArray<string>>(
  path: string,
  typeList: typeList
): { [name in ValueOf<typeList> & string]: TypeExpr } => {
  const typeListObject = {} as {
    [name in ValueOf<typeList> & string]: TypeExpr;
  };
  for (const typeName of typeList) {
    typeListObject[typeName as ValueOf<typeList> & string] = importedType(
      path,
      typeName
    );
  }
  return typeListObject;
};

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
 * グローバル空間にある型
 * ```ts
 * globalVariableList(["Uint8Array", "URL"] as const).Uint8Array
 * ```
 * @param nameList 型の名前の一覧
 */
export const globalTypeList = <nameList extends ReadonlyArray<string>>(
  nameList: nameList
): { [name in ValueOf<nameList> & string]: TypeExpr } => {
  const typeListObject = {} as {
    [name in ValueOf<nameList> & string]: TypeExpr;
  };
  for (const variableName of nameList) {
    typeListObject[variableName as ValueOf<nameList> & string] = globalType(
      variableName
    );
  }
  return typeListObject;
};

/**
 * グローバル空間の型
 * @param name 型名
 */
export const globalType = (name: string): TypeExpr => ({
  _: TypeExpr_.GlobalType,
  name
});

/**
 * 標準に入っている型
 */
const builtInType = (builtIn: builtIn.Type): TypeExpr => ({
  _: TypeExpr_.BuiltIn,
  builtIn
});
/* =======================================================
                      util
   =======================================================
*/

/**
 * `Array<elementType>`
 */
export const arrayType = (elementType: TypeExpr): TypeExpr =>
  withTypeParameter(builtInType(builtIn.Type.Array), [elementType]);

/**
 * `ReadonlyArray<elementType>`
 */
export const readonlyArrayType = (elementType: TypeExpr): TypeExpr =>
  withTypeParameter(builtInType(builtIn.Type.ReadonlyArray), [elementType]);

/**
 * `Uint8Array`
 */
export const uint8ArrayType: TypeExpr = builtInType(builtIn.Type.Uint8Array);

/**
 * `Promise<returnType>`
 */
export const promiseType = (returnType: TypeExpr): TypeExpr =>
  withTypeParameter(builtInType(builtIn.Type.Promise), [returnType]);

/**
 * `Date`
 */
export const dateType: TypeExpr = builtInType(builtIn.Type.Date);

/**
 * `Map<keyType, valueType>`
 */
export const mapType = (keyType: TypeExpr, valueType: TypeExpr): TypeExpr =>
  withTypeParameter(builtInType(builtIn.Type.Map), [keyType, valueType]);

/**
 * `ReadonlyMap<keyType, valueType>`
 */
export const readonlyMapType = (
  keyType: TypeExpr,
  valueType: TypeExpr
): TypeExpr =>
  withTypeParameter(builtInType(builtIn.Type.ReadonlyMap), [
    keyType,
    valueType
  ]);

/**
 * `Set<elementType>`
 */
export const setType = (elementType: TypeExpr): TypeExpr =>
  withTypeParameter(builtInType(builtIn.Type.Set), [elementType]);

/**
 * `ReadonlySet<elementType>`
 */
export const readonlySetType = (elementType: TypeExpr): TypeExpr =>
  withTypeParameter(builtInType(builtIn.Type.ReadonlySet), [elementType]);

/**
 * グローバル空間(グローバル変数、直下の関数の引数名)に出ている型の名前を集める
 * @param typeExpr 型の式
 * @param scanData グローバルで使われている名前の集合などのコード全体の情報の収集データ。上書きする
 */
export const scanGlobalVariableNameAndImportedPath = (
  typeExpr: TypeExpr,
  scanData: type.ScanData
): void => {
  switch (typeExpr._) {
    case TypeExpr_.Number:
    case TypeExpr_.String:
    case TypeExpr_.Boolean:
    case TypeExpr_.Null:
    case TypeExpr_.Undefined:
    case TypeExpr_.EnumTagLiteral:
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

    case TypeExpr_.Never:
      return {
        _: named.TypeExpr_.Never
      };
    case TypeExpr_.Void:
      return {
        _: named.TypeExpr_.Void
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
    case TypeExpr_.EnumTagLiteral:
      return {
        _: named.TypeExpr_.EnumTagLiteral,
        typeName: typeExpr.typeName,
        tagName: typeExpr.tagName
      };

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

    case TypeExpr_.BuiltIn:
      return {
        _: named.TypeExpr_.BuiltIn,
        builtIn: typeExpr.builtIn
      };
  }
};
