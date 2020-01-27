import * as indexedTypeExpr from "./indexedTree/typeExpr";
import * as indexedExpr from "./indexedTree/expr";
import * as scanType from "./scanType";
import * as identifer from "./identifer";

export { indexedTypeExpr };
export { indexedExpr };

/**
 * Node.js向けのコード。TypeScriptでも出力できるように型情報をつける必要がある
 */
export type NodeJsCode = {
  exportTypeAliasList: ReadonlyArray<ExportTypeAlias>;
  exportVariableList: ReadonlyArray<ExportFunctionVariable>;
};

type ExportTypeAlias = {
  readonly name: string;
  readonly document: string;
  readonly typeExpr: indexedTypeExpr.TypeExpr;
};

type ExportFunctionVariable = {
  readonly name: string;
  readonly document: string;
  readonly parameterList: ReadonlyArray<{
    name: string;
    document: string;
    typeExpr: indexedTypeExpr.TypeExpr;
  }>;
  readonly returnType: indexedTypeExpr.TypeExpr | null;
  readonly statementList: ReadonlyArray<indexedExpr.Statement>;
};

/* ======================================================================================
 *                                      Module
 * ====================================================================================== */
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
  typeList: { [name in ValueOf<typeList> & string]: indexedTypeExpr.TypeExpr };
  variableList: { [name in ValueOf<variableList> & string]: indexedExpr.Expr };
} => {
  const typeListObject = {} as {
    [name in ValueOf<typeList> & string]: indexedTypeExpr.TypeExpr;
  };
  const variableListObject = {} as {
    [name in ValueOf<variableList> & string]: indexedExpr.Expr;
  };
  for (const typeName of typeList) {
    typeListObject[
      typeName as ValueOf<typeList> & string
    ] = indexedTypeExpr.importedType(path, typeName);
  }
  for (const variableName of variableList) {
    variableListObject[
      variableName as ValueOf<variableList> & string
    ] = indexedExpr.importedVariable(path, variableName);
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
  typeList: { [name in ValueOf<typeList> & string]: indexedTypeExpr.TypeExpr };
  variableList: { [name in ValueOf<variableList> & string]: indexedExpr.Expr };
} => {
  const typeListObject = {} as {
    [name in ValueOf<typeList> & string]: indexedTypeExpr.TypeExpr;
  };
  const variableListObject = {} as {
    [name in ValueOf<variableList> & string]: indexedExpr.Expr;
  };
  for (const typeName of typeList) {
    typeListObject[
      typeName as ValueOf<typeList> & string
    ] = indexedTypeExpr.globalType(typeName);
  }
  for (const variableName of variableList) {
    variableListObject[
      variableName as ValueOf<variableList> & string
    ] = indexedExpr.globalVariable(variableName);
  }
  return {
    typeList: typeListObject,
    variableList: variableListObject
  };
};

const scanNodeJsCode = (
  nodeJsCode: NodeJsCode
): scanType.NodeJsCodeScanData => {
  const scanData: scanType.NodeJsCodeScanData = {
    globalName: new Set(),
    importedModulePath: new Set()
  };
  for (const exportTypeAlias of nodeJsCode.exportTypeAliasList) {
    identifer.checkUsingReservedWord(
      "export type name",
      "外部に公開する型の名前",
      exportTypeAlias.name
    );
    scanData.globalName.add(exportTypeAlias.name);
    indexedTypeExpr.scanGlobalVariableNameAndImportedPath(
      exportTypeAlias.typeExpr,
      scanData
    );
  }
  for (const exportVariable of nodeJsCode.exportVariableList) {
    identifer.checkUsingReservedWord(
      "export variable name",
      "外部に公開する変数名",
      exportVariable.name
    );
    scanData.globalName.add(exportVariable.name);
    if (exportVariable.returnType !== null) {
      indexedTypeExpr.scanGlobalVariableNameAndImportedPath(
        exportVariable.returnType,
        scanData
      );
    }
    indexedExpr.scanGlobalVariableNameAndImportedPathInStatementList(
      exportVariable.statementList,
      scanData
    );
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
    const identiferAndNextIdentiferIndex = identifer.createIdentifer(
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
  // グローバル空間にある名前とimportしたモジュールのパスを集める
  const scanData = scanNodeJsCode(nodeJsCode);
  const importedModuleNameMapAndNextIdentiferIndex = createImportedModuleName(
    scanData.importedModulePath,
    0,
    new Set([...scanData.globalName, ...identifer.reservedWordSet])
  );
  for (const exportVariable of nodeJsCode.exportVariableList) {
    const namedExpr = indexedExpr.toNamedExpr(exportVariable.statementList);
  }

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
          indexedTypeExpr.typeExprToString(
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
          indexedTypeExpr.typeExprToString(
            exportVariable.typeExpr,
            importedModuleNameMapAndNextIdentiferIndex.importedModuleNameMap
          ) +
          " = " +
          indexedExpr.exprToString(
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
  exportVariable: ExportFunctionVariable
): string => {
  switch (exportVariable.typeExpr._) {
    case indexedTypeExpr.TypeExpr_.FunctionWithReturn:
    case indexedTypeExpr.TypeExpr_.FunctionReturnVoid:
      return (
        exportVariable.typeExpr.parameter
          .map(p => " * @param " + p.name + " " + p.document)
          .join("\n") + "\n"
      );
  }
  return "";
};
