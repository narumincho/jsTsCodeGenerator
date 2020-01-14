import * as typeExpr from "./typeExpr";

/**
 * 内部で使う変数の型を識別するためのID
 */
type VariableId = string & { _variableId: never };

/**
 * Node.js向けのコード。TypeScriptでも出力できるように型情報をつける必要がある
 */
export type NodeJsCode = {
  importList: ReadonlyArray<Import>;
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

type ModuleOrGlobalDefinition = {
  typeList: { [key in string]: typeExpr.TypeExpr };
  variableList: { [key in string]: typeExpr.TypeExpr };
};

type Global<definition extends ModuleOrGlobalDefinition> = {
  typeList: {
    [key in keyof definition["typeList"]]: {
      type: typeExpr.TypeExprType.GlobalType;
      name: key;
    };
  };
  variableList: {
    [key in keyof definition["variableList"]]: {
      type: ExprType.GlobalVariable;
      name: key;
      _type: definition["variableList"][key];
    };
  };
};

type Module<definition extends ModuleOrGlobalDefinition> = {
  typeList: {
    [key in keyof definition["typeList"]]: {
      type: typeExpr.TypeExprType.ImportedType;
      id: string;
      name: key;
    };
  };
  variableList: {
    [key in keyof definition["variableList"]]: {
      type: ExprType.ImportedVariable;
      importId: string;
      name: key;
      _type: definition["variableList"][key];
    };
  };
};

/* ======================================================================================
 *                                        Expr
 * ====================================================================================== */

type Expr =
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
  parameter: ReadonlyArray<typeExpr.Parameter>;
  returnType: typeExpr.TypeExpr;
  body: Expr;
};

type LambdaReturnVoid = {
  type: ExprType.LambdaReturnVoid;
  parameter: ReadonlyArray<typeExpr.Parameter>;
  body: Expr;
};

type GlobalVariable = {
  type: ExprType.GlobalVariable;
  name: string;
};

type ImportedVariable = {
  type: ExprType.ImportedVariable;
  importId: string;
  name: string;
};

/* ======================================================================================
 *                                      Module
 * ====================================================================================== */

const objectMap = <objectKeys extends string, input, output>(
  input: { [key in objectKeys]: input },
  func: (key: objectKeys, input: input) => output
): { [key in objectKeys]: output } =>
  Object.entries<input>(input).reduce(
    (previous, [key, value]) => ({
      ...previous,
      [key]: func(key as objectKeys, value)
    }),
    {} as { [key in objectKeys]: output }
  );

const globalDefinitionToGlobal = <
  moduleDefinition extends ModuleOrGlobalDefinition
>(
  moduleDefinition: moduleDefinition
): Global<moduleDefinition> => ({
  typeList: objectMap(moduleDefinition.typeList, (name, _typeExpr) => ({
    type: typeExpr.TypeExprType.GlobalType,
    name: name
  })) as Global<moduleDefinition>["typeList"],
  variableList: objectMap(moduleDefinition.variableList, (name, typeExpr) => ({
    type: ExprType.GlobalVariable,
    name: name,
    _type: typeExpr
  })) as Global<moduleDefinition>["variableList"]
});

/**
 * グローバル空間の型と変数の型情報を渡して使えるようにする
 * @param global グローバル空間の型と変数の型情報
 * @param body コード本体
 */
export const addGlobal = <
  globalModuleDefinition extends ModuleOrGlobalDefinition
>(
  global: globalModuleDefinition,
  body: (global: Global<globalModuleDefinition>) => NodeJsCode
): NodeJsCode => body(globalDefinitionToGlobal(global));

const moduleDefinitionToModule = <
  moduleDefinition extends ModuleOrGlobalDefinition
>(
  moduleDefinition: moduleDefinition,
  importId: string
): Module<moduleDefinition> => ({
  typeList: objectMap(moduleDefinition.typeList, (name, _typeExpr) => ({
    type: typeExpr.TypeExprType.ImportedType,
    id: importId,
    name: name
  })) as Module<moduleDefinition>["typeList"],
  variableList: objectMap(moduleDefinition.variableList, (name, typeExpr) => ({
    type: ExprType.ImportedVariable,
    importId: importId,
    name: name,
    _type: typeExpr
  })) as Module<moduleDefinition>["variableList"]
});

/**
 * Node.js向けの外部のライブラリをimportして使えるようにする
 * @param path パス
 * @param moduleDefinition モジュールの公開している型と変数の型情報
 * @param rootIdentiferIndex 識別子を生成するためのインデックス
 * @param body コード本体
 */
export const importNodeModule = <
  moduleDefinition extends ModuleOrGlobalDefinition
>(
  path: string,
  moduleDefinition: moduleDefinition,
  rootIdentiferIndex: number,
  body: (module: Module<moduleDefinition>) => NodeJsCode
): { code: NodeJsCode; identiferIndex: number } => {
  const importIdentiferData = createIdentifer(rootIdentiferIndex, []);
  const importId = importIdentiferData.string;
  const code = body(moduleDefinitionToModule(moduleDefinition, importId));
  return {
    code: {
      ...code,
      importList: code.importList.concat([
        {
          id: importId,
          path: path
        }
      ])
    },
    identiferIndex: importIdentiferData.nextIndex
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
  importList: [],
  exportTypeAliasList: [],
  exportVariableList: []
};

export const numberLiteral = (value: string): NumberLiteral => ({
  type: ExprType.NumberLiteral,
  value: value
});

/**
 * 文字列リテラル
 * @param string 文字列。エスケープする必要はない
 */
export const stringLiteral = (string: string): StringLiteral => ({
  type: ExprType.StringLiteral,
  value: string
});
/**
 * 数値の足し算 ??? + ???
 * @param left 左辺
 * @param right 右辺
 */
export const add = (left: Expr, right: Expr): NumberOperator => ({
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
export const sub = (left: Expr, right: Expr): NumberOperator => ({
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
export const mul = (left: Expr, right: Expr): NumberOperator => ({
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
export const division = (left: Expr, right: Expr): NumberOperator => ({
  type: ExprType.NumberOperator,
  operator: "/",
  left: left,
  right: right
});

/**
 * オブジェクトリテラル
 */
export const createObjectLiteral = (
  memberList: Map<string, Expr>
): ObjectLiteral => {
  return {
    type: ExprType.ObjectLiteral,
    memberList: memberList
  };
};

/**
 * 識別子を生成する
 */
const createIdentifer = (
  index: number,
  reserved: ReadonlyArray<string>
): { string: string; nextIndex: number } => {
  while (true) {
    const result = createIdentiferByIndex(index);
    if (reserved.includes(result)) {
      index += 1;
      continue;
    }
    return { string: result, nextIndex: index + 1 };
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
        Object.entries(expr.memberList)
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
      return (expr.importId as string) + "." + expr.name;
  }
};

export const toNodeJsCodeAsTypeScript = (nodeJsCode: NodeJsCode): string =>
  nodeJsCode.importList
    .map(
      importNodeModule =>
        "import * as " +
        (importNodeModule.id as string) +
        ' from "' +
        importNodeModule.path +
        '"'
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
    .join(";\n");
