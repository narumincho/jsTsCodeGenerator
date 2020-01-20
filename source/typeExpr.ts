import * as scanType from "./scanType";
/* ======================================================================================
 *                                      Type Expr
 * ====================================================================================== */

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
      parameter: ReadonlyArray<OneParameter>;
      return: TypeExpr;
    }
  | {
      _: TypeExpr_.FunctionReturnVoid;
      parameter: ReadonlyArray<OneParameter>;
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

export const enum TypeExpr_ {
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
  parameter: ReadonlyArray<OneParameter>,
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
  parameter: ReadonlyArray<OneParameter>
): TypeExpr => ({
  _: TypeExpr_.FunctionReturnVoid,
  parameter: parameter
});

/**
 * 関数のパラメーター
 */
export type OneParameter = {
  name: string;
  document: string;
  typeExpr: TypeExpr;
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
 * グローバル空間の型
 * @param name 型名
 */
export const globalType = (name: string): TypeExpr => ({
  _: TypeExpr_.GlobalType,
  name
});

/** 関数の引数と戻り値の型を文字列にする */
const parameterAndReturnToString = (
  parameterList: ReadonlyArray<OneParameter>,
  returnType: TypeExpr | null,
  importedModuleNameMap: Map<string, string>
): string =>
  "(" +
  parameterList
    .map(
      parameter =>
        parameter.name +
        ": " +
        typeExprToString(parameter.typeExpr, importedModuleNameMap)
    )
    .join(", ") +
  ")=>" +
  (returnType === null
    ? "void"
    : typeExprToString(returnType, importedModuleNameMap));

/**
 * グローバル空間に出ている型の名前を集める
 * @param typeExpr 型の式
 * @param scanData グローバルで使われている名前の集合などのコード全体の情報の収集データ。上書きする
 */
export const scan = (
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
        scan(value.typeExpr, scanData);
      }
      return;

    case TypeExpr_.FunctionWithReturn:
      for (const oneParameter of typeExpr.parameter) {
        scan(oneParameter.typeExpr, scanData);
      }
      scan(typeExpr.return, scanData);
      return;

    case TypeExpr_.FunctionReturnVoid:
      for (const oneParameter of typeExpr.parameter) {
        scan(oneParameter.typeExpr, scanData);
      }
      return;

    case TypeExpr_.Union:
      for (const oneType of typeExpr.types) {
        scan(oneType, scanData);
      }
      return;

    case TypeExpr_.ImportedType:
      scanData.importedModulePath.add(typeExpr.path);
      return;

    case TypeExpr_.GlobalType:
      scanData.globalName.add(typeExpr.name);
      return;
  }
};

/**
 * 型の式をコードに変換する
 * @param typeExpr 型の式
 * @param importedModuleNameMap インポートされたモジュールのパスと名前空間識別子のマップ
 */
export const typeExprToString = (
  typeExpr: TypeExpr,
  importedModuleNameMap: Map<string, string>
): string => {
  switch (typeExpr._) {
    case TypeExpr_.Number:
      return "number";

    case TypeExpr_.String:
      return "string";

    case TypeExpr_.Boolean:
      return "boolean";

    case TypeExpr_.Null:
      return "null";

    case TypeExpr_.Undefined:
      return "undefined";

    case TypeExpr_.Object:
      return (
        "{" +
        [...typeExpr.memberList.entries()]
          .map(
            ([name, typeAndDocument]) =>
              name +
              ": " +
              typeExprToString(typeAndDocument.typeExpr, importedModuleNameMap)
          )
          .join(", ") +
        "}"
      );

    case TypeExpr_.FunctionWithReturn:
      return parameterAndReturnToString(
        typeExpr.parameter,
        typeExpr.return,
        importedModuleNameMap
      );

    case TypeExpr_.FunctionReturnVoid:
      return parameterAndReturnToString(
        typeExpr.parameter,
        null,
        importedModuleNameMap
      );

    case TypeExpr_.Union:
      return typeExpr.types
        .map(typeExpr => typeExprToString(typeExpr, importedModuleNameMap))
        .join("|");

    case TypeExpr_.GlobalType:
      return typeExpr.name;

    case TypeExpr_.ImportedType: {
      const importedModuleName = importedModuleNameMap.get(typeExpr.path);
      if (importedModuleName === undefined) {
        throw new Error(
          "収集されなかったモジュールがある! path=" + typeExpr.path
        );
      }
      return importedModuleName + "." + typeExpr.name;
    }
  }
};
