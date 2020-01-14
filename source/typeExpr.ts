/* ======================================================================================
 *                                      Type Expr
 * ====================================================================================== */

/**
 * 型を表現する式
 */
export type TypeExpr =
  | Number_
  | String_
  | Boolean_
  | Undefined
  | Null
  | Object_
  | FunctionWithReturn
  | FunctionReturnVoid
  | Union
  | Imported
  | Global;

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
export type Number_ = {
  type: TypeExprType.Number;
};

/**
 * プリミティブの型のnumber
 */
export const typeNumber: Number_ = {
  type: TypeExprType.Number
};

/**
 * プリミティブの型のstring
 */
export type String_ = {
  type: TypeExprType.String;
};

/**
 * プリミティブの型のstring
 */
export const typeString: String_ = {
  type: TypeExprType.String
};

/**
 * プリミティブの型のboolean
 */
export type Boolean_ = {
  type: TypeExprType.Boolean;
};

/**
 * プリミティブの型のboolean
 */
export const typeBoolean: Boolean_ = {
  type: TypeExprType.Boolean
};

/**
 * プリミティブの型のundefined
 */
export type Undefined = {
  type: TypeExprType.Undefined;
};

/**
 * プリミティブの型のundefined
 */
export const typeUndefined: Undefined = {
  type: TypeExprType.Undefined
};

/**
 * プリミティブの型のnull
 */
export type Null = {
  type: TypeExprType.Null;
};

/**
 * プリミティブの型のnull
 */
export const typeNull: Null = {
  type: TypeExprType.Null
};

/**
 * オブジェクト
 */
export type Object_ = {
  type: TypeExprType.Object;
  memberList: Map<string, { typeExpr: TypeExpr; document: string }>;
};

/**
 * オブジェクト
 */
export const object = (
  memberList: Map<string, { typeExpr: TypeExpr; document: string }>
): Object_ => ({
  type: TypeExprType.Object,
  memberList: memberList
});

/**
 * 戻り値がある関数
 */
export type FunctionWithReturn = {
  type: TypeExprType.FunctionWithReturn;
  parameter: ReadonlyArray<Parameter>;
  return: TypeExpr;
};

/**
 * 戻り値がない関数
 */
export type FunctionReturnVoid = {
  type: TypeExprType.FunctionReturnVoid;
  parameter: ReadonlyArray<Parameter>;
};

/**
 * 関数のパラメーター
 */
export type Parameter = {
  name: string;
  document: string;
  typeExpr: TypeExpr;
};

export type Union = {
  type: TypeExprType.Union;
  types: ReadonlyArray<TypeExpr>;
};

export type Imported = {
  type: TypeExprType.ImportedType;
  id: string;
  typeExpr: TypeExpr;
  name: string;
};

export type Global = { type: TypeExprType.GlobalType; name: string };

/** 関数の引数と戻り値の型を文字列にする */
const parameterAndReturnToString = (
  parameterList: ReadonlyArray<Parameter>,
  returnType: TypeExpr | null
): string =>
  "(" +
  parameterList
    .map(parameter => typeExprToString(parameter.typeExpr))
    .join(",") +
  ")=>" +
  (returnType === null ? "void" : typeExprToString(returnType));

/** 型の式をコードに表す */
export const typeExprToString = (typeExpr: TypeExpr): string => {
  switch (typeExpr.type) {
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
        Object.entries(typeExpr.memberList)
          .map(
            ([name, typeAndDocument]) =>
              name + ":" + typeExprToString(typeAndDocument.typeExpr)
          )
          .join(",") +
        "}"
      );

    case TypeExprType.FunctionWithReturn:
      return parameterAndReturnToString(typeExpr.parameter, typeExpr.return);

    case TypeExprType.FunctionReturnVoid:
      return parameterAndReturnToString(typeExpr.parameter, null);

    case TypeExprType.Union:
      return typeExpr.types.map(typeExprToString).join("|");

    case TypeExprType.ImportedType:
      return typeExpr.id + "." + typeExpr.name;

    case TypeExprType.GlobalType:
      return typeExpr.name;
  }
};
