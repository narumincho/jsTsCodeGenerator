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

export type TypeExpr =
  | {
      type: "object";
      members: ReadonlyArray<{
        name: string;
        document: string;
        typeExpr: TypeExpr;
      }>;
    }
  | { type: "referenceExportTypeAlias"; name: string }
  | { type: "primitive"; primitive: PrimitiveType }
  | { type: "union"; types: ReadonlyArray<TypeExpr> };

export type PrimitiveType =
  | "string"
  | "number"
  | "boolean"
  | "undefined"
  | "null";

type ExportVariable = {
  readonly name: string;
  readonly document: string;
  readonly expr: Expr;
};

type Expr = NumberLiteral | NumberOperator;

const enum ExprType {
  NumberLiteral,
  NumberOperator
}

type NumberLiteral = { type: ExprType.NumberLiteral; number: string };

type NumberOperator = {
  type: ExprType.NumberOperator;
  operator: NumberOperatorOperator;
  left: NumberLiteral | NumberOperator;
  right: NumberLiteral | NumberOperator;
};

type NumberOperatorOperator = "+" | "-" | "*" | "/";

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

export const numberLiteral = (number: string): NumberLiteral => ({
  type: ExprType.NumberLiteral,
  number: number
});

export const numberOperator = (
  operator: NumberOperatorOperator,
  left: NumberLiteral | NumberOperator,
  right: NumberLiteral | NumberOperator
): NumberOperator => ({
  type: ExprType.NumberOperator,
  operator: operator,
  left: left,
  right: right
});
/**
 * TODO スコープを考えて識別子を作れなければならない
 * @param index
 */
const createIdentifer = (index: number): string => {
  const identifer = "abcdefghijklmnopqrstuvwxyz"[index];
  if (identifer === undefined) {
    throw new Error("識別子の数が多すぎる!");
  }
  return identifer;
};

export const toNodeJsCodeAsTypeScript = (nodeJsCode: NodeJsCode): string =>
  nodeJsCode.importNodeModuleList
    .map(
      (e, index) =>
        "import * as " + createIdentifer(index) + ' from "' + e.path + '"'
    )
    .join(";");
