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
  | Object_<{ [key in string]: { typeExpr: TypeExpr; document: string } }>
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
export type Object_<
  T extends { [key in string]: { typeExpr: TypeExpr; document: string } }
> = {
  type: TypeExprType.Object;
  memberList: T;
};

export const object = <
  T extends { [key in string]: { typeExpr: TypeExpr; document: string } }
>(
  memberList: T
): Object_<T> => ({
  type: TypeExprType.Object,
  memberList: memberList
});

/**
 * 戻り値がある関数
 */
export type FunctionWithReturn = {
  type: TypeExprType.FunctionWithReturn;
  parameter: Parameter;
  return: TypeExpr;
};

/**
 * 戻り値がない関数
 */
export type FunctionReturnVoid = {
  type: TypeExprType.FunctionReturnVoid;
  parameter: Parameter;
};

/**
 * 関数のパラメーター
 */
export type Parameter =
  | { type: FunctionTypeType.Parameter0 }
  | {
      type: FunctionTypeType.Parameter1;
      parameter0: OneParameter;
    }
  | {
      type: FunctionTypeType.Parameter2;
      parameter0: OneParameter;
      parameter1: OneParameter;
    }
  | {
      type: FunctionTypeType.Parameter3;
      parameter0: OneParameter;
      parameter1: OneParameter;
      parameter2: OneParameter;
    }
  | {
      type: FunctionTypeType.Parameter4;
      parameter0: OneParameter;
      parameter1: OneParameter;
      parameter2: OneParameter;
      parameter3: OneParameter;
    }
  | {
      type: FunctionTypeType.Parameter5;
      parameter0: OneParameter;
      parameter1: OneParameter;
      parameter2: OneParameter;
      parameter3: OneParameter;
      parameter4: OneParameter;
    }
  | {
      type: FunctionTypeType.Parameter6;
      parameter0: OneParameter;
      parameter1: OneParameter;
      parameter2: OneParameter;
      parameter3: OneParameter;
      parameter4: OneParameter;
      parameter5: OneParameter;
    }
  | {
      type: FunctionTypeType.Parameter7;
      parameter0: OneParameter;
      parameter1: OneParameter;
      parameter2: OneParameter;
      parameter3: OneParameter;
      parameter4: OneParameter;
      parameter5: OneParameter;
      parameter6: OneParameter;
    };

const enum FunctionTypeType {
  Parameter0,
  Parameter1,
  Parameter2,
  Parameter3,
  Parameter4,
  Parameter5,
  Parameter6,
  Parameter7
}

type OneParameter = {
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
  parameterList: ReadonlyArray<OneParameter>,
  returnType: TypeExpr | null
): string =>
  "(" +
  parameterList
    .map(parameter => typeExprToString(parameter.typeExpr))
    .join(",") +
  ")=>" +
  (returnType === null ? "void" : typeExprToString(returnType));

export const parameterToOneParameterList = (
  parameter: Parameter
): ReadonlyArray<OneParameter> => {
  switch (parameter.type) {
    case FunctionTypeType.Parameter0:
      return [];

    case FunctionTypeType.Parameter1:
      return [parameter.parameter0];

    case FunctionTypeType.Parameter2:
      return [parameter.parameter0, parameter.parameter1];

    case FunctionTypeType.Parameter3:
      return [parameter.parameter0, parameter.parameter1, parameter.parameter2];
    case FunctionTypeType.Parameter4:
      return [
        parameter.parameter0,
        parameter.parameter1,
        parameter.parameter2,
        parameter.parameter3
      ];
    case FunctionTypeType.Parameter5:
      return [
        parameter.parameter0,
        parameter.parameter1,
        parameter.parameter2,
        parameter.parameter3,
        parameter.parameter4
      ];
    case FunctionTypeType.Parameter6:
      return [
        parameter.parameter0,
        parameter.parameter1,
        parameter.parameter2,
        parameter.parameter3,
        parameter.parameter4,
        parameter.parameter5
      ];
    case FunctionTypeType.Parameter7:
      return [
        parameter.parameter0,
        parameter.parameter1,
        parameter.parameter2,
        parameter.parameter3,
        parameter.parameter4,
        parameter.parameter4,
        parameter.parameter5,
        parameter.parameter6
      ];
  }
};

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
      return parameterAndReturnToString(
        parameterToOneParameterList(typeExpr.parameter),
        typeExpr.return
      );

    case TypeExprType.FunctionReturnVoid:
      return parameterAndReturnToString(
        parameterToOneParameterList(typeExpr.parameter),
        null
      );

    case TypeExprType.Union:
      return typeExpr.types.map(typeExprToString).join("|");

    case TypeExprType.ImportedType:
      return (typeExpr.id as string) + "." + typeExpr.name;

    case TypeExprType.GlobalType:
      return typeExpr.name;
  }
};
