import * as typeExpr from "./typeExpr";
import * as expr from "./expr";
import * as scanType from "./scanType";
import * as reservedWord from "./reservedWord";

export { typeExpr };
export { expr };

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

type ExportTypeAlias = {
  readonly name: string;
  readonly document: string;
  readonly typeExpr: typeExpr.TypeExpr;
};

type ExportVariable = {
  readonly name: string;
  readonly typeExpr: typeExpr.TypeExpr;
  readonly document: string;
  readonly expr: expr.Expr;
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
  typeList: { [name in ValueOf<typeList> & string]: typeExpr.TypeExpr };
  variableList: { [name in ValueOf<variableList> & string]: expr.Expr };
} => {
  const typeListObject = {} as {
    [name in ValueOf<typeList> & string]: typeExpr.TypeExpr;
  };
  const variableListObject = {} as {
    [name in ValueOf<variableList> & string]: expr.Expr;
  };
  for (const typeName of typeList) {
    typeListObject[
      typeName as ValueOf<typeList> & string
    ] = typeExpr.importedType(path, typeName);
  }
  for (const variableName of variableList) {
    variableListObject[
      variableName as ValueOf<variableList> & string
    ] = expr.importedVariable(path, variableName);
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
  typeList: { [name in ValueOf<typeList> & string]: typeExpr.TypeExpr };
  variableList: { [name in ValueOf<variableList> & string]: expr.Expr };
} => {
  const typeListObject = {} as {
    [name in ValueOf<typeList> & string]: typeExpr.TypeExpr;
  };
  const variableListObject = {} as {
    [name in ValueOf<variableList> & string]: expr.Expr;
  };
  for (const typeName of typeList) {
    typeListObject[
      typeName as ValueOf<typeList> & string
    ] = typeExpr.globalType(typeName);
  }
  for (const variableName of variableList) {
    variableListObject[
      variableName as ValueOf<variableList> & string
    ] = expr.globalVariable(variableName);
  }
  return {
    typeList: typeListObject,
    variableList: variableListObject
  };
};
/**
 * 空のNode.js用コード
 */
export const emptyNodeJsCode: NodeJsCode = {
  exportTypeAliasList: [],
  exportVariableList: []
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

const scanNodeJsCode = (
  nodeJsCode: NodeJsCode
): scanType.NodeJsCodeScanData => {
  const scanData: scanType.NodeJsCodeScanData = {
    globalName: new Set(),
    importedModulePath: new Set()
  };
  for (const exportTypeAlias of nodeJsCode.exportTypeAliasList) {
    reservedWord.checkUsingReservedWord(
      "export type name",
      "型の名前",
      exportTypeAlias.name
    );
    scanData.globalName.add(exportTypeAlias.name);
    typeExpr.scan(exportTypeAlias.typeExpr, scanData);
  }
  for (const exportVariable of nodeJsCode.exportVariableList) {
    reservedWord.checkUsingReservedWord(
      "export variable name",
      "変数名",
      exportVariable.name
    );
    scanData.globalName.add(exportVariable.name);
    typeExpr.scan(exportVariable.typeExpr, scanData);
    expr.scanExpr(exportVariable.expr, scanData);
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
    new Set([...scanData.globalName, ...reservedWord.reservedWordSet])
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
          typeExpr.typeExprToString(
            exportTypeAlias.typeExpr,
            importedModuleNameMapAndNextIdentiferIndex.importedModuleNameMap
          )
      )
      .join(";\n") +
    "\n" +
    nodeJsCode.exportVariableList
      .map(
        (exportVariable): string =>
          "/** \n * " +
          exportVariable.document.split("\n").join("\n * ") +
          "\n" +
          exportVariableGetParameterDocument(exportVariable) +
          " */\nexport const " +
          exportVariable.name +
          ": " +
          typeExpr.typeExprToString(
            exportVariable.typeExpr,
            importedModuleNameMapAndNextIdentiferIndex.importedModuleNameMap
          ) +
          " = " +
          expr.exprToString(
            exportVariable.expr,
            importedModuleNameMapAndNextIdentiferIndex.importedModuleNameMap
          )
      )
      .join(";\n")
  );
};

/**
 *
 * @param exportVariable
 */
const exportVariableGetParameterDocument = (
  exportVariable: ExportVariable
): string => {
  switch (exportVariable.typeExpr._) {
    case typeExpr.TypeExpr_.FunctionWithReturn:
    case typeExpr.TypeExpr_.FunctionReturnVoid:
      return (
        exportVariable.typeExpr.parameter
          .map(p => " * @param " + p.name + " " + p.document)
          .join("\n") + "\n"
      );
  }
  return "";
};
