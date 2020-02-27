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
      parameterList: ReadonlyArray<{
        name: string;
        typeExpr: TypeExpr;
      }>;
      return: TypeExpr;
    }
  | {
      _: TypeExpr_.FunctionReturnVoid;
      parameterList: ReadonlyArray<{
        name: string;
        typeExpr: TypeExpr;
      }>;
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
      _: TypeExpr_.WithTypeParameter;
      typeExpr: TypeExpr;
      typeParameterList: ReadonlyArray<TypeExpr>;
    }
  | {
      _: TypeExpr_.ImportedType;
      nameSpaceIdentifer: string;
      name: string;
    }
  | { _: TypeExpr_.GlobalType; name: string }
  | { _: TypeExpr_.BuiltIn; builtIn: builtIn.Type };

export const enum TypeExpr_ {
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

    case TypeExpr_.Never:
      return "never";

    case TypeExpr_.Void:
      return "void";

    case TypeExpr_.Undefined:
      return "undefined";

    case TypeExpr_.Object:
      return (
        "{ " +
        [...typeExpr.memberList.entries()]
          .map(
            ([name, typeAndDocument]) =>
              name + ": " + typeExprToString(typeAndDocument.typeExpr)
          )
          .join("; ") +
        " }"
      );

    case TypeExpr_.FunctionWithReturn:
      return parameterAndReturnToString(
        typeExpr.parameterList,
        typeExpr.return
      );

    case TypeExpr_.FunctionReturnVoid:
      return parameterAndReturnToString(typeExpr.parameterList, null);

    case TypeExpr_.EnumTagLiteral:
      return typeExpr.typeName + "." + typeExpr.tagName;

    case TypeExpr_.Union:
      return typeExpr.types
        .map(typeExpr => typeExprToString(typeExpr))
        .join(" | ");

    case TypeExpr_.WithTypeParameter:
      return (
        typeExprToString(typeExpr.typeExpr) +
        "<" +
        typeExpr.typeParameterList.map(typeExprToString).join(", ") +
        ">"
      );

    case TypeExpr_.GlobalType:
      return typeExpr.name;

    case TypeExpr_.ImportedType:
      return typeExpr.nameSpaceIdentifer + "." + typeExpr.name;

    case TypeExpr_.BuiltIn:
      return builtInToString(typeExpr.builtIn);
  }
};

const builtInToString = (builtInType: builtIn.Type): string => {
  switch (builtInType) {
    case builtIn.Type.Array:
      return "Array";
    case builtIn.Type.ReadonlyArray:
      return "ReadonlyArray";
    case builtIn.Type.Uint8Array:
      return "Uint8Array";
    case builtIn.Type.Promise:
      return "Promise";
    case builtIn.Type.Date:
      return "Date";
    case builtIn.Type.Map:
      return "Map";
    case builtIn.Type.ReadonlyMap:
      return "ReadonlyMap";
    case builtIn.Type.Set:
      return "Set";
    case builtIn.Type.ReadonlySet:
      return "ReadonlySet";
  }
};
