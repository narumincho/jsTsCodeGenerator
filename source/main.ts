import * as typeExpr from "./typeExpr";
import * as scanType from "./scanType";

/**
 * 型を識別するためのID
 */
type TypeId = string & { _variableId: never };

/**
 * 変数を識別するためのID
 */
type VariableId = string & { _variableId: never };

/**
 * Node.js向けのコード。TypeScriptでも出力できるように型情報をつける必要がある
 */
export type NodeJsCode = {
  exportTypeAliasList: ReadonlyArray<ExportTypeAlias>;
  exportVariableList: ReadonlyArray<ExportVariable>;
};

type Import = {
  path: string;
  id: string;
};

type ExportTypeAlias = {
  readonly name: string;
  readonly document: string;
  readonly typeExpr: typeExpr.TypeExpr;
};

type ExportVariable = {
  readonly name: string;
  readonly typeExpr: typeExpr.TypeExpr;
  readonly document: string;
  readonly expr: Expr;
};

/* ======================================================================================
 *                                        Expr
 * ====================================================================================== */

export type Expr =
  | NumberLiteral
  | NumberOperator
  | StringLiteral
  | StringConcatenate
  | BooleanLiteral
  | NullLiteral
  | UndefinedLiteral
  | ObjectLiteral
  | LambdaWithReturn
  | LambdaReturnVoid
  | GlobalVariable
  | ImportedVariable;

const enum ExprType {
  NumberLiteral,
  NumberOperator,
  StringLiteral,
  StringConcatenate,
  BooleanLiteral,
  UndefinedLiteral,
  NullLiteral,
  ObjectLiteral,
  LambdaWithReturn,
  LambdaReturnVoid,
  GlobalVariable,
  ImportedVariable
}

type NumberLiteral = {
  type: ExprType.NumberLiteral;
  value: string;
};

type NumberOperator = {
  type: ExprType.NumberOperator;
  operator: NumberOperatorOperator;
  left: Expr;
  right: Expr;
};

type NumberOperatorOperator = "+" | "-" | "*" | "/";

type StringLiteral = {
  type: ExprType.StringLiteral;
  value: string;
};

type StringConcatenate = {
  type: ExprType.StringConcatenate;
  left: Expr;
  right: Expr;
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

type ObjectLiteral = {
  type: ExprType.ObjectLiteral;
  memberList: Map<string, Expr>;
};

type LambdaWithReturn = {
  type: ExprType.LambdaWithReturn;
  parameter: ReadonlyArray<typeExpr.OneParameter>;
  returnType: typeExpr.TypeExpr;
  body: Expr;
};

type LambdaReturnVoid = {
  type: ExprType.LambdaReturnVoid;
  parameter: ReadonlyArray<typeExpr.OneParameter>;
  body: Expr;
};

type GlobalVariable = {
  type: ExprType.GlobalVariable;
  name: string;
};

type ImportedVariable = {
  type: ExprType.ImportedVariable;
  path: string;
  name: string;
};

/* ======================================================================================
 *                                      Module
 * ====================================================================================== */
type ImportedModule = {
  path: string;
  typeList: { [name in string]: TypeId };
  variableList: { [name in string]: VariableId };
};

type ValueOf<T> = T[keyof T];

/**
 * Node.js向けの外部のライブラリをimportして使えるようにする
 */
export const createImportNodeModule = <
  typeList extends Array<string>,
  variableList extends Array<string>
>(
  path: string,
  typeList: typeList,
  variableList: variableList
): {
  typeList: { [name in ValueOf<typeList> & string]: typeExpr.Imported };
  variableList: { [name in ValueOf<variableList> & string]: ImportedVariable };
} => {
  const typeListObject = {} as {
    [name in ValueOf<typeList> & string]: typeExpr.Imported;
  };
  const variableListObject = {} as {
    [name in ValueOf<variableList> & string]: ImportedVariable;
  };
  for (const typeName of typeList) {
    typeListObject[typeName as ValueOf<typeList> & string] = {
      type: typeExpr.TypeExprType.ImportedType,
      path: path,
      name: typeName
    };
  }
  for (const variableName of variableList) {
    variableListObject[variableName as ValueOf<variableList> & string] = {
      type: ExprType.ImportedVariable,
      path: path,
      name: variableName
    };
  }
  return {
    typeList: typeListObject,
    variableList: variableListObject
  };
};

/**
 * グローバル空間の型と変数の型情報を渡して使えるようにする
 * @param global グローバル空間の型と変数の型情報
 * @param body コード本体
 */
export const createGlobalNamespace = <
  typeList extends Array<string>,
  variableList extends Array<string>
>(
  typeList: typeList,
  variableList: variableList
): {
  typeList: { [name in ValueOf<typeList> & string]: typeExpr.Global };
  variableList: { [name in ValueOf<variableList> & string]: GlobalVariable };
} => {
  const typeListObject = {} as {
    [name in ValueOf<typeList> & string]: typeExpr.Global;
  };
  const variableListObject = {} as {
    [name in ValueOf<variableList> & string]: GlobalVariable;
  };
  for (const typeName of typeList) {
    typeListObject[typeName as ValueOf<typeList> & string] = {
      type: typeExpr.TypeExprType.GlobalType,
      name: typeName
    };
  }
  for (const variableName of variableList) {
    variableListObject[variableName as ValueOf<variableList> & string] = {
      type: ExprType.GlobalVariable,
      name: variableName
    };
  }
  return {
    typeList: typeListObject,
    variableList: variableListObject
  };
};
/**
 * 外部に公開する変数を定義する
 * @param name 変数名
 * @param typeExpr 型
 * @param expr 式
 * @param document ドキュメント
 * @param body コード本体
 */
export const addExportVariable = <
  name extends string,
  typeExpr extends typeExpr.TypeExpr
>(
  name: name,
  typeExpr: typeExpr,
  expr: Expr,
  document: string,
  body: (variable: {
    type: ExprType.GlobalVariable;
    name: string;
    _type: typeExpr;
  }) => NodeJsCode
): NodeJsCode => {
  const code = body({
    type: ExprType.GlobalVariable,
    name: name,
    _type: typeExpr
  });
  return {
    ...code,
    exportVariableList: code.exportVariableList.concat({
      name: name,
      typeExpr: typeExpr,
      expr: expr,
      document: document
    })
  };
};
/**
 * 空のNode.js用コード
 */
export const emptyNodeJsCode: NodeJsCode = {
  exportTypeAliasList: [],
  exportVariableList: []
};

export const numberLiteral = (value: string): Expr => ({
  type: ExprType.NumberLiteral,
  value: value
});

/**
 * 文字列リテラル
 * @param string 文字列。エスケープする必要はない
 */
export const stringLiteral = (string: string): Expr => ({
  type: ExprType.StringLiteral,
  value: string
});
/**
 * 数値の足し算 ??? + ???
 * @param left 左辺
 * @param right 右辺
 */
export const add = (left: Expr, right: Expr): Expr => ({
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
export const sub = (left: Expr, right: Expr): Expr => ({
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
export const mul = (left: Expr, right: Expr): Expr => ({
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
export const division = (left: Expr, right: Expr): Expr => ({
  type: ExprType.NumberOperator,
  operator: "/",
  left: left,
  right: right
});

/**
 * オブジェクトリテラル
 */
export const createObjectLiteral = (memberList: Map<string, Expr>): Expr => {
  return {
    type: ExprType.ObjectLiteral,
    memberList: memberList
  };
};

/**
 * 識別子を生成する
 */
const createIdentifer = (
  identiferIndex: number,
  reserved: Set<string>
): { identifer: string; nextIdentiferIndex: number } => {
  while (true) {
    const result = createIdentiferByIndex(identiferIndex);
    if (reserved.has(result)) {
      identiferIndex += 1;
      continue;
    }
    return { identifer: result, nextIdentiferIndex: identiferIndex + 1 };
  }
};

/**
 * indexから識別子を生成する (予約語を考慮しない)
 * @param index
 */
const createIdentiferByIndex = (index: number): string => {
  const headIdentiferCharTable =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const noHeadIdentiferCharTable = headIdentiferCharTable + "0123456789";
  if (index < headIdentiferCharTable.length) {
    return headIdentiferCharTable[index];
  }
  let result = "";
  index -= headIdentiferCharTable.length;
  while (true) {
    const quotient = Math.floor(index / noHeadIdentiferCharTable.length);
    const remainder = index % noHeadIdentiferCharTable.length;
    if (quotient < headIdentiferCharTable.length) {
      return (
        headIdentiferCharTable[quotient] +
        noHeadIdentiferCharTable[remainder] +
        result
      );
    }
    result = noHeadIdentiferCharTable[remainder] + result;
    index = quotient;
  }
};

const exprToString = (expr: Expr): string => {
  switch (expr.type) {
    case ExprType.NumberLiteral:
      return expr.value;

    case ExprType.NumberOperator:
      return (
        "(" +
        exprToString(expr.left) +
        expr.operator +
        exprToString(expr.right) +
        ")"
      );

    case ExprType.StringLiteral:
      return '"' + expr.value + '"';

    case ExprType.StringConcatenate:
      return (
        "(" + exprToString(expr.left) + "+" + exprToString(expr.right) + ")"
      );

    case ExprType.BooleanLiteral:
      return expr.value ? "true" : "false";

    case ExprType.UndefinedLiteral:
      return "void 0";

    case ExprType.NullLiteral:
      return "null";

    case ExprType.ObjectLiteral:
      return (
        "{" +
        [...expr.memberList.entries()]
          .map(([key, value]) => key + ":" + exprToString(value))
          .join(",") +
        "}"
      );
    case ExprType.LambdaWithReturn:
      return (
        "(" +
        expr.parameter
          .map(o => o.name + ": " + typeExpr.typeExprToString(o.typeExpr))
          .join(",") +
        "): " +
        typeExpr.typeExprToString(expr.returnType) +
        "=>" +
        exprToString(expr.body)
      );

    case ExprType.LambdaReturnVoid:
      return (
        "(" +
        expr.parameter
          .map(o => o.name + ": " + typeExpr.typeExprToString(o.typeExpr))
          .join(",") +
        "): void=>" +
        exprToString(expr.body)
      );

    case ExprType.GlobalVariable:
      return expr.name;

    case ExprType.ImportedVariable:
      // TODO 識別子生成
      return expr.path + "の間に挟む識別子がほしいところ" + "." + expr.name;
  }
};

/**
 * 名前をつけたり、するために式を走査する
 * @param expr 式
 * @param scanData グローバルで使われている名前の集合などのコード全体の情報の収集データ。上書きする
 */
const scanExpr = (expr: Expr, scanData: scanType.NodeJsCodeScanData): void => {
  switch (expr.type) {
    case ExprType.NumberLiteral:
    case ExprType.NumberOperator:
    case ExprType.StringLiteral:
    case ExprType.BooleanLiteral:
    case ExprType.UndefinedLiteral:
    case ExprType.NullLiteral:
      return;

    case ExprType.ObjectLiteral:
      for (const [, member] of expr.memberList) {
        scanExpr(member, scanData);
      }
      return;

    case ExprType.LambdaWithReturn:
      for (const oneParameter of expr.parameter) {
        typeExpr.scan(oneParameter.typeExpr, scanData);
      }
      typeExpr.scan(expr.returnType, scanData);
      scanExpr(expr.body, scanData);
      return;

    case ExprType.LambdaReturnVoid:
      for (const oneParameter of expr.parameter) {
        typeExpr.scan(oneParameter.typeExpr, scanData);
      }
      scanExpr(expr.body, scanData);
      return;

    case ExprType.GlobalVariable:
      scanData.globalName.add(expr.name);
      return;

    case ExprType.ImportedVariable:
      scanData.importedModulePath.add(expr.path);
      return;
  }
};

const scanNodeJsCode = (
  nodeJsCode: NodeJsCode
): scanType.NodeJsCodeScanData => {
  const scanData: scanType.NodeJsCodeScanData = {
    globalName: new Set(),
    importedModulePath: new Set()
  };
  for (const exportTypeAlias of nodeJsCode.exportTypeAliasList) {
    scanData.globalName.add(exportTypeAlias.name);
    typeExpr.scan(exportTypeAlias.typeExpr, scanData);
  }
  for (const exportVariable of nodeJsCode.exportVariableList) {
    scanData.globalName.add(exportVariable.name);
    typeExpr.scan(exportVariable.typeExpr, scanData);
    scanExpr(exportVariable.expr, scanData);
  }
  return scanData;
};

const createImportedModuleName = (
  importedModulePathSet: Set<string>,
  identiferIndex: number,
  reserved: Set<string>
): {
  importedModuleNameMap: Map<string, string>;
  nextIdentiferIndex: number;
} => {
  const importedModuleNameMap = new Map<string, string>();
  for (const importedModulePath of importedModulePathSet) {
    const identiferAndNextIdentiferIndex = createIdentifer(
      identiferIndex,
      reserved
    );
    importedModuleNameMap.set(
      importedModulePath,
      identiferAndNextIdentiferIndex.identifer
    );
    identiferIndex = identiferAndNextIdentiferIndex.nextIdentiferIndex;
  }
  return {
    importedModuleNameMap,
    nextIdentiferIndex: identiferIndex
  };
};

export const toNodeJsCodeAsTypeScript = (nodeJsCode: NodeJsCode): string => {
  // グローバル空間にある名前やimportしたモジュールのパスを集める
  const scanData = scanNodeJsCode(nodeJsCode);
  const importedModuleNameMapAndNextIdentiferIndex = createImportedModuleName(
    scanData.importedModulePath,
    0,
    scanData.globalName
  );

  return (
    [
      ...importedModuleNameMapAndNextIdentiferIndex.importedModuleNameMap.entries()
    ]
      .map(
        ([path, identifer]) =>
          "import * as " + identifer + ' from "' + path + '"'
      )
      .join(";\n") +
    ";\n" +
    nodeJsCode.exportTypeAliasList
      .map(
        exportTypeAlias =>
          "/** " +
          exportTypeAlias.document +
          " */export type " +
          exportTypeAlias.name +
          " = " +
          typeExpr.typeExprToString(exportTypeAlias.typeExpr)
      )
      .join(";\n") +
    "\n" +
    nodeJsCode.exportVariableList
      .map(
        exportVariable =>
          "/** " +
          exportVariable.document +
          " */\nexport const " +
          exportVariable.name +
          ": " +
          typeExpr.typeExprToString(exportVariable.typeExpr) +
          " = " +
          exprToString(exportVariable.expr)
      )
      .join(";\n")
  );
};
