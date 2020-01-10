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
 * TODO 外部に公開する型だけ、プロパティ名やドキュメントを指定できるようにしたいが
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
      parameterList: ReadonlyArray<TypeExpr>;
      return: TypeExpr;
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
      parameterList: infer parameterListType;
      return: TypeExpr;
    }
      ? Lambda<type["return"]>
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

type Lambda<returnType extends TypeExpr> = {
  type: ExprType.Lambda;
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

/**
 * 外部に公開する変数、関数
 * @param name 変数、関数の名前
 * @param document ドキュメント
 * @param expr 式
 */
export const exportVariable = <T extends TypeExpr>(
  name: string,
  document: string,
  expr: Expr<T>
): ExportVariable => ({
  name: name,
  document: document,
  expr: expr
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
      return (
        "(" +
        typeExpr.parameterList
          .map(
            (parameter, index) =>
              createIdentifer(index) + ":" + typeExprToString(parameter)
          )
          .join(",") +
        ")=>" +
        typeExprToString(typeExpr.return)
      );
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
