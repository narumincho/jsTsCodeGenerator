import * as scanType from "./scanType";
/* ======================================================================================
 *                                      Type Expr
 * ====================================================================================== */

/**
 * 型を表現する式
 */
export type TypeExpr =
  | { _: TypeExprType.Number }
  | { _: TypeExprType.String }
  | { _: TypeExprType.Boolean }
  | { _: TypeExprType.Undefined }
  | { _: TypeExprType.Null }
  | {
      _: TypeExprType.Object;
      memberList: Map<string, { typeExpr: TypeExpr; document: string }>;
    }
  | {
      _: TypeExprType.FunctionWithReturn;
      parameter: ReadonlyArray<OneParameter>;
      return: TypeExpr;
    }
  | {
      _: TypeExprType.FunctionReturnVoid;
      parameter: ReadonlyArray<OneParameter>;
    }
  | {
      _: TypeExprType.Union;
      types: ReadonlyArray<TypeExpr>;
    }
  | {
      _: TypeExprType.ImportedType;
      path: string;
      name: string;
    }
  | { _: TypeExprType.GlobalType; name: string };

export const enum TypeExprType {
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
  _: TypeExprType.Number
};

/**
 * プリミティブの型のstring
 */
export const typeString: TypeExpr = {
  _: TypeExprType.String
};

/**
 * プリミティブの型のboolean
 */
export const typeBoolean: TypeExpr = {
  _: TypeExprType.Boolean
};

/**
 * プリミティブの型のundefined
 */
export const typeUndefined: TypeExpr = {
  _: TypeExprType.Undefined
};

/**
 * プリミティブの型のnull
 */
export const typeNull: TypeExpr = {
  _: TypeExprType.Null
};

/**
 * オブジェクト
 */
export const object = (
  memberList: Map<string, { typeExpr: TypeExpr; document: string }>
): TypeExpr => ({
  _: TypeExprType.Object,
  memberList: memberList
});

/**
 * 戻り値がある関数
 */
export const functionWithReturn = (
  parameter: ReadonlyArray<OneParameter>,
  returnType: TypeExpr
): TypeExpr => ({
  _: TypeExprType.FunctionWithReturn,
  parameter: parameter,
  return: returnType
});

/**
 * 戻り値がない関数
 */
export const functionReturnVoid = (
  parameter: ReadonlyArray<OneParameter>
): TypeExpr => ({
  _: TypeExprType.FunctionReturnVoid,
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
  _: TypeExprType.ImportedType,
  path,
  name
});

/**
 * グローバル空間の型
 * @param name 型名
 */
export const globalType = (name: string): TypeExpr => ({
  _: TypeExprType.GlobalType,
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
    case TypeExprType.Number:
    case TypeExprType.String:
    case TypeExprType.Boolean:
    case TypeExprType.Null:
    case TypeExprType.Undefined:
      return;

    case TypeExprType.Object:
      for (const [, value] of typeExpr.memberList) {
        scan(value.typeExpr, scanData);
      }
      return;

    case TypeExprType.FunctionWithReturn:
      for (const oneParameter of typeExpr.parameter) {
        scan(oneParameter.typeExpr, scanData);
      }
      scan(typeExpr.return, scanData);
      return;

    case TypeExprType.FunctionReturnVoid:
      for (const oneParameter of typeExpr.parameter) {
        scan(oneParameter.typeExpr, scanData);
      }
      return;

    case TypeExprType.Union:
      for (const oneType of typeExpr.types) {
        scan(oneType, scanData);
      }
      return;

    case TypeExprType.ImportedType:
      scanData.importedModulePath.add(typeExpr.path);
      return;

    case TypeExprType.GlobalType:
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
    case TypeExprType.Number:
      return "number";

    case TypeExprType.String:
      return "string";

    case TypeExprType.Boolean:
      return "boolean";

    case TypeExprType.Null:
      return "null";

    case TypeExprType.Undefined:
      return "undefined";

    case TypeExprType.Object:
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

    case TypeExprType.FunctionWithReturn:
      return parameterAndReturnToString(
        typeExpr.parameter,
        typeExpr.return,
        importedModuleNameMap
      );

    case TypeExprType.FunctionReturnVoid:
      return parameterAndReturnToString(
        typeExpr.parameter,
        null,
        importedModuleNameMap
      );

    case TypeExprType.Union:
      return typeExpr.types
        .map(typeExpr => typeExprToString(typeExpr, importedModuleNameMap))
        .join("|");

    case TypeExprType.GlobalType:
      return typeExpr.name;

    case TypeExprType.ImportedType: {
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
