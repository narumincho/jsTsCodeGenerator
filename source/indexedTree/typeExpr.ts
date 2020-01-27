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
      parameter: ReadonlyArray<TypeExpr>;
      return: TypeExpr;
    }
  | {
      _: TypeExpr_.FunctionReturnVoid;
      parameter: ReadonlyArray<TypeExpr>;
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
  parameter: parameter,
  return: returnType
});

/**
 * 戻り値がない関数
 */
export const functionReturnVoid = (
  parameter: ReadonlyArray<TypeExpr>
): TypeExpr => ({
  _: TypeExpr_.FunctionReturnVoid,
  parameter: parameter
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
  scanData: scanType.NodeJsCodeScanData
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
      for (const oneParameter of typeExpr.parameter) {
        scanGlobalVariableNameAndImportedPath(oneParameter, scanData);
      }
      scanGlobalVariableNameAndImportedPath(typeExpr.return, scanData);
      return;

    case TypeExpr_.FunctionReturnVoid:
      for (const oneParameter of typeExpr.parameter) {
        scanGlobalVariableNameAndImportedPath(oneParameter, scanData);
      }
      return;

    case TypeExpr_.Union:
      for (const oneType of typeExpr.types) {
        scanGlobalVariableNameAndImportedPath(oneType, scanData);
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
              typeExpr: toNamed(member.typeExpr, reservedWord),
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
      for (const parameterType of typeExpr.parameter) {
        const identiferAndNextIndex = identifer.createIdentifer(
          identiferIndex,
          reservedWord
        );
        identiferIndex = identiferAndNextIndex.nextIdentiferIndex;
        parameterList.push({
          name: identiferAndNextIndex.identifer,
          typeExpr: toNamed(parameterType, reservedWord)
        });
      }
      return {
        _: named.TypeExpr_.FunctionWithReturn,
        parameter: parameterList,
        return: toNamed(typeExpr.return, reservedWord)
      };
    }

    case TypeExpr_.FunctionReturnVoid: {
      const parameterList: Array<{
        name: string;
        typeExpr: named.TypeExpr;
      }> = [];
      let identiferIndex = identifer.initialIdentiferIndex;
      for (const parameterType of typeExpr.parameter) {
        const identiferAndNextIndex = identifer.createIdentifer(
          identiferIndex,
          reservedWord
        );
        identiferIndex = identiferAndNextIndex.nextIdentiferIndex;
        parameterList.push({
          name: identiferAndNextIndex.identifer,
          typeExpr: toNamed(parameterType, reservedWord)
        });
      }
      return {
        _: named.TypeExpr_.FunctionReturnVoid,
        parameter: parameterList
      };
    }

    case TypeExpr_.Union:
      return {
        _: named.TypeExpr_.Union,
        types: typeExpr.types.map(t => toNamed(t, reservedWord))
      };

    case TypeExpr_.ImportedType:
      return {
        _: named.TypeExpr_.ImportedType,
        name: typeExpr.name,
        nameSpaceIdentifer:
          "コードの文字列化にインポートの識別子をどうにかしたい"
      };
      scanData.importedModulePath.add(typeExpr.path);
      return;

    case TypeExpr_.GlobalType:
      scanData.globalName.add(typeExpr.name);
      return;
  }
};
