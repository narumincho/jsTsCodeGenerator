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

/**
 * 型の式 {id:string | number} みたいな
 * TODO 外部に公開する型だけ、プロパティ名やドキュメントを指定できるようにしたいが
 */
export type TypeExpr =
  | {
      type: TypeExprType.Object;
      memberList: ReadonlyArray<{
        name: string;
        document: string;
        typeExpr: TypeExpr;
      }>;
    }
  | { type: TypeExprType.ReferenceExportTypeAlias; name: string }
  | { type: TypeExprType.Primitive; primitive: PrimitiveType }
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

type ExportVariable = {
  readonly name: string;
  readonly document: string;
  readonly expr: Expr;
};

type Expr = NumberLiteral | NumberOperator | StringLiteral | NodeGlobalVariable;

const enum ExprType {
  NumberLiteral,
  NumberOperator,
  StringLiteral,
  NodeGlobalVariable
}

type NumberLiteral = { type: ExprType.NumberLiteral; value: string };

type NumberOperator = {
  type: ExprType.NumberOperator;
  operator: NumberOperatorOperator;
  left: NumberLiteral | NumberOperator;
  right: NumberLiteral | NumberOperator;
};

type NumberOperatorOperator = "+" | "-" | "*" | "/";

type StringLiteral = { type: ExprType.StringLiteral; value: string };

type NodeGlobalVariable = {
  type: ExprType.NodeGlobalVariable;
  variable: "console";
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
export const exportVariable = (
  name: string,
  document: string,
  expr: Expr
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
  left: NumberLiteral | NumberOperator,
  right: NumberLiteral | NumberOperator
): NumberOperator => ({
  type: ExprType.NumberOperator,
  operator: "+",
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
        typeExpr.memberList
          .map(member => member.name + ":" + typeExprToString(member.typeExpr))
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
  nodeJsCode.exportTypeAliasList
    .map(
      exportTypeAlias =>
        "type" +
        exportTypeAlias.name +
        " = " +
        typeExprToString(exportTypeAlias.typeExpr)
    )
    .join(";");
