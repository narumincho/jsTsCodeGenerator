type NodeModulePath = string & { _nodeModulePath: never };

/**
 * Node.js向けのコード。TypeScriptでも出力できるように型情報をつける必要がある
 */
export type NodeJsCode = {
  readonly importNodeModuleList: ReadonlyArray<ImportNodeModule>;
  readonly exportTypeAliasList: ReadonlyArray<ExportTypeAlias>;
  readonly exportVariableList: ReadonlyArray<ExportVariable>;
};

/**
 * import * as ??? from "path"
 */
type ImportNodeModule = {
  readonly path: string;
  readonly id: NodeModulePath;
};

/**
 * / * * document * /
 *
 * type name = typeExpr
 */
type ExportTypeAlias = {
  readonly name: string;
  readonly document: string;
  readonly typeExpr: TypeExpr;
};

/* ======================================================================================
 *                                      Type Expr
 * ====================================================================================== */

/**
 * 型の式 {id:string | number} みたいな
 */
export type TypeExpr =
  | { type: TypeExprType.Primitive; primitive: PrimitiveType }
  | {
      type: TypeExprType.Object;
      memberList: {
        [name in string]: { typeExpr: TypeExpr; document: string };
      };
    }
  | { type: TypeExprType.ReferenceExportTypeAlias; name: string }
  | { type: TypeExprType.Union; types: ReadonlyArray<TypeExpr> }
  | {
      type: TypeExprType.Function;
      functionType: FunctionType;
    };

const enum TypeExprType {
  Object,
  Primitive,
  Union,
  ReferenceExportTypeAlias,
  Function
}

const enum PrimitiveType {
  String,
  Number,
  Boolean,
  Undefined,
  Null
}

/**
 * プリミティブの型のnumber
 */
export const number = {
  type: TypeExprType.Primitive,
  primitive: PrimitiveType.Number
} as const;

/**
 * プリミティブの型のstring
 */
export const string = {
  type: TypeExprType.Primitive,
  primitive: PrimitiveType.String
} as const;

type ExportVariable = {
  readonly name: string;
  readonly document: string;
  readonly expr: Expr<TypeExpr>;
};

type FunctionType = {
  return: TypeExpr;
} & (
  | { type: FunctionTypeType.Parameter0 }
  | {
      type: FunctionTypeType.Parameter1;
      parameter0: Parameter;
    }
  | {
      type: FunctionTypeType.Parameter2;
      parameter0: Parameter;
      parameter1: Parameter;
    }
  | {
      type: FunctionTypeType.Parameter3;
      parameter0: Parameter;
      parameter1: Parameter;
      parameter2: Parameter;
    }
  | {
      type: FunctionTypeType.Parameter4;
      parameter0: Parameter;
      parameter1: Parameter;
      parameter2: Parameter;
      parameter3: Parameter;
    }
  | {
      type: FunctionTypeType.Parameter5;
      parameter0: Parameter;
      parameter1: Parameter;
      parameter2: Parameter;
      parameter3: Parameter;
      parameter4: Parameter;
    }
  | {
      type: FunctionTypeType.Parameter6;
      parameter0: Parameter;
      parameter1: Parameter;
      parameter2: Parameter;
      parameter3: Parameter;
      parameter4: Parameter;
      parameter5: Parameter;
    }
  | {
      type: FunctionTypeType.Parameter7;
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
/* ======================================================================================
 *                                        Expr
 * ====================================================================================== */

type Expr<type extends TypeExpr> =
  | (type extends {
      type: TypeExprType.Primitive;
      primitive: infer primitive;
    }
      ?
          | (primitive extends PrimitiveType.Number
              ? NumberLiteral | NumberOperator
              : never)
          | (primitive extends PrimitiveType.String
              ? StringLiteral | StringConcatenate
              : never)
          | (primitive extends PrimitiveType.Boolean ? BooleanLiteral : never)
          | (primitive extends PrimitiveType.Null ? NullLiteral : never)
          | (primitive extends PrimitiveType.Undefined
              ? UndefinedLiteral
              : never)
      : never)
  | (type extends {
      type: TypeExprType.Object;
      memberList: {
        [name in string]: { typeExpr: TypeExpr; document: string };
      };
    }
      ? ObjectLiteral<
          {
            [key in keyof type["memberList"]]: type["memberList"][key]["typeExpr"];
          }
        >
      : never)
  | (type extends {
      type: TypeExprType.Function;
      parameterList: ReadonlyArray<{
        name: string;
        typeExpr: TypeExpr;
        document: string;
      }>;
      return: TypeExpr;
    }
      ? Lambda<type["parameterList"], type["return"]>
      : never);

const enum ExprType {
  NumberLiteral,
  NumberOperator,
  StringLiteral,
  StringConcatenate,
  BooleanLiteral,
  NullLiteral,
  UndefinedLiteral,
  ObjectLiteral,
  NodeGlobalVariable,
  Lambda
}

type NumberLiteral = { type: ExprType.NumberLiteral; value: string };

type NumberOperator = {
  type: ExprType.NumberOperator;
  operator: NumberOperatorOperator;
  left: Expr<typeof number>;
  right: Expr<typeof number>;
};

type NumberOperatorOperator = "+" | "-" | "*" | "/";

type StringLiteral = { type: ExprType.StringLiteral; value: string };

type StringConcatenate = {
  type: ExprType.StringConcatenate;
  left: Expr<typeof string>;
  right: Expr<typeof string>;
};

type BooleanLiteral = {
  type: ExprType.BooleanLiteral;
  value: boolean;
};

type NullLiteral = {
  type: ExprType.NullLiteral;
};

type UndefinedLiteral = {
  type: ExprType.UndefinedLiteral;
};

type ObjectLiteral<T extends { [name in string]: TypeExpr }> = {
  type: ExprType.ObjectLiteral;
  values: { [key in keyof T]: Expr<T[key]> };
};

type NodeGlobalVariable = {
  type: ExprType.NodeGlobalVariable;
  variable: "console";
};

type Lambda<
  parameterList extends ReadonlyArray<{
    name: string;
    typeExpr: TypeExpr;
    document: string;
  }>,
  returnType extends TypeExpr
> = {
  type: ExprType.Lambda;
  parameter: keyof parameterList["values"];
  expr: Expr<returnType>;
};
/**
 * ブラウザで向けのコード
 */
type BrowserCode = {};

/**
 * Node.js向けの外部のライブラリを読み込むimport文
 * @param path パス
 * @param id 識別するためのID
 */
export const importNodeModule = (
  path: string,
  id: string
): ImportNodeModule => ({
  path: path,
  id: id as NodeModulePath
});

/**
 * 外部に公開する型
 * @param name 型の名前
 * @param document ドキュメント
 * @param typeExpr 別名を付ける型
 */
export const exportTypeAlias = (
  name: string,
  document: string,
  typeExpr: TypeExpr
): ExportTypeAlias => ({
  name: name,
  document: document,
  typeExpr: typeExpr
});

export const numberLiteral = (value: string): NumberLiteral => ({
  type: ExprType.NumberLiteral,
  value: value
});

/**
 * 数値の足し算 ??? + ???
 * @param left 左辺
 * @param right 右辺
 */
export const add = (
  left: Expr<typeof number>,
  right: Expr<typeof number>
): NumberOperator => ({
  type: ExprType.NumberOperator,
  operator: "+",
  left: left,
  right: right
});

/**
 * 数値の引き算
 * @param left 左辺
 * @param right 右辺
 */
export const sub = (
  left: Expr<typeof number>,
  right: Expr<typeof number>
): NumberOperator => ({
  type: ExprType.NumberOperator,
  operator: "-",
  left: left,
  right: right
});

/**
 * 数値の掛け算
 * @param left 左辺
 * @param right 右辺
 */
export const mul = (
  left: Expr<typeof number>,
  right: Expr<typeof number>
): NumberOperator => ({
  type: ExprType.NumberOperator,
  operator: "*",
  left: left,
  right: right
});

/**
 * 数値の割り算
 * @param left 左辺
 * @param right 右辺
 */
export const div = (
  left: Expr<typeof number>,
  right: Expr<typeof number>
): NumberOperator => ({
  type: ExprType.NumberOperator,
  operator: "/",
  left: left,
  right: right
});
/**
 * TODO スコープを考えて識別子を作れなければならない
 * 予約語やグローバルにある識別子との衝突考慮しなければならない
 * @param index
 */
const createIdentifer = (index: number): string => {
  const identifer = "abcdefghijklmnopqrstuvwxyz"[index];
  if (identifer === undefined) {
    throw new Error("識別子の数が多すぎる!");
  }
  return identifer;
};

const primitiveTypeToString = (primitiveType: PrimitiveType): string => {
  switch (primitiveType) {
    case PrimitiveType.String:
      return "string";
    case PrimitiveType.Number:
      return "number";
    case PrimitiveType.Boolean:
      return "boolean";
    case PrimitiveType.Null:
      return "null";
    case PrimitiveType.Undefined:
      return "undefined";
  }
};

/** 関数の引数と戻り値の型を文字列にする */
const parameterAndReturnToString = (
  parameterList: ReadonlyArray<Parameter>,
  returnType: TypeExpr
): string =>
  "(" +
  parameterList
    .map(parameter => typeExprToString(parameter.typeExpr))
    .join(",") +
  ")=>" +
  typeExprToString(returnType);

/** 関数の型を文字列にする */
const functionTypeExprToString = (functionType: FunctionType): string => {
  switch (functionType.type) {
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
const typeExprToString = (typeExpr: TypeExpr): string => {
  switch (typeExpr.type) {
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
    case TypeExprType.Primitive:
      return primitiveTypeToString(typeExpr.primitive);
    case TypeExprType.Function:
      return functionTypeExprToString(typeExpr.functionType);
    case TypeExprType.ReferenceExportTypeAlias:
      return "";
    case TypeExprType.Union:
      return typeExpr.types.map(typeExprToString).join("|");
  }
};

// const exprToString = (expr: Expr<unknown>): string => {
//   switch (expr.type) {
//     case ExprType.NumberLiteral:
//       return expr.value;
//   }
// };

export const toNodeJsCodeAsTypeScript = (nodeJsCode: NodeJsCode): string =>
  nodeJsCode.importNodeModuleList
    .map(
      (importNodeModule, index) =>
        "import * as " +
        createIdentifer(index) +
        ' from "' +
        importNodeModule.path +
        '"'
    )
    .join(";") +
  ";" +
  nodeJsCode.exportTypeAliasList
    .map(
      exportTypeAlias =>
        "type " +
        exportTypeAlias.name +
        " = " +
        typeExprToString(exportTypeAlias.typeExpr)
    )
    .join(";") +
  ";";

/**
 * 作りたいコード
 *
 * import * as api from "./api";
 *
 * const leb128toNumber = (number):number => {
 *
 * }
 *
 * export const middleware = (request, response) => {
 *   if(request.accept==="text/html") {
 *      response.setHeader("", "");
 *      response.send("")
 *   }
 *   const a = request.body;
 *   if(a[0] === 0 ){
 *      response.send(api.getUser(a[32]))
 *   }
 *   response.send()
 * }
 *
 */
