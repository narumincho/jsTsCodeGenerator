/* ======================================================================================
 *                                      Type Expr
 * ====================================================================================== */

/**
 * 型を表現する式
 */
export type TypeExpr =
  | TypeNumber
  | TypeString
  | TypeBoolean
  | TypeUndefined
  | TypeNull
  | TypeObject
  | TypeFunction
  | TypeUnion
  | TypeImported
  | TypeGlobal;

export const enum TypeExprType {
  Number,
  String,
  Boolean,
  Undefined,
  Null,
  Object,
  Function,
  Union,
  ImportedType,
  GlobalType
}

/**
 * プリミティブの型のnumber
 */
export type TypeNumber = {
  type: TypeExprType.Number;
};

/**
 * プリミティブの型のnumber
 */
export const typeNumber: TypeNumber = {
  type: TypeExprType.Number
};

/**
 * プリミティブの型のstring
 */
export type TypeString = {
  type: TypeExprType.String;
};

/**
 * プリミティブの型のstring
 */
export const typeString: TypeString = {
  type: TypeExprType.String
};

/**
 * プリミティブの型のboolean
 */
export type TypeBoolean = {
  type: TypeExprType.Boolean;
};

/**
 * プリミティブの型のboolean
 */
export const typeBoolean: TypeBoolean = {
  type: TypeExprType.Boolean
};

/**
 * プリミティブの型のundefined
 */
export type TypeUndefined = {
  type: TypeExprType.Undefined;
};

/**
 * プリミティブの型のundefined
 */
export const typeUndefined: TypeUndefined = {
  type: TypeExprType.Undefined
};

/**
 * プリミティブの型のnull
 */
export type TypeNull = {
  type: TypeExprType.Null;
};

/**
 * プリミティブの型のnull
 */
export const typeNull: TypeNull = {
  type: TypeExprType.Null
};

/**
 * オブジェクト
 */
export type TypeObject = {
  type: TypeExprType.Object;
  memberList: { [key in string]: { typeExpr: TypeExpr; document: string } };
};

/**
 * 関数
 */
export type TypeFunction = {
  type: TypeExprType.Function;
  return?: TypeExpr;
} & (
  | { typeType: FunctionTypeType.Parameter0 }
  | {
      typeType: FunctionTypeType.Parameter1;
      parameter0: Parameter;
    }
  | {
      typeType: FunctionTypeType.Parameter2;
      parameter0: Parameter;
      parameter1: Parameter;
    }
  | {
      typeType: FunctionTypeType.Parameter3;
      parameter0: Parameter;
      parameter1: Parameter;
      parameter2: Parameter;
    }
  | {
      typeType: FunctionTypeType.Parameter4;
      parameter0: Parameter;
      parameter1: Parameter;
      parameter2: Parameter;
      parameter3: Parameter;
    }
  | {
      typeType: FunctionTypeType.Parameter5;
      parameter0: Parameter;
      parameter1: Parameter;
      parameter2: Parameter;
      parameter3: Parameter;
      parameter4: Parameter;
    }
  | {
      typeType: FunctionTypeType.Parameter6;
      parameter0: Parameter;
      parameter1: Parameter;
      parameter2: Parameter;
      parameter3: Parameter;
      parameter4: Parameter;
      parameter5: Parameter;
    }
  | {
      typeType: FunctionTypeType.Parameter7;
      parameter0: Parameter;
      parameter1: Parameter;
      parameter2: Parameter;
      parameter3: Parameter;
      parameter4: Parameter;
      parameter5: Parameter;
      parameter6: Parameter;
    }
);

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

type Parameter = {
  name: string;
  document: string;
  typeExpr: TypeExpr;
};

export type TypeUnion = {
  type: TypeExprType.Union;
  types: ReadonlyArray<TypeExpr>;
};

export type TypeImported = {
  type: TypeExprType.ImportedType;
  id: string;
  typeExpr: TypeExpr;
  name: string;
};

export type TypeGlobal = { type: TypeExprType.GlobalType; name: string };

/** 関数の引数と戻り値の型を文字列にする */
const parameterAndReturnToString = (
  parameterList: ReadonlyArray<Parameter>,
  returnType: TypeExpr | undefined
): string =>
  "(" +
  parameterList
    .map(parameter => typeExprToString(parameter.typeExpr))
    .join(",") +
  ")=>" +
  (returnType === undefined ? "void" : typeExprToString(returnType));

/** 関数の型を文字列にする */
const functionTypeExprToString = (functionType: TypeFunction): string => {
  switch (functionType.typeType) {
    case FunctionTypeType.Parameter0:
      return parameterAndReturnToString([], functionType.return);
    case FunctionTypeType.Parameter1:
      return parameterAndReturnToString(
        [functionType.parameter0],
        functionType.return
      );
    case FunctionTypeType.Parameter2:
      return parameterAndReturnToString(
        [functionType.parameter0, functionType.parameter1],
        functionType.return
      );
    case FunctionTypeType.Parameter3:
      return parameterAndReturnToString(
        [
          functionType.parameter0,
          functionType.parameter1,
          functionType.parameter2
        ],
        functionType.return
      );
    case FunctionTypeType.Parameter4:
      return parameterAndReturnToString(
        [
          functionType.parameter0,
          functionType.parameter1,
          functionType.parameter2,
          functionType.parameter3
        ],
        functionType.return
      );
    case FunctionTypeType.Parameter5:
      return parameterAndReturnToString(
        [
          functionType.parameter0,
          functionType.parameter1,
          functionType.parameter2,
          functionType.parameter3,
          functionType.parameter4
        ],
        functionType.return
      );
    case FunctionTypeType.Parameter6:
      return parameterAndReturnToString(
        [
          functionType.parameter0,
          functionType.parameter1,
          functionType.parameter2,
          functionType.parameter3,
          functionType.parameter4,
          functionType.parameter5
        ],
        functionType.return
      );
    case FunctionTypeType.Parameter7:
      return parameterAndReturnToString(
        [
          functionType.parameter0,
          functionType.parameter1,
          functionType.parameter2,
          functionType.parameter3,
          functionType.parameter4,
          functionType.parameter4,
          functionType.parameter5,
          functionType.parameter6
        ],
        functionType.return
      );
  }
};

/** 型の式をコードに表す */
export const typeExprToString = (typeExpr: TypeExpr): string => {
  switch (typeExpr.type) {
    case TypeExprType.String:
      return "string";
    case TypeExprType.Number:
      return "number";
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
    case TypeExprType.Function:
      return functionTypeExprToString(typeExpr);
    case TypeExprType.Union:
      return typeExpr.types.map(typeExprToString).join("|");
    case TypeExprType.ImportedType:
      return (typeExpr.id as string) + "." + typeExpr.name;
    case TypeExprType.GlobalType:
      return typeExpr.name;
  }
};
