import * as type from "../type";
import * as identifer from "../identifer";

/** 関数の引数と戻り値の型を文字列にする */
const functionTypeToString = (
  parameterTypeList: ReadonlyArray<type.TypeExpr>,
  returnType: type.TypeExpr,
  reserved: ReadonlySet<string>
): string => {
  let index = identifer.initialIdentiferIndex;
  const parameterList: Array<{
    name: string;
    typeExpr: type.TypeExpr;
  }> = [];
  for (const parameter of parameterTypeList) {
    const indexAndIdentifer = identifer.createIdentifer(index, reserved);
    index = indexAndIdentifer.nextIdentiferIndex;
    parameterList.push({
      name: indexAndIdentifer.identifer,
      typeExpr: parameter
    });
  }

  return (
    "(" +
    parameterList
      .map(
        parameter =>
          parameter.name + ": " + typeExprToString(parameter.typeExpr)
      )
      .join(", ") +
    ") => " +
    typeExprToString(returnType)
  );
};
/**
 * 型の式をコードに変換する
 * @param typeExpr 型の式
 */
export const typeExprToString = (typeExpr: type.TypeExpr): string => {
  switch (typeExpr._) {
    case type.TypeExpr_.Number:
      return "number";

    case type.TypeExpr_.String:
      return "string";

    case type.TypeExpr_.Boolean:
      return "boolean";

    case type.TypeExpr_.Null:
      return "null";

    case type.TypeExpr_.Never:
      return "never";

    case type.TypeExpr_.Void:
      return "void";

    case type.TypeExpr_.Undefined:
      return "undefined";

    case type.TypeExpr_.Object:
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

    case type.TypeExpr_.Function:
      return functionTypeToString(typeExpr.parameterList, typeExpr.return);

    case type.TypeExpr_.EnumTagLiteral:
      return typeExpr.typeName + "." + typeExpr.tagName;

    case type.TypeExpr_.Union:
      return typeExpr.types
        .map(typeExpr => typeExprToString(typeExpr))
        .join(" | ");

    case type.TypeExpr_.WithTypeParameter:
      return (
        typeExprToString(typeExpr.typeExpr) +
        "<" +
        typeExpr.typeParameterList.map(typeExprToString).join(", ") +
        ">"
      );

    case type.TypeExpr_.GlobalType:
      return typeExpr.name;

    case type.TypeExpr_.ImportedType:
      return typeExpr.nameSpaceIdentifer + "." + typeExpr.name;

    case type.TypeExpr_.BuiltIn:
      return builtInToString(typeExpr.builtIn);
  }
};

const builtInToString = (builtInType: type.BuiltInType): string => {
  switch (builtInType) {
    case type.BuiltInType.Array:
      return "Array";
    case type.BuiltInType.ReadonlyArray:
      return "ReadonlyArray";
    case type.BuiltInType.Uint8Array:
      return "Uint8Array";
    case type.BuiltInType.Promise:
      return "Promise";
    case type.BuiltInType.Date:
      return "Date";
    case type.BuiltInType.Map:
      return "Map";
    case type.BuiltInType.ReadonlyMap:
      return "ReadonlyMap";
    case type.BuiltInType.Set:
      return "Set";
    case type.BuiltInType.ReadonlySet:
      return "ReadonlySet";
  }
};
