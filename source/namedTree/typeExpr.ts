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
      parameter: ReadonlyArray<{
        name: string;
        typeExpr: TypeExpr;
      }>;
      return: TypeExpr;
    }
  | {
      _: TypeExpr_.FunctionReturnVoid;
      parameter: ReadonlyArray<{
        name: string;
        typeExpr: TypeExpr;
      }>;
    }
  | {
      _: TypeExpr_.Union;
      types: ReadonlyArray<TypeExpr>;
    }
  | {
      _: TypeExpr_.ImportedType;
      nameSpaceIdentifer: string;
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
  parameter: ReadonlyArray<{
    name: string;
    typeExpr: TypeExpr;
  }>,
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
  parameter: ReadonlyArray<{
    name: string;
    typeExpr: TypeExpr;
  }>
): TypeExpr => ({
  _: TypeExpr_.FunctionReturnVoid,
  parameter: parameter
});

/**
 * インポートされた外部の型
 * @param nameSpaceIdentifer 名前空間を識別する識別子
 * @param name 型名
 */
export const importedType = (
  nameSpaceIdentifer: string,
  name: string
): TypeExpr => ({
  _: TypeExpr_.ImportedType,
  nameSpaceIdentifer,
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
  parameterList: ReadonlyArray<{
    name: string;
    typeExpr: TypeExpr;
  }>,
  returnType: TypeExpr | null
): string =>
  "(" +
  parameterList
    .map(
      parameter => parameter.name + ": " + typeExprToString(parameter.typeExpr)
    )
    .join(", ") +
  ") => " +
  (returnType === null ? "void" : typeExprToString(returnType));

/**
 * 型の式をコードに変換する
 * @param typeExpr 型の式
 */
export const typeExprToString = (typeExpr: TypeExpr): string => {
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
              name + ": " + typeExprToString(typeAndDocument.typeExpr)
          )
          .join(", ") +
        "}"
      );

    case TypeExpr_.FunctionWithReturn:
      return parameterAndReturnToString(typeExpr.parameter, typeExpr.return);

    case TypeExpr_.FunctionReturnVoid:
      return parameterAndReturnToString(typeExpr.parameter, null);

    case TypeExpr_.Union:
      return typeExpr.types
        .map(typeExpr => typeExprToString(typeExpr))
        .join("|");

    case TypeExpr_.GlobalType:
      return typeExpr.name;

    case TypeExpr_.ImportedType: {
      return typeExpr.nameSpaceIdentifer + "." + typeExpr.name;
    }
  }
};
